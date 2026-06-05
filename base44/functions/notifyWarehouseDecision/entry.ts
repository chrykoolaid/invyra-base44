import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
      return Response.json({ error: 'POST required' }, { status: 405 });
    }

    const { recordId } = await req.json();
    if (!recordId) {
      return Response.json({ error: 'recordId required' }, { status: 400 });
    }

    // Fetch receiving record
    const record = await base44.asServiceRole.entities.ReceivingRecord.get(recordId);
    if (!record) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    // Fetch PO for supplier email
    const pos = await base44.asServiceRole.entities.PurchaseOrder.filter({ order_number: record.po_number });
    const po = pos?.[0];
    if (!po?.supplier_email) {
      return Response.json({ error: 'Supplier email not found' }, { status: 404 });
    }

    // Send email
    const itemSummary = (record.items || []).map(i => `${i.item} (Expected ${i.expected}, Received ${i.received})`).join('\n');
    
    const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
      to: po.supplier_email,
      subject: `Resolution Decision - ${record.po_number}`,
      html: `
        <h2>Discrepancy Resolution Decision</h2>
        <p>Dear ${record.supplier},</p>
        <p>Thank you for your response regarding the discrepancy on <strong>${record.po_number}</strong>.</p>
        
        <h3>Items Involved:</h3>
        <pre>${itemSummary}</pre>
        
        <h3>Our Resolution Decision:</h3>
        <p><strong>${record.warehouse_decision}</strong></p>
        ${record.warehouse_decision_note ? `<p>${record.warehouse_decision_note}</p>` : ''}
        
        <p>Please log into the supplier portal to confirm your agreement with this decision. Once confirmed, this issue will be marked as fully resolved.</p>
        
        <p>Best regards,<br/>Invyra Operations Team</p>
      `,
    });

    return Response.json({ 
      success: true, 
      message: 'Decision notification sent to supplier',
      emailSent: emailResult.data?.success,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});