import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (user.role || '').toLowerCase();
    if (!['manager', 'admin', 'owner'].includes(role)) {
      return Response.json({ error: 'Forbidden: only Manager, Admin, or Owner may edit item governance.' }, { status: 403 });
    }

    const body = await req.json();
    const { item_id, governance_reason, ...governanceFields } = body;

    if (!item_id) return Response.json({ error: 'item_id is required.' }, { status: 400 });
    if (!governance_reason || !governance_reason.trim()) {
      return Response.json({ error: 'A governance_reason is required for audit compliance.' }, { status: 400 });
    }

    // Allowed governance-only fields — no stock fields permitted
    const ALLOWED_FIELDS = [
      'name', 'unit', 'product_category', 'pack_size', 'tax_group', 'is_active',
      'pos_sellable', 'reorder_eligible', 'expiry_tracking_required', 'batch_tracking_required',
      'markdown_eligible', 'wastage_eligible', 'stocktake_eligible', 'transfer_eligible',
      'supplier_item_code', 'supplier_pack_size', 'supplier_uom', 'preferred_supplier',
      'governance_notes',
    ];

    const safePayload = {};
    for (const field of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(governanceFields, field)) {
        safePayload[field] = governanceFields[field];
      }
    }

    if (Object.keys(safePayload).length === 0) {
      return Response.json({ error: 'No valid governance fields provided.' }, { status: 400 });
    }

    const item = await base44.asServiceRole.entities.InventoryItem.get(item_id);
    if (!item) return Response.json({ error: 'Item not found.' }, { status: 404 });

    const now = new Date().toISOString();
    safePayload.governance_updated_by = user.email || user.full_name || user.id;
    safePayload.governance_updated_at = now;

    const updated = await base44.asServiceRole.entities.InventoryItem.update(item_id, safePayload);

    await base44.asServiceRole.entities.AuditLog.create({
      item_id,
      sku: item.sku,
      item_name: item.name,
      change_type: 'ITEM_UPDATE',
      field_name: 'item_governance',
      old_value: JSON.stringify(
        ALLOWED_FIELDS.reduce((acc, f) => {
          if (Object.prototype.hasOwnProperty.call(safePayload, f) && f !== 'governance_updated_by' && f !== 'governance_updated_at') {
            acc[f] = item[f] ?? null;
          }
          return acc;
        }, {})
      ),
      new_value: JSON.stringify(safePayload),
      changed_by: user.email || user.full_name || user.id,
      actor_role: role,
      source_module: 'ItemGovernance',
      action_type: 'GOVERNANCE_UPDATE',
      linked_source_record: item_id,
      source_record_id: item_id,
      notes: governance_reason.trim(),
      environment: item.environment || 'LIVE',
    });

    return Response.json({ success: true, item: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});