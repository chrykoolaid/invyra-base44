import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, CheckCircle2, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const receivingRows = [
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         item: 'Premium Detergent 20L', expected: 20,  received: 0,   unit: 'drum',   status: 'Awaiting'  },
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         item: 'Machine Descaler',       expected: 10,  received: 0,   unit: 'bottle', status: 'Awaiting'  },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', item: 'Bleach 5L',              expected: 18,  received: 18,  unit: 'bottle', status: 'Completed' },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', item: 'Stain Remover 2L',       expected: 12,  received: 8,   unit: 'bottle', status: 'Partial'   },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     item: 'Packaging Bag Large',    expected: 500, received: 500, unit: 'pack',   status: 'Completed' },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     item: 'Garment Tag Roll',        expected: 10,  received: 4,   unit: 'roll',   status: 'Partial'   },
  { po: 'PO-2026-004', supplier: 'LaundryChem Direct',    item: 'Fabric Softener 20L',    expected: 8,   received: 8,   unit: 'drum',   status: 'Completed' },
  { po: 'PO-2026-005', supplier: 'SafetyFirst Supplies',  item: 'Gloves Disposable',       expected: 200, received: 0,   unit: 'pcs',    status: 'Awaiting'  },
];

const statusStyle = {
  Awaiting:       'bg-muted text-muted-foreground border border-border',
  Partial:        'bg-amber-50 text-amber-700 border border-amber-200',
  Completed:      'bg-green-50 text-green-700 border border-green-200',
  'Over-received':'bg-purple-50 text-purple-700 border border-purple-200',
};

const discrepancyReasons = [
  { id: 'damaged', label: 'Damaged goods', desc: 'Items received damaged or defective' },
  { id: 'missing', label: 'Missing items', desc: 'Items missing from delivery' },
  { id: 'supplier_short', label: 'Supplier short', desc: 'Supplier unable to fulfill full quantity' },
  { id: 'quality_issue', label: 'Quality issue', desc: 'Items do not meet quality standards' },
  { id: 'wrong_sku', label: 'Wrong SKU', desc: 'Incorrect product shipped' },
  { id: 'packaging_damaged', label: 'Packaging damaged', desc: 'Packaging compromised in transit' },
  { id: 'other', label: 'Other', desc: 'Different supplier-related issue' },
];

export default function ReceivingWorkspace() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const po = params.get('po');

  const baseItems = receivingRows.filter(r => r.po === po);
  const supplier = baseItems[0]?.supplier ?? '—';

  const initialReceived = Object.fromEntries(baseItems.map(r => [r.item, r.received]));

  const [received, setReceived] = useState(initialReceived);
  const [savedDraft, setSavedDraft] = useState(null);
  const [actionStatus, setActionStatus] = useState(null); // 'draft_saved' | 'confirmed'
  const [supplierDispatchNote, setSupplierDispatchNote] = useState('');

  // discrepancy: { [itemName]: { reason: '', note: '', open: false } }
  const [discrepancy, setDiscrepancy] = useState({});

  const setDiscrepancyField = (item, field, value) => {
    setDiscrepancy(prev => ({ ...prev, [item]: { ...prev[item], [field]: value } }));
  };

  const toggleDiscrepancy = (item) => {
    setDiscrepancy(prev => ({
      ...prev,
      [item]: { reason: '', note: '', ...prev[item], open: !prev[item]?.open },
    }));
  };

  const items = baseItems.map(r => ({ ...r, received: received[r.item] }));
  const totalExpected = items.reduce((s, r) => s + r.expected, 0);
  const totalReceived = items.reduce((s, r) => s + r.received, 0);

  const setQty = (item, val) => {
    const n = Math.max(0, Number(val));
    if (!isNaN(n)) setReceived(prev => ({ ...prev, [item]: n }));
  };

  const itemStatus = (row) => {
    if (row.received === 0)              return 'Awaiting';
    if (row.received < row.expected)     return 'Partial';
    if (row.received === row.expected)   return 'Completed';
    return 'Over-received';
  };

  const handleCancel = () => navigate('/Receiving');

  const handleSaveDraft = () => {
    setSavedDraft({ ...received });
    setActionStatus('draft_saved');
    setTimeout(() => setActionStatus(null), 2500);
  };

  const handleConfirm = async () => {
    setActionStatus('confirming');
    try {
      const user = await base44.auth.me();
      const postedBy = user?.email || 'unknown';

      // Load all sites once — use first active site as default
      const sites = await base44.entities.Site.filter({ is_active: true });
      const defaultSite = sites[0];

      // 1. For each item with received > 0, update stock + post ledger movement
      for (const row of items) {
        if (row.received <= 0) continue;

        const existing = await base44.entities.InventoryItem.filter({ name: row.item });
        const invItem = existing?.[0];
        const currentStock = invItem?.stock || 0;
        const siteId = invItem?.site_id || defaultSite?.id || '';
        const currentSiteStock = invItem?.stock_per_site?.[siteId] ?? currentStock;
        const balanceAfter = currentSiteStock + row.received;

        if (invItem) {
          const updatedStockPerSite = { ...(invItem.stock_per_site || {}), [siteId]: balanceAfter };
          await base44.entities.InventoryItem.update(invItem.id, {
            stock: currentStock + row.received,
            stock_per_site: updatedStockPerSite,
          });

          // Post RECEIVE movement to ledger
          await base44.entities.StockMovement.create({
            site_id: siteId,
            item_id: invItem.id,
            sku: invItem.sku || row.item,
            item_name: invItem.name,
            movement_type: 'RECEIVE',
            direction: 'IN',
            qty: row.received,
            balance_after: balanceAfter,
            source_ref: po,
            source_type: 'RECEIVING',
            notes: discrepancy[row.item]?.note || '',
            status: 'POSTED',
            posted_by: postedBy,
          });
        }
      }

      // 2. Determine overall receiving status
      const statuses = items.map(i => itemStatus(i));
      let recordStatus = 'Complete';
      if (statuses.some(s => s === 'Partial' || s === 'Over-received' || s === 'Awaiting')) recordStatus = 'Partial';
      if (statuses.every(s => s === 'Completed')) recordStatus = 'Complete';

      // 3. Create receiving log record
       await base44.entities.ReceivingRecord.create({
         po_number: po,
         supplier,
         confirmed_at: new Date().toISOString(),
         confirmed_by: postedBy,
         status: recordStatus,
         supplier_stated_reason: supplierDispatchNote,
         items: items.map(row => ({
           item: row.item,
           expected: row.expected,
           received: row.received,
           unit: row.unit,
           discrepancy_reason: discrepancy[row.item]?.reason || '',
           discrepancy_note: discrepancy[row.item]?.note || '',
         })),
       });

      // 4. Update linked PurchaseOrder status
      const poOrders = await base44.entities.PurchaseOrder.filter({ order_number: po });
      if (poOrders && poOrders.length > 0) {
        const poRecord = poOrders[0];
        const newPoStatus = recordStatus === 'Complete' ? 'Received' : 'Partially Received';
        await base44.entities.PurchaseOrder.update(poRecord.id, {
          status: newPoStatus,
          received_at: new Date().toISOString(),
        });
      }

      setActionStatus('confirmed');
    } catch (err) {
      console.error('Confirm failed', err);
      setActionStatus(null);
    }
  };

  const overallStatus = () => {
    const statuses = items.map(i => itemStatus(i));
    if (statuses.some(s => s === 'Over-received'))          return 'Over-received';
    if (statuses.every(s => s === 'Completed'))             return 'Completed';
    if (statuses.every(s => s === 'Awaiting'))              return 'Awaiting';
    return 'Partial';
  };

  if (!po || items.length === 0) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/Receiving')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={14} /> Back to Receiving
        </button>
        <p className="text-sm text-muted-foreground">Purchase order not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
    <div className="flex-1 p-6 max-w-[900px] pb-28">

      {/* Back */}
      <button
        onClick={() => navigate('/Receiving')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Receiving
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-lg font-semibold text-foreground">{po}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[overallStatus()]}`}>
            {overallStatus()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{supplier}</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-border rounded bg-card px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Lines</p>
          <p className="text-xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="border border-border rounded bg-card px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Expected</p>
          <p className="text-xl font-bold text-foreground">{totalExpected.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded bg-card px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Received</p>
          <p className={`text-xl font-bold ${totalReceived === 0 ? 'text-muted-foreground' : totalReceived > totalExpected ? 'text-purple-700' : totalReceived < totalExpected ? 'text-amber-600' : 'text-green-700'}`}>
            {totalReceived.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Items table */}
      <div className="border border-border rounded overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Line Items</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Item', 'Expected', 'Received', 'Unit', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => {
            const status = itemStatus(row);
            return (
              <React.Fragment key={row.item}>
              <tr className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                <td className="px-5 py-3 font-medium">{row.item}</td>
                <td className="px-5 py-3 text-muted-foreground">{row.expected}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQty(row.item, row.received - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-border bg-muted hover:bg-accent transition-colors text-foreground"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={row.expected}
                      value={row.received}
                      onChange={e => setQty(row.item, e.target.value)}
                        className="w-14 h-7 text-center text-sm border border-border rounded bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    <button
                      onClick={() => setQty(row.item, row.received + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-border bg-muted hover:bg-accent transition-colors text-foreground"
                    >
                      <Plus size={12} />
                    </button>
                    <span className="text-xs text-muted-foreground ml-1">/ {row.expected} {row.unit}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{row.unit}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[status]}`}>
                      {status}
                    </span>
                    {status === 'Partial' && (
                      <button
                        onClick={() => toggleDiscrepancy(row.item)}
                        className="text-[11px] text-amber-600 hover:text-amber-800 underline underline-offset-2 transition-colors"
                      >
                        {discrepancy[row.item]?.open ? 'hide' : '+ reason'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              {/* Discrepancy sub-row */}
              {status === 'Partial' && discrepancy[row.item]?.open && (
                <tr className="border-t border-amber-100 bg-amber-50/40">
                  <td colSpan={5} className="px-5 py-3">
                    <div className="space-y-3">
                      {supplierDispatchNote && (
                        <div>
                          <p className="text-xs text-amber-700 font-semibold mb-2">Supplier's stated reason:</p>
                          <div className="h-16 text-xs border border-amber-200 rounded px-3 py-2 bg-amber-50 text-amber-900 overflow-y-auto">
                            {supplierDispatchNote}
                          </div>
                        </div>
                      )}
                      {!supplierDispatchNote && (
                        <div>
                          <p className="text-xs text-amber-700 font-semibold mb-2">Supplier's stated reason:</p>
                          <div className="h-16 text-xs border border-border rounded px-3 py-2 bg-muted text-muted-foreground flex items-center italic">
                            No supplier reason provided yet
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-amber-700 font-semibold mb-2">Categorize the issue:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {discrepancyReasons.map(r => (
                            <button
                              key={r.id}
                              onClick={() => setDiscrepancyField(row.item, 'reason', discrepancy[row.item]?.reason === r.id ? '' : r.id)}
                              className={`text-left text-xs p-2 rounded border transition-colors ${
                                discrepancy[row.item]?.reason === r.id
                                  ? 'bg-amber-100 border-amber-400 text-amber-800 font-medium'
                                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
                              }`}
                              title={r.desc}
                            >
                              <p className="font-medium">{r.label}</p>
                              <p className="text-[10px] opacity-70 leading-tight">{r.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Add internal note…"
                        value={discrepancy[row.item]?.note || ''}
                        onChange={e => setDiscrepancyField(row.item, 'note', e.target.value)}
                        className="h-8 text-xs border border-border rounded px-3 bg-card focus:outline-none focus:ring-1 focus:ring-ring w-full placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-4 px-1">Receiving inputs are in draft state. Confirm to finalise.</p>
    </div>{/* end scrollable content */}

    {/* Sticky action bar */}
    <div className="fixed bottom-0 left-56 right-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3 z-10">
      {actionStatus === 'draft_saved' && (
        <span className="text-xs text-green-700 font-medium flex items-center gap-1.5">
          <Save size={13} /> Draft saved
        </span>
      )}
      {actionStatus === 'confirming' && (
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 animate-pulse">
          Saving…
        </span>
      )}
      {actionStatus === 'confirmed' && (
        <span className="text-xs text-green-700 font-medium flex items-center gap-1.5">
          <CheckCircle2 size={13} /> Receiving confirmed — inventory updated
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
        >
          <X size={14} /> Cancel
        </button>
        <button
          onClick={handleSaveDraft}
          className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
        >
          <Save size={14} /> Save Draft
        </button>
        <button
          onClick={handleConfirm}
          disabled={actionStatus === 'confirmed' || actionStatus === 'confirming'}
          className="flex items-center gap-2 h-10 px-6 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <CheckCircle2 size={14} /> Confirm Receiving
        </button>
      </div>
    </div>

  </div>
  );
}