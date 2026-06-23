import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const getPhysicalQty = (item: Record<string, unknown>) => {
  const raw = item.physical_qty ?? item.physicalQty ?? item.scan_qty ?? item.scanQty ?? item.count ?? item.onHand ?? item.qty;
  if (raw === undefined || raw === null || raw === '') return null;

  const qty = Number(raw);
  if (!Number.isFinite(qty)) return null;
  return qty;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    const { scanData, scanTimestamp, sessionId, sourceRef } = body;

    if (!Array.isArray(scanData) || scanData.length === 0) {
      return Response.json({ error: 'Invalid or empty scanData array' }, { status: 400 });
    }

    // Validate physical scan evidence only. Item identity and system stock are resolved by Gap Scan from Inventory truth.
    const validatedData = scanData.map((item, idx) => {
      if (!item.sku) {
        throw new Error(`Row ${idx + 1}: missing sku`);
      }

      const physicalQty = getPhysicalQty(item);
      if (physicalQty === null) {
        throw new Error(`Row ${idx + 1}: missing physical quantity/count`);
      }

      return {
        sku: String(item.sku).trim(),
        name: item.name ? String(item.name) : '',
        physical_qty: physicalQty,
        scan_id: item.scan_id ? String(item.scan_id) : '',
        session_id: item.session_id ? String(item.session_id) : sessionId ? String(sessionId) : '',
        source_ref: item.source_ref ? String(item.source_ref) : sourceRef ? String(sourceRef) : '',
      };
    });

    return Response.json({
      success: true,
      dataCount: validatedData.length,
      scanTimestamp: scanTimestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      receivedBy: user.email,
      sourceType: 'PHYSICAL_SCAN_EVIDENCE',
      data: validatedData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
});
