import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * createMarkdownBatch
 * Creates a new MarkdownBatch (Pending_Approval or Active depending on role/settings).
 * Role normalised to lowercase before all comparisons.
 */

function normaliseRole(role) {
  return (role || '').toLowerCase().trim();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = normaliseRole(user.role);
  const { sku, item_id, item_name, allocated_qty, site_id, environment = 'LIVE' } = await req.json();

  if (!sku || !item_id || !item_name || !allocated_qty || allocated_qty <= 0) {
    return Response.json({ error: 'sku, item_id, item_name, and a positive allocated_qty are required.' }, { status: 400 });
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

  const batch = await base44.asServiceRole.entities.MarkdownBatch.create({
    batch_ref: batchRef,
    sku,
    item_id,
    item_name,
    status: initialStatus,
    total_original_qty: allocated_qty,
    allocated_qty,
    current_remaining_qty: allocated_qty,
    removed_from_floor_qty: 0,
    sold_qty: 0,
    recovered_qty: 0,
    disposed_qty: 0,
    sell_through_pct: 0,
    current_round_number: 1,
    site_id: site_id || '',
    settings_snapshot: settings,
    initiated_by: user.id || user.email,
    approved_by: isPrivileged && !requiresApproval ? (user.id || user.email) : null,
    approved_at: isPrivileged && !requiresApproval ? new Date().toISOString() : null,
    environment,
  });

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: batch.id,
    event_type: 'MARKDOWN_CREATED',
    user_id: user.id || user.email,
    user_role: role,
    payload: {
      before: null,
      after: { status: initialStatus, allocated_qty, batch_ref: batchRef },
      meta: { requires_approval: requiresApproval }
    },
    created_at: new Date().toISOString(),
    environment,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id,
    sku,
    item_name,
    change_type: 'STOCK_ADJUST',
    field_name: 'markdown_batch',
    old_value: '',
    new_value: JSON.stringify({ batch_id: batch.id, status: initialStatus, allocated_qty }),
    changed_by: user.email || user.id,
    actor_role: role,
    source_module: 'Markdown',
    action_type: 'MARKDOWN_CREATED',
    linked_source_record: batch.id,
    source_record_id: batch.id,
    notes: `Markdown batch ${batchRef} created with ${allocated_qty} units. Status: ${initialStatus}.`,
    environment,
  });

  return Response.json({ success: true, batch, requires_approval: requiresApproval });
});