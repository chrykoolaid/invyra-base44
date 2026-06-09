import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: 'order_id required' }, { status: 400 });

    // Generate a simple unique token
    const token = crypto.randomUUID().replace(/-/g, '');

    await base44.asServiceRole.entities.PurchaseOrder.update(order_id, { supplier_token: token });

    // Build the portal URL — use the app's origin
    const origin = req.headers.get('origin') || 'https://app.base44.com';
    const portalUrl = `${origin}/SupplierPortal?token=${token}`;

    // Fetch the order to get supplier email and order number
    const orders = await base44.asServiceRole.entities.PurchaseOrder.filter({ id: order_id, environment: 'LIVE' });
    const order = orders?.[0];

    if (order?.supplier_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: order.supplier_email,
        from_name: 'Invyra Procurement',
        subject: `Purchase Order ${order.order_number} — Action Required`,
        body: `Dear ${order.supplier},\n\nYou have received a new purchase order from Invyra.\n\nOrder: ${order.order_number}\nExpected Delivery: ${order.expected_date || 'TBD'}\n\nPlease review and confirm the order using the link below:\n${portalUrl}\n\nThis link is unique to your order. No login is required.\n\nThank you,\nInvyra Procurement`,
      });
    }

    return Response.json({ token, portal_url: portalUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});