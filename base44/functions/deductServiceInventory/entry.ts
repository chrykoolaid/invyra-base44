import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sales } = await req.json();
    // sales: Array of { service_id, qty_sold, site_id }

    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      return Response.json({ error: 'No sales provided' }, { status: 400 });
    }

    const results = [];

    for (const sale of sales) {
      const { service_id, qty_sold = 1, site_id } = sale;

      // 1. Fetch recipe components for this service
      const recipes = await base44.asServiceRole.entities.ServiceRecipe.filter({ service_id });

      if (!recipes || recipes.length === 0) {
        results.push({ service_id, status: 'no_recipe', deductions: [] });
        continue;
      }

      const deductions = [];

      for (const recipe of recipes) {
        const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: recipe.item_id });
        const item = items?.[0];
        if (!item) continue;

        const totalDeduction = recipe.qty_consumed * qty_sold;
        const newStock = Math.max(0, (item.stock ?? 0) - totalDeduction);

        // 2. Update stock balance on the item
        await base44.asServiceRole.entities.InventoryItem.update(item.id, { stock: newStock });

        // 3. Post a formal StockMovement ledger entry
        const ref = `POS-${Date.now().toString(36).toUpperCase()}`;
        await base44.asServiceRole.entities.StockMovement.create({
          site_id: site_id || item.site_id || '',
          item_id: item.id,
          sku: item.sku,
          item_name: item.name,
          movement_type: 'SALE',
          direction: 'OUT',
          qty: totalDeduction,
          balance_after: newStock,
          source_ref: ref,
          source_type: 'POS',
          notes: `POS auto-deduction via service recipe`,
          status: 'POSTED',
          posted_by: user.email || user.full_name || 'POS System',
        });

        deductions.push({
          item_id: item.id,
          item_name: item.name,
          sku: item.sku,
          deducted: totalDeduction,
          balance_after: newStock,
        });
      }

      results.push({ service_id, status: 'deducted', deductions });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});