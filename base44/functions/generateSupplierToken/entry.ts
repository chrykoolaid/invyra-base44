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

    return Response.json({ token, portal_url: portalUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});