import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { event } = payload;

    if (event.type !== 'update' && event.type !== 'create') {
      return Response.json({ success: true });
    }

    // Fetch the receiving record
    const record = await base44.asServiceRole.entities.ReceivingRecord.filter({ environment: 'LIVE' });
    const receivingRecord = record.find(r => r.id === event.entity_id);

    if (!receivingRecord || receivingRecord.status !== 'Discrepancy') {
      return Response.json({ success: true });
    }

    // Fetch supplier email from PurchaseOrder
    const poRecords = await base44.asServiceRole.entities.PurchaseOrder.filter({
      order_number: receivingRecord.po_number,
      environment: 'LIVE'
    });
    const po = poRecords?.[0];

    if (!po || !po.supplier_email) {
      return Response.json({ success: true, message: 'No supplier email found' });
    }

    // Build email content
    const discrepancyItems = receivingRecord.items
      ?.filter(item => item.discrepancy_reason || item.supplier_stated_reason)
      .map(item => `
- ${item.item}
  Expected: ${item.expected} ${item.unit}
  Received: ${item.received} ${item.unit}
  Reason: ${item.supplier_stated_reason || item.discrepancy_reason || 'Not specified'}
  Notes: ${item.discrepancy_note || 'None'}
      `.trim())
      .join('\n\n') || 'No items with discrepancies recorded';

    const emailBody = `
Hi ${po.supplier},

A discrepancy report has been logged for your purchase order ${receivingRecord.po_number}.

DISCREPANCY SUMMARY
===================
PO Number: ${receivingRecord.po_number}
Received By: ${receivingRecord.confirmed_by}
Date: ${new Date(receivingRecord.confirmed_at).toLocaleString()}

FLAGGED ITEMS
=============
${discrepancyItems}

Please review the flagged items and contact us if you have any questions about these discrepancies.

Best regards,
Invyra Receiving Team
    `.trim();

    // Send email via SendEmail integration
    const emailResponse = await base44.asServiceRole.integrations.Core.SendEmail({
      to: po.supplier_email,
      subject: `Discrepancy Report - PO ${receivingRecord.po_number}`,
      body: emailBody,
    });

    return Response.json({
      success: true,
      message: `Email sent to ${po.supplier_email}`,
      data: emailResponse,
    });
  } catch (error) {
    console.error('Error sending discrepancy email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});