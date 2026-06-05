import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
    const { scanData, scanTimestamp } = body;

    if (!Array.isArray(scanData) || scanData.length === 0) {
      return Response.json({ error: 'Invalid or empty scanData array' }, { status: 400 });
    }

    // Validate each record has required fields
    const validatedData = scanData.map((item, idx) => {
      if (!item.sku || !item.name) {
        throw new Error(`Row ${idx + 1}: missing sku or name`);
      }
      return {
        sku: String(item.sku),
        name: String(item.name),
        onHand: Number(item.onHand) || 0,
        avgUse: Number(item.avgUse) || 0,
        daysLeft: Number(item.daysLeft) || 0,
        suggested: Number(item.suggested) || 0,
        risk: String(item.risk || 'None'),
        flag: String(item.flag || 'OK'),
      };
    });

    // Return validated data formatted for GapScan display
    return Response.json({
      success: true,
      dataCount: validatedData.length,
      scanTimestamp: scanTimestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      receivedBy: user.email,
      data: validatedData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
});