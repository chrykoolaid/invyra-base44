import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const TYPE_COLORS = {
  RECEIVE:      'bg-green-50 text-green-700 border-green-200',
  WASTE:        'bg-red-50 text-red-700 border-red-200',
  REVERSAL:     'bg-blue-50 text-blue-700 border-blue-200',
  ADJUST:       'bg-amber-50 text-amber-700 border-amber-200',
  SALE:         'bg-violet-50 text-violet-700 border-violet-200',
  TRANSFER_IN:  'bg-teal-50 text-teal-700 border-teal-200',
  TRANSFER_OUT: 'bg-orange-50 text-orange-700 border-orange-200',
  STOCKTAKE:    'bg-slate-100 text-slate-700 border-slate-200',
};

const SOURCE_COLORS = {
  RECEIVING: 'bg-green-50 text-green-700 border-green-200',
  WASTAGE:   'bg-red-50 text-red-700 border-red-200',
  MANUAL:    'bg-slate-100 text-slate-600 border-slate-200',
  POS:       'bg-violet-50 text-violet-700 border-violet-200',
  TRANSFER:  'bg-teal-50 text-teal-700 border-teal-200',
  STOCKTAKE: 'bg-amber-50 text-amber-700 border-amber-200',
};

const ALL_TYPES = ['All', 'RECEIVE', 'WASTE', 'REVERSAL', 'ADJUST', 'SALE', 'TRANSFER_IN', 'TRANSFER_OUT', 'STOCKTAKE'];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function LedgerViewer() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [skuFilter, setSkuFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.StockMovement.list('-created_date', 200);
    setMovements(rows || []);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = movements.filter(m => {
    const matchType = typeFilter === 'All' || m.movement_type === typeFilter;
    const matchSku = !skuFilter.trim() || (m.sku || '').toLowerCase().includes(skuFilter.trim().toLowerCase()) || (m.item_name || '').toLowerCase().includes(skuFilter.trim().toLowerCase());
    return matchType && matchSku;
  });

  const totals = {
    in:  filtered.filter(m => m.direction === 'IN').reduce((s, m) => s + (m.qty || 0), 0),
    out: filtered.filter(m => m.direction === 'OUT').reduce((s, m) => s + (m.qty || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Total movements</p>
          <p className="text-lg font-semibold text-foreground">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Total IN qty</p>
          <p className="text-lg font-semibold text-green-700">{totals.in.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Total OUT qty</p>
          <p className="text-lg font-semibold text-red-700">{totals.out.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Last refreshed</p>
          <p className="text-sm font-medium text-muted-foreground">{lastRefresh ? lastRefresh.toLocaleTimeString('en-GB') : '—'}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={skuFilter}
          onChange={e => setSkuFilter(e.target.value)}
          placeholder="Filter by SKU or item name…"
          className="h-8 w-56 border border-border rounded px-3 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={load}
          className="ml-auto flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading ledger…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No movements found. Confirm a receiving or approve a wastage event to post the first entries.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-muted/20 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                <tr>
                  {['Timestamp', 'Type', 'Dir', 'SKU / Item', 'Qty', 'Balance After', 'Source', 'Ref', 'Posted By', 'Notes'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">{formatDate(m.created_date)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[m.movement_type] || 'bg-muted text-muted-foreground border-border'}`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {m.direction === 'IN'
                        ? <ArrowUpCircle size={16} className="text-green-600" />
                        : <ArrowDownCircle size={16} className="text-red-500" />}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground">{m.item_name || '—'}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{m.sku || '—'}</p>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-semibold">
                      <span className={m.direction === 'IN' ? 'text-green-700' : 'text-red-600'}>
                        {m.direction === 'IN' ? '+' : '-'}{m.qty}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-foreground">{m.balance_after ?? '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {m.source_type && (
                        <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border font-medium ${SOURCE_COLORS[m.source_type] || 'bg-muted text-muted-foreground border-border'}`}>
                          {m.source_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground font-mono">{m.source_ref || '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">{m.posted_by || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">{filtered.length} row{filtered.length !== 1 ? 's' : ''} shown</p>
      )}
    </div>
  );
}