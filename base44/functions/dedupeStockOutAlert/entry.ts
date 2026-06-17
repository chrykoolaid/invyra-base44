import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['supervisor', 'manager', 'admin'].includes((user.role || '').toLowerCase())) {
      return Response.json({ error: 'Forbidden: Supervisor access required' }, { status: 403 });
    }

    const { alert_id, deduped_of } = await req.json();
    if (!alert_id || !deduped_of) {
      return Response.json({ error: 'Missing alert_id or deduped_of' }, { status: 400 });
    }

    const alert = await base44.asServiceRole.entities.StockOutAlert.filter({
      id: alert_id,
      environment: 'LIVE',
    }, '-created_date', 1);

    if (!alert || alert.length === 0) {
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    const currentAlert = alert[0];
    if (!['OPEN', 'ACKNOWLEDGED'].includes(currentAlert.status)) {
      return Response.json({ error: `Cannot dedupe alert in ${currentAlert.status} status` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const oldStatus = currentAlert.status;
    const role = (user.role || '').toLowerCase();

    await base44.asServiceRole.entities.StockOutAlert.update(alert_id, {
      status: 'DEDUPED',
      deduped_by: user.id || user.email,
      deduped_at: now,
      deduped_of: deduped_of,
    });

    await base44.asServiceRole.entities.AuditLog.create({
      item_id: currentAlert.metadata?.item_id || '',
      sku: currentAlert.metadata?.sku || '',
      item_name: currentAlert.metadata?.item_name || '',
      change_type: 'STOCK_WASTE',
      field_name: 'status',
      old_value: oldStatus,
      new_value: 'DEDUPED',
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'Alerts',
      action_type: 'ALERT_DEDUPED',
      linked_source_record: currentAlert.linked_record_id,
      source_record_id: alert_id,
      notes: `Stock-out alert marked as duplicate of ${deduped_of}. Type: ${currentAlert.alert_type}`,
      environment: 'LIVE',
    });

    return Response.json({
      success: true,
      alert_id,
      status: 'DEDUPED',
      deduped_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});