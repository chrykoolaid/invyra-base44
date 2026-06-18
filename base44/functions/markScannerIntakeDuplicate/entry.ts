import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeRole(role: string | undefined) {
  return (role || '').toLowerCase().trim();
}

function canProcessScanner(role: string) {
  return ['supervisor', 'manager', 'admin', 'owner'].includes(role);
}

async function createAlertWithAudit(base44: any, payload: any, user: any, environment: string) {
  const existing = await base44.asServiceRole.entities.StockOutAlert.filter(
    { dedupe_key: payload.dedupe_key, environment },
    '-created_date',
    1,
  );
  if (existing && existing.length > 0 && ['OPEN', 'ACKNOWLEDGED'].includes(existing[0].status)) {
    return existing[0];
  }

  const alert = await base44.asServiceRole.entities.StockOutAlert.create({
    ...payload,
    status: payload.status || 'OPEN',
    environment,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: payload.metadata?.item_id || '',
    sku: payload.metadata?.sku || '',
    item_name: payload.metadata?.item_name || '',
    change_type: 'STOCK_WASTE',
    field_name: 'stock_out_alert',
    old_value: '',
    new_value: alert.alert_type,
    changed_by: user?.email || user?.id || 'system',
    actor_role: normalizeRole(user?.role) || 'system',
    source_module: 'StockOutAlerts',
    action_type: 'STOCK_OUT_ALERT_CREATED',
    linked_source_record: payload.linked_record_id || payload.linked_intake_id || payload.linked_amendment_id || '',
    source_record_id: alert.id,
    notes: `Alert created: ${payload.alert_type}. ${payload.trigger_reason}`,
    environment,
  });

  return alert;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = normalizeRole(user.role);
  if (!canProcessScanner(role)) {
    return Response.json({ error: 'Forbidden: Supervisor, Manager, Admin, or Owner required.' }, { status: 403 });
  }

  const { intake_id, duplicate_reason, duplicate_of = '', environment = 'LIVE' } = await req.json();
  if (!intake_id || !duplicate_reason) {
    return Response.json({ error: 'intake_id and duplicate_reason are required.' }, { status: 400 });
  }

  const intakes = await base44.asServiceRole.entities.ScannerIntakeQueue.filter({ id: intake_id, environment });
  const intake = intakes[0];
  if (!intake) return Response.json({ error: 'Scanner intake not found.' }, { status: 404 });

  if (intake.generated_record_id) {
    return Response.json({ error: 'Cannot mark duplicate after a StockOutRecord has been generated.' }, { status: 409 });
  }
  if (intake.sync_status !== 'QUEUED' && intake.sync_status !== 'CONFLICT') {
    return Response.json({ error: `Cannot mark intake in ${intake.sync_status} status as duplicate.` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const updated = await base44.asServiceRole.entities.ScannerIntakeQueue.update(intake_id, {
    sync_status: 'DUPLICATE',
    is_duplicate: true,
    duplicate_of,
    duplicate_reason,
    reviewed_by: user.id || user.email,
    reviewed_at: now,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: intake.resolved_item_id || '',
    sku: intake.resolved_sku || intake.raw_barcode || '',
    item_name: '',
    change_type: 'STOCK_WASTE',
    field_name: 'scanner_intake_duplicate',
    old_value: intake.sync_status || 'QUEUED',
    new_value: 'DUPLICATE',
    changed_by: user.email || user.id,
    actor_role: role,
    source_module: 'Scanner',
    action_type: 'SCANNER_INTAKE_DUPLICATE_MARKED',
    linked_source_record: intake_id,
    source_record_id: intake_id,
    notes: `Scanner intake marked duplicate. Reason: ${duplicate_reason}`,
    environment,
  });

  await createAlertWithAudit(base44, {
    alert_type: 'DUPLICATE_SCAN',
    severity: 'MEDIUM',
    linked_intake_id: intake_id,
    trigger_reason: `Scanner intake marked duplicate. Reason: ${duplicate_reason}`,
    dedupe_key: `DUPLICATE_SCAN_${intake.session_id || 'NOSESSION'}_${intake.raw_barcode || intake_id}`,
    metadata: {
      item_id: intake.resolved_item_id || '',
      sku: intake.resolved_sku || intake.raw_barcode || '',
      quantity: intake.quantity || 0,
      device_id: intake.device_id || '',
      session_id: intake.session_id || '',
      raw_barcode: intake.raw_barcode || '',
    },
  }, user, environment);

  return Response.json({ success: true, intake: updated, action: 'duplicate_marked' });
});
