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
      const ref = `POS-${Date.now().toString(36).toUpperCase()}`;
      const postedBy = user.email || user.full_name || 'POS System';
      const actorRole = user.role || user.app_role || 'unknown';

      // Preflight first so POS never silently clamps or partially deducts this sale.
      for (const recipe of recipes) {
        const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: recipe.item_id, environment: 'LIVE' });
        const item = items?.[0];
        if (!item) continue;
        const totalDeduction = Number(recipe.qty_consumed || 0) * Number(qty_sold || 1);
        const balanceBefore = Number(item.stock ?? 0);
        if (totalDeduction > balanceBefore) {
          return Response.json({
            error: 'Insufficient stock',
            service_id,
            item_id: item.id,
            sku: item.sku,
            on_hand: balanceBefore,
            required: totalDeduction,
          }, { status: 409 });
        }
        deductions.push({ item, totalDeduction, balanceBefore, balanceAfter: balanceBefore - totalDeduction });
      }

      for (const deduction of deductions) {
        const { item, totalDeduction, balanceBefore, balanceAfter } = deduction;
        const movement = await base44.asServiceRole.entities.StockMovement.create({
          site_id: site_id || item.site_id || '',
          item_id: item.id,
          sku: item.sku,
          item_name: item.name,
          movement_type: 'SALE',
          direction: 'OUT',
          qty: totalDeduction,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          source_ref: ref,
          source_type: 'POS',
          notes: `POS auto-deduction via service recipe`,
          status: 'POSTED',
          posted_by: postedBy,
          actor_role: actorRole,
          environment: 'LIVE',
        });

        const audit = await base44.asServiceRole.entities.AuditLog.create({
          item_id: item.id,
          sku: item.sku,
          item_name: item.name,
          change_type: 'STOCK_SALE',
          action_type: 'SALE',
          field_name: 'stock',
          old_value: String(balanceBefore),
          new_value: String(balanceAfter),
          changed_by: postedBy,
          actor_role: actorRole,
          source_module: 'POS',
          linked_movement_id: movement.id,
          linked_source_record: ref,
          notes: 'POS auto-deduction via service recipe',
          environment: 'LIVE',
        });

        try {
          await base44.asServiceRole.entities.InventoryItem.update(item.id, { stock: balanceAfter, environment: 'LIVE' });
        } catch (error) {
          try { await base44.asServiceRole.entities.AuditLog.delete(audit.id); } catch (_) {}
          try { await base44.asServiceRole.entities.StockMovement.delete(movement.id); } catch (_) {}
          throw error;
        }
      }

      const responseDeductions = deductions.map(({ item, totalDeduction, balanceAfter }) => ({
        item_id: item.id,
        item_name: item.name,
        sku: item.sku,
        deducted: totalDeduction,
        balance_after: balanceAfter,
      }));

      results.push({ service_id, status: 'deducted', deductions: responseDeductions });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});