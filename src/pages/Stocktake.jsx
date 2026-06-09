import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter, ENV_LIVE } from '@/lib/envFilter';
import { postInventoryMovement } from '@/lib/inventoryMovement';
import { ClipboardCheck, Search, CheckCircle2 } from 'lucide-react';

const statusStyle = {
  matched:    'bg-green-50 text-green-700 border border-green-200',
  over:       'bg-blue-50 text-blue-700 border border-blue-200',
  short:      'bg-amber-50 text-amber-700 border border-amber-200',
  missing:    'bg-red-50 text-red-500 border border-red-200',
  uncounted:  'bg-muted text-muted-foreground border border-border',
};

function getVarianceStatus(expected, counted) {
  if (counted === null || counted === undefined || counted === '') return 'uncounted';
  const diff = Number(counted) - Number(expected);
  if (diff === 0) return 'matched';
  if (diff > 0) return 'over';
  if (diff < 0) return 'short';
  return 'uncounted';
}

export default function Stocktake() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [counts, setCounts] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOnlyVariances, setShowOnlyVariances] = useState(false);

  useEffect(() => {
    base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 500)
      .then(rows => { setItems(rows || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = items.filter(i =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      (i.sku || '').toLowerCase().includes(query.toLowerCase())
    );
    if (showOnlyVariances) {
      list = list.filter(i => {
        const st = getVarianceStatus(i.stock || 0, counts[i.id]);
        return st !== 'uncounted' && st !== 'matched';
      });
    }
    return list;
  }, [items, query, counts, showOnlyVariances]);

  const stats = useMemo(() => {
    const counted = items.filter(i => counts[i.id] !== undefined && counts[i.id] !== '');
    const matched = counted.filter(i => getVarianceStatus(i.stock || 0, counts[i.id]) === 'matched');
    const variances = counted.filter(i => {
      const st = getVarianceStatus(i.stock || 0, counts[i.id]);
      return st === 'short' || st === 'over';
    });
    return { total: items.length, counted: counted.length, matched: matched.length, variances: variances.length };
  }, [items, counts]);

  const handleCount = (id, val) => {
    setCounts(prev => ({ ...prev, [id]: val }));
  };

  const handleCommit = async () => {
    const toUpdate = items.filter(i => counts[i.id] !== undefined && counts[i.id] !== '');
    if (toUpdate.length === 0) return;
    setSubmitting(true);

    const user = await base44.auth.me();
    const sourceRef = `STKTK-${Date.now().toString(36).toUpperCase()}`;

    try {
      for (const item of toUpdate) {
        const newStock = Number(counts[item.id]);
        const diff = newStock - (item.stock || 0);
        if (diff === 0) continue;
        const direction = diff >= 0 ? 'IN' : 'OUT';

        await postInventoryMovement({
          item,
          movementType: 'STOCKTAKE',
          direction,
          qty: Math.abs(diff),
          sourceType: 'STOCKTAKE',
          sourceRef,
          sourceModule: 'Stocktake',
          notes: `Stocktake adjustment: ${diff >= 0 ? '+' : ''}${diff}`,
          siteId: item.site_id || '',
          environment: ENV_LIVE,
          user,
        });
      }
    } catch (error) {
      console.error('Stocktake commit failed', error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle2 size={40} className="text-green-500" />
        <h2 className="text-lg font-semibold text-foreground">Stocktake Committed</h2>
        <p className="text-sm text-muted-foreground">{Object.keys(counts).filter(k => counts[k] !== '').length} items updated. Ledger movements posted.</p>
        <button onClick={() => { setSubmitted(false); setCounts({}); }}
          className="h-9 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
          Start New Stocktake
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ClipboardCheck size={18} className="text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Stocktake</h1>
          </div>
          <p className="text-sm text-muted-foreground">Enter physical counts to reconcile system stock. Variances are posted to the ledger.</p>
        </div>
        <button
          onClick={handleCommit}
          disabled={submitting || stats.counted === 0}
          className="flex items-center gap-2 h-9 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed font-medium whitespace-nowrap">
          <CheckCircle2 size={14} /> {submitting ? 'Committing…' : `Commit ${stats.counted} Count${stats.counted !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: stats.total, style: 'text-foreground' },
          { label: 'Counted',     value: stats.counted, style: 'text-primary' },
          { label: 'Matched',     value: stats.matched, style: 'text-green-600' },
          { label: 'Variances',   value: stats.variances, style: stats.variances > 0 ? 'text-amber-600' : 'text-muted-foreground' },
        ].map(({ label, value, style }) => (
          <div key={label} className="border border-border rounded bg-card px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-bold ${style}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or SKU…"
            className="h-8 w-full border border-border rounded pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={showOnlyVariances} onChange={e => setShowOnlyVariances(e.target.checked)}
            className="rounded border-border" />
          Show variances only
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                {['SKU', 'Item Name', 'System Stock', 'Physical Count', 'Variance', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No items found.</td></tr>
              )}
              {filtered.map((item, i) => {
                const counted = counts[item.id];
                const status = getVarianceStatus(item.stock || 0, counted);
                const variance = (counted !== undefined && counted !== '')
                  ? Number(counted) - (item.stock || 0) : null;

                return (
                  <tr key={item.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.sku || '—'}</td>
                    <td className="px-4 py-2.5 font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 font-mono">{item.stock ?? 0} <span className="text-muted-foreground text-xs">{item.unit}</span></td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min={0}
                        value={counted ?? ''}
                        onChange={e => handleCount(item.id, e.target.value)}
                        placeholder="Enter count"
                        className="w-28 h-8 border border-border rounded px-3 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring text-center"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold">
                      {variance !== null ? (
                        <span className={variance > 0 ? 'text-blue-600' : variance < 0 ? 'text-amber-600' : 'text-green-600'}>
                          {variance > 0 ? '+' : ''}{variance}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[status]}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}