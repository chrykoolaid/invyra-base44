import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * processScannerIntake
 * Resolves a scanner intake queue entry and generates a draft StockOutRecord.
 * Does NOT post stock directly.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase().trim();
  if (!['supervisor', 'manager', 'admin', 'owner'].includes(role)) {
    return Response.json({ error: 'Forbidden: Supervisor, Manager, Admin, or Owner required to process scanner intake.' }, { status: 403 });
  }

  const {
    intake_id,
    accept = true, // true to resolve, false to reject
    resolved_sku,
    resolved_item_id,
    proposed_stock_out_class = 'WASTAGE',
    proposed_reason_category,
    location,
    department,
    rejection_reason,
    environment = 'LIVE',
  } = await req.json();

  if (!intake_id) return Response.json({ error: 'intake_id is required.' }, { status: 400 });

  const intakes = await base44.asServiceRole.entities.ScannerIntakeQueue.filter({ id: intake_id });
  const intake = intakes[0];
  if (!intake) return Response.json({ error: 'Intake entry not found.' }, { status: 404 });

  if (intake.sync_status !== 'QUEUED') {
    return Response.json({ error: `Cannot process intake in status: ${intake.sync_status}` }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (!accept) {
    // Reject intake
    await base44.asServiceRole.entities.ScannerIntakeQueue.update(intake_id, {
      sync_status: 'REJECTED',
      unresolved_reason: rejection_reason || 'Rejected by reviewer',
      reviewed_by: user.id || user.email,
      reviewed_at: now,
    });

    await base44.asServiceRole.entities.AuditLog.create({
      item_id: '',
      sku: intake.resolved_sku || intake.raw_barcode,
      item_name: '',
      change_type: 'STOCK_WASTE',
      field_name: 'scanner_intake_rejected',
      old_value: 'QUEUED',
      new_value: 'REJECTED',
      changed_by: user.email || user.id,
      actor_role: user.role,
      source_module: 'Wastage',
      action_type: 'SCANNER_INTAKE_REJECTED',
      linked_source_record: intake_id,
      notes: `Scanner intake rejected. Reason: ${rejection_reason || 'N/A'}`,
      environment,
    });

    return Response.json({ success: true, intake_id, action: 'rejected' });
  }

  // Accept and generate draft record
  if (!resolved_sku || !resolved_item_id || !proposed_reason_category) {
    return Response.json({
      error: 'resolved_sku, resolved_item_id, and proposed_reason_category are required to accept intake.',
    }, { status: 400 });
  }

  // Check if this was an unknown barcode (original barcode doesn't match resolved SKU)
  const wasUnknownBarcode = Boolean(intake.raw_barcode && resolved_sku && intake.raw_barcode !== resolved_sku);

  // Fetch item for naming and cost
  let item = null;
  let itemName = resolved_sku;
  let estimatedValue = 0;
  try {
    const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: resolved_item_id });
    item = items[0];
    if (item) {
      itemName = item.name;
      estimatedValue = intake.quantity * (item.cost_per_unit || 0);
    }
  } catch (_) {
    estimatedValue = 0;
  }

  // Create draft StockOutRecord
  const record = await base44.asServiceRole.entities.StockOutRecord.create({
    sku: resolved_sku,
    item_id: resolved_item_id,
    item_name: itemName,
    stock_out_class: proposed_stock_out_class,
    quantity: intake.quantity,
    reason_category: proposed_reason_category,
    reason_notes: `Scanned on device ${intake.device_id}, session ${intake.session_id}`,
    location: location || intake.location || '',
    department: department || intake.department || '',
    cost_centre: '',
    estimated_value: estimatedValue,
    source: 'SCANNER',
    source_reference: intake_id,
    status: 'DRAFT',
    site_id: intake.site_id || '',
    created_by: user.id || user.email,
    created_by_email: user.email || '',
    environment,
  });

  // Update intake to resolved
  await base44.asServiceRole.entities.ScannerIntakeQueue.update(intake_id, {
    sync_status: 'RESOLVED',
    resolved_sku,
    resolved_item_id,
    generated_record_id: record.id,
    reviewed_by: user.id || user.email,
    reviewed_at: now,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: resolved_item_id,
    sku: resolved_sku,
    item_name: itemName,
    change_type: 'STOCK_WASTE',
    field_name: 'scanner_intake_resolved',
    old_value: 'QUEUED',
    new_value: 'RESOLVED',
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Wastage',
    action_type: 'SCANNER_INTAKE_RESOLVED',
    linked_source_record: intake_id,
    source_record_id: record.id,
    notes: `Scanner intake resolved. Generated draft ${proposed_stock_out_class} record.`,
    environment,
  });

  // Create alert if this was an unknown barcode, and audit alert creation.
  if (wasUnknownBarcode) {
    const existingAlerts = await base44.asServiceRole.entities.StockOutAlert.filter(
      { dedupe_key: `UNKNOWN_BARCODE_${intake.raw_barcode}`, environment },
      '-created_date',
      1,
    );
    let alert = existingAlerts?.[0];
    if (!alert || !['OPEN', 'ACKNOWLEDGED'].includes(alert.status)) {
      alert = await base44.asServiceRole.entities.StockOutAlert.create({
        alert_type: 'UNKNOWN_BARCODE',
        severity: 'MEDIUM',
        status: 'OPEN',
        linked_record_id: record.id,
        linked_intake_id: intake_id,
        trigger_reason: `Unknown barcode resolved: ${intake.raw_barcode} → ${resolved_sku}`,
        dedupe_key: `UNKNOWN_BARCODE_${intake.raw_barcode}`,
        metadata: {
          item_id: resolved_item_id,
          sku: resolved_sku,
          item_name: itemName,
          quantity: intake.quantity,
          raw_barcode: intake.raw_barcode,
          device_id: intake.device_id || '',
          session_id: intake.session_id || '',
        },
        environment,
      });

      await base44.asServiceRole.entities.AuditLog.create({
        item_id: resolved_item_id,
        sku: resolved_sku,
        item_name: itemName,
        change_type: 'STOCK_WASTE',
        field_name: 'stock_out_alert',
        old_value: '',
        new_value: 'UNKNOWN_BARCODE',
        changed_by: user.email || user.id,
        actor_role: role,
        source_module: 'StockOutAlerts',
        action_type: 'STOCK_OUT_ALERT_CREATED',
        linked_source_record: record.id,
        source_record_id: alert.id,
        notes: `Alert created for unknown barcode ${intake.raw_barcode}`,
        environment,
      });
    }
  }

  return Response.json({
    success: true,
    intake_id,
    generated_record_id: record.id,
    action: 'resolved',
  });
});