import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import {
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

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

function shortRef(ref) {
  if (!ref) return '—';
  if (ref.length <= 14) return ref;
  return `${ref.slice(0, 11)}…`;
}

function shortUser(user) {
  if (!user) return '—';
  const [name] = user.split('@');
  if (!name) return user;
  if (name.length <= 18) return name;
  return `${name.slice(0, 18)}…`;
}


export default function LedgerViewer({ defaultSku = '', selectedSkus = [] }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [skuFilter, setSkuFilter] = useState(defaultSku);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const load = async () => {
    setLoading(true);
    // LIVE-only: exclude TRAINING and TEST movements from the production ledger
    const rows = await base44.entities.StockMovement.filter(envFilter(), '-created_date', 200);
    setMovements(rows || []);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = movements.filter(m => {
    const matchType = typeFilter === 'All' || m.movement_type === typeFilter;
    const matchSku = !skuFilter.trim() || (m.sku || '').toLowerCase().includes(skuFilter.trim().toLowerCase()) || (m.item_name || '').toLowerCase().includes(skuFilter.trim().toLowerCase());
    const matchSelected = selectedSkus.length === 0 || selectedSkus.includes(m.sku);
    return matchType && matchSku && matchSelected;
  });

  const totals = {
    in:  filtered.filter(m => m.direction === 'IN').reduce((s, m) => s + (m.qty || 0), 0),
    out: filtered.filter(m => m.direction === 'OUT').reduce((s, m) => s + (m.qty || 0), 0),
  };

  const toggleExpanded = rowKey => {
    setExpandedRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  return (
    <div className="space-y-3">
      {/* Compact summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-0.5">Total movements</p>
          <p className="text-lg font-semibold leading-tight text-foreground">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-0.5">Total IN qty</p>
          <p className="text-lg font-semibold leading-tight text-green-700">{totals.in.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-0.5">Total OUT qty</p>
          <p className="text-lg font-semibold leading-tight text-red-700">{totals.out.toLocaleString()}</p>
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
        <div className="ml-auto text-xs text-muted-foreground">
          Last refreshed: <span className="font-medium text-foreground">{lastRefresh ? lastRefresh.toLocaleTimeString('en-GB') : '—'}</span>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading ledger…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No movements found. Confirm a receiving or approve a wastage event to post the first entries.</div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[31%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead className="bg-muted/20 text-muted-foreground text-[11px] uppercase tracking-[0.16em]">
              <tr>
                {['Date / Time', 'Type', 'Item', 'Qty', 'Balance', 'Source', 'Reference'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                ))}
                <th className="text-right pl-3 pr-6 py-2.5 font-medium whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const rowKey = m.id || `${m.sku}-${m.created_date}-${i}`;
                const isExpanded = !!expandedRows[rowKey];

                return (
                  <FragmentRow
                    key={rowKey}
                    movement={m}
                    rowIndex={i}
                    rowKeyValue={rowKey}
                    isExpanded={isExpanded}
                    onToggle={toggleExpanded}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">{filtered.length} row{filtered.length !== 1 ? 's' : ''} shown</p>
      )}
    </div>
  );
}

function FragmentRow({ movement: m, rowIndex, rowKeyValue, isExpanded, onToggle }) {
  return (
    <>
      <tr className={`border-t border-border ${rowIndex % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
        <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-muted-foreground">{formatDate(m.created_date)}</td>
        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
          <div className="flex items-center gap-2">
            {m.direction === 'IN'
              ? <ArrowUpCircle size={15} className="shrink-0 text-green-600" />
              : <ArrowDownCircle size={15} className="shrink-0 text-red-500" />}
            <span className={`inline-flex max-w-full truncate text-[11px] px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[m.movement_type] || 'bg-muted text-muted-foreground border-border'}`}>
              {m.movement_type || '—'}
            </span>
          </div>
        </td>
        <td className="px-4 py-2.5 align-middle min-w-0">
          <p className="font-medium text-foreground truncate">{m.item_name || '—'}</p>
          <p className="text-[11px] text-muted-foreground font-mono truncate">{m.sku || '—'}</p>
        </td>
        <td className="px-4 py-2.5 align-middle whitespace-nowrap font-semibold">
          <span className={m.direction === 'IN' ? 'text-green-700' : 'text-red-600'}>
            {m.direction === 'IN' ? '+' : '-'}{m.qty}
          </span>
        </td>
        <td className="px-4 py-2.5 align-middle whitespace-nowrap text-foreground">{m.balance_after ?? '—'}</td>
        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
          {m.source_type ? (
            <span className={`inline-flex max-w-full truncate text-[11px] px-2 py-0.5 rounded-full border font-medium ${SOURCE_COLORS[m.source_type] || 'bg-muted text-muted-foreground border-border'}`}>
              {m.source_type}
            </span>
          ) : '—'}
        </td>
        <td className="px-4 py-2.5 align-middle min-w-0">
          <p className="text-xs text-muted-foreground font-mono truncate" title={m.source_ref || ''}>{shortRef(m.source_ref)}</p>
        </td>
        <td className="pl-3 pr-6 py-2.5 align-middle whitespace-nowrap text-right">
          <button
            type="button"
            onClick={() => onToggle(rowKeyValue)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Details
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-t border-border bg-muted/10">
          <td colSpan={8} className="px-4 py-2.5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">Posted by</p>
                <p className="text-foreground break-all">{m.posted_by || '—'}</p>
                {m.posted_by && <p className="text-muted-foreground">Shown as {shortUser(m.posted_by)}</p>}
              </div>
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">Full reference</p>
                <p className="font-mono text-foreground break-all">{m.source_ref || '—'}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">Direction</p>
                <p className="text-foreground">{m.direction || '—'}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">Notes</p>
                <p className="text-foreground break-words">{m.notes || '—'}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
