import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const role = (user?.role || '').toLowerCase().trim();

    if (!user || !['supervisor', 'manager', 'admin', 'owner'].includes(role)) {
      return Response.json({ error: 'Forbidden: Supervisor access required' }, { status: 403 });
    }

    const { alert_id, deduped_of = null, dedupe_key = null } = await req.json();
    if (!alert_id) {
      return Response.json({ error: 'Missing alert_id' }, { status: 400 });
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

    if (deduped_of) {
      const target = await base44.asServiceRole.entities.StockOutAlert.filter({ id: deduped_of, environment: 'LIVE' }, '-created_date', 1);
      if (!target || target.length === 0) {
        return Response.json({ error: 'Dedupe target alert not found' }, { status: 404 });
      }
    }

    const now = new Date().toISOString();
    const oldStatus = currentAlert.status;

    await base44.asServiceRole.entities.StockOutAlert.update(alert_id, {
      status: 'DEDUPED',
      deduped_by: user.id || user.email,
      deduped_at: now,
      deduped_of,
      dedupe_key: dedupe_key || currentAlert.dedupe_key,
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
      linked_source_record: currentAlert.linked_record_id || currentAlert.linked_intake_id || '',
      source_record_id: alert_id,
      notes: deduped_of
        ? `Stock-out alert marked as duplicate of alert ${deduped_of}. Type: ${currentAlert.alert_type}`
        : `Stock-out alert deduped by key ${dedupe_key || currentAlert.dedupe_key}. Type: ${currentAlert.alert_type}`,
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
