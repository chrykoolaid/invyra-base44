import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { xeroTenantId, xeroAccessToken } = await req.json();

    if (!xeroTenantId || !xeroAccessToken) {
      return Response.json({ error: 'Missing Xero credentials' }, { status: 400 });
    }

    // Fetch all active inventory items
    const items = await base44.asServiceRole.entities.InventoryItem.filter({ is_active: true }, '', 500);

    // Build Xero inventory items payload
    const xeroItems = items.map(item => ({
      Code: item.sku || '',
      Name: item.name || '',
      Description: `Stock: ${item.stock || 0} ${item.unit || 'units'}`,
      InventoryAssetAccountCode: '630', // Standard asset account
      UnitAmount: item.cost_per_unit || 0,
      TrackingCategories: [],
    })).filter(i => i.Code);

    if (xeroItems.length === 0) {
      return Response.json({ synced: 0, message: 'No items to sync' });
    }

    // Sync to Xero API (batch items)
    const xeroResponse = await fetch('https://api.xero.com/api.xro/2.0/Items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xeroAccessToken}`,
        'Xero-tenant-id': xeroTenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Items: xeroItems.slice(0, 50) }), // Limit to 50 per batch
    });

    if (!xeroResponse.ok) {
      const errorData = await xeroResponse.text();
      throw new Error(`Xero sync failed: ${xeroResponse.status} - ${errorData}`);
    }

    const result = await xeroResponse.json();
    const syncedCount = result.Items ? result.Items.length : 0;

    return Response.json({
      synced: syncedCount,
      total: items.length,
      message: `Synced ${syncedCount} items to Xero`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});