import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: 'order_id required' }, { status: 400 });

    // Generate a fresh token
    const token = crypto.randomUUID().replace(/-/g, '');
    await base44.asServiceRole.entities.PurchaseOrder.update(order_id, { supplier_token: token });

    const origin = req.headers.get('origin') || 'https://app.base44.com';
    const portalUrl = `${origin}/SupplierPortal?token=${token}`;

    // Fetch order details
    const orders = await base44.asServiceRole.entities.PurchaseOrder.filter({ id: order_id, environment: 'LIVE' });
    const order = orders?.[0];

    if (!order?.supplier_email) {
      return Response.json({ portal_url: portalUrl, emailed: false, reason: 'No supplier email on file' });
    }

    const linesSummary = (order.lines || [])
      .map(l => `  - ${l.name} (SKU: ${l.sku || '—'})  ×${l.qty}`)
      .join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.supplier_email,
      from_name: 'Invyra Procurement',
      subject: `AMENDED: Purchase Order ${order.order_number} — Please Review`,
      body: `Dear ${order.supplier},\n\nPurchase order ${order.order_number} has been amended by the buyer. The previous confirmation has been reset and a new review is required.\n\nUpdated Order Lines:\n${linesSummary || '  (see portal for details)'}\n\nPlease review the updated order and reconfirm using the link below:\n${portalUrl}\n\nThis link is unique to your order. No login is required.\n\nThank you,\nInvyra Procurement`,
    });

    return Response.json({ portal_url: portalUrl, emailed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});