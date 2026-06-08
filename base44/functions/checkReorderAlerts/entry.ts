import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [items, adminUsers, recentAlerts] = await Promise.all([
      base44.asServiceRole.entities.InventoryItem.list('', 500),
      base44.asServiceRole.entities.User.filter({ role: 'admin' }),
      base44.asServiceRole.entities.StockAlert.list('-created_date', 500),
    ]);

    // Items at or below reorder point (with a reorder point set, and active)
    const belowReorder = (items || []).filter(i =>
      i.reorder_point && (i.stock ?? 0) <= i.reorder_point && i.is_active !== false
    );

    if (belowReorder.length === 0) {
      return Response.json({ message: 'No items below reorder point', sent: 0 });
    }

    // Avoid re-alerting the same item within 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyAlerted = new Set(
      (recentAlerts || [])
        .filter(a => new Date(a.created_date) >= cutoff)
        .map(a => a.item_id)
    );

    const newAlerts = belowReorder.filter(i => !recentlyAlerted.has(i.id));

    if (newAlerts.length === 0) {
      return Response.json({ message: 'All low-stock alerts already sent within 24h', sent: 0 });
    }

    // Admin emails
    const adminEmails = (adminUsers || []).map(u => u.email).filter(Boolean);
    if (adminEmails.length === 0) {
      return Response.json({ message: 'No admin users found to notify', sent: 0 });
    }

    // Build email
    const itemRows = newAlerts
      .map(item => {
        const onHand = item.stock ?? 0;
        const reorderQtyNote = item.reorder_qty ? ` (suggested order: ${item.reorder_qty} ${item.unit || 'units'})` : '';
        return `  • ${item.name} (${item.sku}) — ${onHand} ${item.unit || 'units'} on hand, reorder point: ${item.reorder_point}${reorderQtyNote}`;
      })
      .join('\n');

    const subject = `⚠️ Invyra Stock Alert — ${newAlerts.length} item${newAlerts.length > 1 ? 's' : ''} below reorder point`;

    const body = `Hi,

The following laundry inventory items have fallen below their reorder points and require immediate attention:

${itemRows}

Please log in to Invyra and review the Reorder Review or Exceptions page to place orders.

---
This is an automated alert from Invyra Inventory Management.
Alerts are sent once per item per 24-hour window.`;

    // Send to all admins
    for (const email of adminEmails) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body,
        from_name: 'Invyra Alerts',
      });
    }

    // Record each alert to prevent duplicate sends
    for (const item of newAlerts) {
      await base44.asServiceRole.entities.StockAlert.create({
        item_id: item.id,
        item_name: item.name,
        sku: item.sku,
        stock_at_alert: item.stock ?? 0,
        reorder_point: item.reorder_point,
        alert_sent_to: adminEmails.join(', '),
      });
    }

    return Response.json({
      message: `Alerts sent for ${newAlerts.length} item(s)`,
      sent: newAlerts.length,
      notified: adminEmails,
      items: newAlerts.map(i => `${i.sku} — ${i.name}`),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});