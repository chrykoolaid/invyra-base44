import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeftRight, Plus, RefreshCw, ArrowRight, Trash2 } from 'lucide-react';

export default function Transfers() {
  const [sites, setSites] = useState([]);
  const [items, setItems] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [fromSite, setFromSite] = useState('');
  const [toSite, setToSite] = useState('');
  const [lines, setLines] = useState([{ item_id: '', qty: '' }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [siteData, itemData, movements] = await Promise.all([
      base44.entities.Site.filter({ is_active: true }),
      base44.entities.InventoryItem.list('', 500),
      base44.entities.StockMovement.filter({ source_type: 'TRANSFER' }),
    ]);
    setSites(siteData || []);
    setItems(itemData || []);

    // Group movements into transfers by source_ref
    const grouped = {};
    (movements || []).forEach(m => {
      if (!m.source_ref) return;
      if (!grouped[m.source_ref]) grouped[m.source_ref] = { ref: m.source_ref, date: m.created_date, lines: [], out: [], in: [] };
      if (m.direction === 'OUT') grouped[m.source_ref].out.push(m);
      else grouped[m.source_ref].in.push(m);
    });

    const transferList = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransfers(transferList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const addLine = () => setLines(prev => [...prev, { item_id: '', qty: '' }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const validLines = lines.filter(l => l.item_id && Number(l.qty) > 0);

  const handleSubmit = async () => {
    if (!fromSite || !toSite || fromSite === toSite || validLines.length === 0) return;
    setSaving(true);

    const ref = `TRF-${Date.now().toString(36).toUpperCase()}`;
    const user = await base44.auth.me();
    const postedBy = user?.email || user?.full_name || 'Unknown';

    for (const line of validLines) {
      const item = items.find(i => i.id === line.item_id);
      if (!item) continue;
      const qty = Number(line.qty);
      const stockPerSite = item.stock_per_site || {};
      const fromBalance = stockPerSite[fromSite] ?? (item.stock || 0);
      const toBalance = stockPerSite[toSite] ?? 0;
      const newFromBalance = Math.max(0, fromBalance - qty);
      const newToBalance = toBalance + qty;
      const newStockPerSite = { ...stockPerSite, [fromSite]: newFromBalance, [toSite]: newToBalance };
      const newTotalStock = Object.values(newStockPerSite).reduce((s, v) => s + (v || 0), 0);

      await base44.entities.InventoryItem.update(item.id, { stock_per_site: newStockPerSite, stock: newTotalStock });
      await base44.entities.StockMovement.create({
        site_id: fromSite, item_id: item.id, sku: item.sku, item_name: item.name,
        movement_type: 'TRANSFER_OUT', direction: 'OUT', qty, balance_after: newFromBalance,
        source_ref: ref, source_type: 'TRANSFER', notes: notes || `Transfer to site`, status: 'POSTED', posted_by: postedBy,
      });
      await base44.entities.StockMovement.create({
        site_id: toSite, item_id: item.id, sku: item.sku, item_name: item.name,
        movement_type: 'TRANSFER_IN', direction: 'IN', qty, balance_after: newToBalance,
        source_ref: ref, source_type: 'TRANSFER', notes: notes || `Transfer from site`, status: 'POSTED', posted_by: postedBy,
      });
    }

    setSaving(false);
    setShowForm(false);
    setFromSite(''); setToSite(''); setLines([{ item_id: '', qty: '' }]); setNotes('');
    loadData();
  };

  const getSiteName = (id) => sites.find(s => s.id === id)?.name || id;

  return (
    <div className="p-5 lg:p-6 max-w-[1100px] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Transfers</h1>
          <p className="text-sm text-muted-foreground">Move stock between locations. Every transfer is posted to the inventory ledger.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium flex-shrink-0"
        >
          <Plus size={14} /> New Transfer
        </button>
      </div>

      {/* Create Transfer Form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Create Transfer</h2>

          {/* Sites */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">From Site</label>
              <select value={fromSite} onChange={e => setFromSite(e.target.value)}
                className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Select…</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">To Site</label>
              <select value={toSite} onChange={e => setToSite(e.target.value)}
                className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Select…</option>
                {sites.filter(s => s.id !== fromSite).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {fromSite && toSite && fromSite === toSite && (
            <p className="text-xs text-destructive">Source and destination cannot be the same.</p>
          )}

          {/* Lines */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Items</label>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={line.item_id} onChange={e => updateLine(i, 'item_id', e.target.value)}
                    className="flex-1 h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">Select item…</option>
                    {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>)}
                  </select>
                  <input type="number" min={1} placeholder="Qty" value={line.qty}
                    onChange={e => updateLine(i, 'qty', e.target.value)}
                    className="w-20 h-9 border border-border rounded-lg px-2 text-sm text-center bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addLine} className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Plus size={12} /> Add item
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Driver name, reason…"
              className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button onClick={() => setShowForm(false)} className="h-9 px-4 text-sm border border-border rounded-xl hover:bg-muted">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving || !fromSite || !toSite || fromSite === toSite || validLines.length === 0}
              className="h-9 px-5 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 font-medium"
            >
              {saving ? 'Posting…' : 'Post Transfer'}
            </button>
          </div>
        </div>
      )}

      {/* Transfer History */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/25 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Transfer History</h2>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-xs rounded border border-border hover:bg-muted disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading transfers…</div>
        ) : transfers.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No transfers yet. Create one above.</div>
        ) : (
          <div className="divide-y divide-border">
            {transfers.map(trf => {
              const outMovements = trf.out;
              const inMovements = trf.in;
              const fromSiteId = outMovements[0]?.site_id;
              const toSiteId = inMovements[0]?.site_id;
              const totalQty = outMovements.reduce((s, m) => s + (m.qty || 0), 0);

              return (
                <div key={trf.ref} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <ArrowLeftRight size={16} className="text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground font-mono">{trf.ref}</p>
                        <p className="text-xs text-muted-foreground">{new Date(trf.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{getSiteName(fromSiteId)}</span>
                      <ArrowRight size={14} />
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{getSiteName(toSiteId)}</span>
                      <span className="ml-2 text-xs text-foreground font-mono">{totalQty} units</span>
                    </div>
                  </div>
                  <div className="ml-7 space-y-1">
                    {outMovements.map(m => (
                      <div key={m.id} className="text-xs text-muted-foreground flex gap-3">
                        <span className="font-mono">{m.sku}</span>
                        <span>{m.item_name}</span>
                        <span className="font-medium text-foreground">{m.qty} units</span>
                      </div>
                    ))}
                    {outMovements[0]?.notes && (
                      <p className="text-xs italic text-muted-foreground mt-1">{outMovements[0].notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}