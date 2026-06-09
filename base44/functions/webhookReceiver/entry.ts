import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Extract webhook payload
    const payload = await req.json();
    const { event_type, resource_type, data, webhook_secret } = payload;

    // Validate webhook signature if secret is provided
    const appWebhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (appWebhookSecret && webhook_secret !== appWebhookSecret) {
      return Response.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Route by event type
    if (event_type === 'inventory.update' && resource_type === 'stock_movement') {
      // Handle external stock movement push
      const { site_id, sku, qty, direction, source_ref } = data;

      if (!sku || !qty || !direction) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Find inventory item by SKU
      const items = await base44.asServiceRole.entities.InventoryItem.filter({ sku, environment: 'LIVE' });
      if (!items || items.length === 0) {
        return Response.json({ error: 'SKU not found' }, { status: 404 });
      }

      const item = items[0];
      const currentStock = item.stock || 0;
      const movementQty = Number(qty || 0);
      if (direction === 'OUT' && movementQty > currentStock) {
        return Response.json({ error: 'Insufficient stock', sku, on_hand: currentStock, required: movementQty }, { status: 409 });
      }
      const newStock = direction === 'IN' ? currentStock + movementQty : currentStock - movementQty;

      // Update stock
      

      // Log movement
      await base44.asServiceRole.entities.StockMovement.create({
        site_id: site_id || '',
        item_id: item.id,
        sku: item.sku,
        item_name: item.name,
        movement_type: direction === 'IN' ? 'RECEIVE' : 'SALE',
        direction,
        qty: movementQty,
        balance_before: currentStock,
        balance_after: newStock,
        source_ref: source_ref || 'external-webhook',
        source_type: 'MANUAL',
        notes: 'Synced via webhook',
        status: 'POSTED',
        posted_by: 'webhook-system',
        actor_role: 'system',
        environment: 'LIVE',
      });

      await base44.asServiceRole.entities.AuditLog.create({
        item_id: item.id,
        sku: item.sku,
        item_name: item.name,
        change_type: direction === 'IN' ? 'STOCK_RECEIVE' : 'STOCK_SALE',
        action_type: direction === 'IN' ? 'RECEIVE' : 'SALE',
        field_name: 'stock',
        old_value: String(currentStock),
        new_value: String(newStock),
        changed_by: 'webhook-system',
        actor_role: 'system',
        source_module: 'Webhook Receiver',
        linked_source_record: source_ref || 'external-webhook',
        notes: 'Synced via webhook',
        environment: 'LIVE',
      });

      await base44.asServiceRole.entities.InventoryItem.update(item.id, { stock: newStock, environment: 'LIVE' });

      return Response.json({ status: 'success', new_stock: newStock });
    }

    if (event_type === 'order.created' && resource_type === 'purchase_order') {
      // Handle external PO creation
      const { supplier, items: poItems, expected_date } = data;

      if (!supplier || !poItems) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Generate PO number
      const timestamp = Date.now();
      const orderNumber = `EXT-${timestamp}`;

      // Create purchase order
      await base44.asServiceRole.entities.PurchaseOrder.create({
        order_number: orderNumber,
        supplier,
        status: 'Submitted',
        source: 'Webhook',
        expected_date,
        lines: poItems.map(i => ({
          sku: i.sku,
          name: i.name,
          qty: i.qty,
          unit_cost: i.unit_cost || 0,
          supplier,
        })),
        submitted_at: new Date().toISOString(),
        environment: 'LIVE',
      });

      return Response.json({ status: 'success', order_number: orderNumber });
    }

    return Response.json({ error: 'Unknown event type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});