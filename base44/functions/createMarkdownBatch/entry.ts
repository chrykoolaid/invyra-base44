import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * createMarkdownBatch
 * Creates a new MarkdownBatch (Pending_Approval or Active depending on role/settings).
 * Supports store-floor markdown request evidence: capture method, reason,
 * proposed Round 1 price, expiry/sell-by date, and notes.
 * Role normalised to lowercase before all comparisons.
 */

function normaliseRole(role) {
  return (role || '').toLowerCase().trim();
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = normaliseRole(user.role);
  const {
    sku,
    item_id,
    item_name,
    allocated_qty,
    site_id,
    environment = 'LIVE',
    capture_method = '',
    markdown_reason = '',
    initial_markdown_price,
    initial_original_price,
    initial_expiry_date,
    label_qty,
    request_notes = '',
    scanner_session_ref = '',
    requested_source = '',
  } = await req.json();

  const allocatedQty = Number(allocated_qty);
  if (!sku || !item_id || !item_name || !allocatedQty || allocatedQty <= 0) {
    return Response.json({ error: 'sku, item_id, item_name, and a positive allocated_qty are required.' }, { status: 400 });
  }

  const originalPrice = optionalNumber(initial_original_price);
  const markdownPrice = optionalNumber(initial_markdown_price);
  const expiryDate = initial_expiry_date || '';
  const hasRoundProposal = Boolean(markdownPrice || originalPrice || expiryDate);

  if (hasRoundProposal && (!markdownPrice || markdownPrice <= 0 || !expiryDate)) {
    return Response.json({ error: 'initial_markdown_price and initial_expiry_date are required when submitting markdown label details.' }, { status: 400 });
  }

  if (originalPrice !== null && originalPrice <= 0) {
    return Response.json({ error: 'initial_original_price must be greater than 0 when supplied.' }, { status: 400 });
  }

  if (originalPrice !== null && markdownPrice !== null && markdownPrice > originalPrice) {
    return Response.json({ error: 'Markdown price cannot be higher than original price.' }, { status: 400 });
  }

  const settingsRecords = await base44.asServiceRole.entities.MarkdownSettings.filter({ environment, is_active: true });
  const settings = settingsRecords[0] || {
    require_approval_for_new_batch: true,
    max_reprints: 2,
    variance_threshold_supervisor: 0.05,
    variance_threshold_manager: 0.10,
    review_warning_hours: 24,
    review_escalation_hours: 72,
    review_critical_hours: 96,
  };

  const isPrivileged = ['supervisor', 'manager', 'admin'].includes(role);
  const requiresApproval = settings.require_approval_for_new_batch && !isPrivileged;
  const initialStatus = requiresApproval ? 'Pending_Approval' : 'Active';
  const batchRef = `MB-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const now = new Date().toISOString();

  const requestMetadata = {
    capture_method,
    markdown_reason,
    initial_original_price: originalPrice,
    initial_markdown_price: markdownPrice,
    initial_expiry_date: expiryDate,
    label_qty: Number(label_qty || allocatedQty),
    request_notes,
    scanner_session_ref,
    requested_source,
    captured_at: now,
  };

  const batch = await base44.asServiceRole.entities.MarkdownBatch.create({
    batch_ref: batchRef,
    sku,
    item_id,
    item_name,
    status: initialStatus,
    total_original_qty: allocatedQty,
    allocated_qty: allocatedQty,
    current_remaining_qty: allocatedQty,
    removed_from_floor_qty: 0,
    sold_qty: 0,
    recovered_qty: 0,
    disposed_qty: 0,
    sell_through_pct: 0,
    current_round_number: 1,
    site_id: site_id || '',
    settings_snapshot: {
      ...settings,
      request_metadata: requestMetadata,
    },
    initiated_by: user.id || user.email,
    approved_by: isPrivileged && !requiresApproval ? (user.id || user.email) : null,
    approved_at: isPrivileged && !requiresApproval ? now : null,
    environment,
  });

  let round1 = null;
  if (initialStatus === 'Active' && markdownPrice && expiryDate) {
    const origPrice = originalPrice || markdownPrice;
    const discountPct = origPrice > 0
      ? Math.round((1 - markdownPrice / origPrice) * 10000) / 100
      : 0;
    const barcode = `MD-${batch.id.slice(-6).toUpperCase()}-R1-${Date.now().toString(36).toUpperCase()}`;

    round1 = await base44.asServiceRole.entities.MarkdownRound.create({
      batch_id: batch.id,
      round_number: 1,
      original_unit_price: origPrice,
      markdown_unit_price: markdownPrice,
      discount_percent: discountPct,
      expiry_date: expiryDate,
      markdown_barcode: barcode,
      barcode_status: 'Active',
      status: 'Active',
      created_by: user.id || user.email,
      approved_by: user.id || user.email,
      qty_at_round_start: allocatedQty,
      qty_sold_in_round: 0,
      print_count: 0,
      environment,
    });
  }

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: batch.id,
    round_id: round1?.id || null,
    event_type: 'MARKDOWN_CREATED',
    user_id: user.id || user.email,
    user_role: role,
    payload: {
      before: null,
      after: {
        status: initialStatus,
        allocated_qty: allocatedQty,
        batch_ref: batchRef,
        round1_id: round1?.id || null,
      },
      meta: {
        requires_approval: requiresApproval,
        request_metadata: requestMetadata,
      }
    },
    created_at: now,
    environment,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id,
    sku,
    item_name,
    change_type: 'STOCK_ADJUST',
    field_name: 'markdown_batch',
    old_value: '',
    new_value: JSON.stringify({ batch_id: batch.id, status: initialStatus, allocated_qty: allocatedQty, round1_id: round1?.id || null }),
    changed_by: user.email || user.id,
    actor_role: role,
    source_module: 'Markdown',
    action_type: 'MARKDOWN_CREATED',
    linked_source_record: batch.id,
    source_record_id: round1?.id || batch.id,
    notes: `Markdown batch ${batchRef} created with ${allocatedQty} units. Status: ${initialStatus}. Reason: ${markdown_reason || 'not supplied'}.`,
    environment,
  });

  return Response.json({ success: true, batch, round1, requires_approval: requiresApproval });
});
