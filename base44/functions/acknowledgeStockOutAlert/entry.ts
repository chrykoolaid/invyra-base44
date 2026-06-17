import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['supervisor', 'manager', 'admin'].includes((user.role || '').toLowerCase())) {
      return Response.json({ error: 'Forbidden: Supervisor access required' }, { status: 403 });
    }

    const { alert_id } = await req.json();
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
    if (currentAlert.status !== 'OPEN') {
      return Response.json({ error: `Cannot acknowledge alert in ${currentAlert.status} status` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const role = (user.role || '').toLowerCase();

    await base44.asServiceRole.entities.StockOutAlert.update(alert_id, {
      status: 'ACKNOWLEDGED',
      acknowledged_by: user.id || user.email,
      acknowledged_at: now,
    });

    await base44.asServiceRole.entities.AuditLog.create({
      item_id: currentAlert.metadata?.item_id || '',
      sku: currentAlert.metadata?.sku || '',
      item_name: currentAlert.metadata?.item_name || '',
      change_type: 'STOCK_WASTE',
      field_name: 'status',
      old_value: 'OPEN',
      new_value: 'ACKNOWLEDGED',
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'Alerts',
      action_type: 'ALERT_ACKNOWLEDGED',
      linked_source_record: currentAlert.linked_record_id,
      source_record_id: alert_id,
      notes: `Stock-out alert acknowledged. Type: ${currentAlert.alert_type}. Reason: ${currentAlert.trigger_reason}`,
      environment: 'LIVE',
    });

    return Response.json({
      success: true,
      alert_id,
      status: 'ACKNOWLEDGED',
      acknowledged_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});