import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import {
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import MovementAnalyticsBar from './movements/MovementAnalyticsBar';
import ReversalModal from './movements/ReversalModal';

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

/** Detect ledger integrity drift: balance_before ± qty should equal balance_after */
function hasLedgerDrift(m) {
  if (m.balance_before == null || m.balance_after == null || m.qty == null) return false;
  const expected = m.direction === 'IN'
    ? m.balance_before + m.qty
    : m.balance_before - m.qty;
  return Math.abs(expected - m.balance_after) > 0.001;
}

export default function LedgerViewer({ defaultSku = '', selectedSkus = [], defaultFilterSource = '' }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('POSTED');
  const [skuFilter, setSkuFilter] = useState(defaultSku);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [userRole, setUserRole] = useState('');
  const [reversalTarget, setReversalTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    const [rows, user] = await Promise.all([
      base44.entities.StockMovement.filter(envFilter(), '-created_date', 300),
      base44.auth.me(),
    ]);
    setMovements(rows || []);
    setUserRole((user?.role || '').toLowerCase());
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { setSkuFilter(defaultSku || ''); }, [defaultSku]);

  const canReverse = ['manager', 'admin', 'owner'].includes(userRole);

  const filtered = movements.filter(m => {
    const matchType = typeFilter === 'All' || m.movement_type === typeFilter;
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchSku = !skuFilter.trim()
      || (m.sku || '').toLowerCase().includes(skuFilter.trim().toLowerCase())
      || (m.item_name || '').toLowerCase().includes(skuFilter.trim().toLowerCase());
    const matchSelected = selectedSkus.length === 0 || selectedSkus.includes(m.sku);
    return matchType && matchStatus && matchSku && matchSelected;
  });

  const appliedDefaultFilter = Boolean(defaultFilterSource && defaultSku && skuFilter.trim() === defaultSku);

  const totals = {
    in:  filtered.filter(m => m.direction === 'IN').reduce((s, m) => s + (m.qty || 0), 0),
    out: filtered.filter(m => m.direction === 'OUT').reduce((s, m) => s + (m.qty || 0), 0),
  };

  const toggleExpanded = rowKey => {
    setExpandedRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const driftCount = filtered.filter(hasLedgerDrift).length;

  return (
    <div className="space-y-3">
      {reversalTarget && (
        <ReversalModal
          movement={reversalTarget}
          onClose={() => setReversalTarget(null)}
          onReversed={() => { setReversalTarget(null); load(); }}
        />
      )}

      {appliedDefaultFilter && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-900">
          Filtered from {defaultFilterSource}: <span className="font-mono font-semibold">{defaultSku}</span>. Clear the filter to view the full ledger.
        </div>
      )}

      {/* Analytics bar */}
      {!loading && <MovementAnalyticsBar movements={movements} />}

      {/* Ledger integrity warning */}
      {driftCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
          <span className="font-bold">⚠</span>
          <span><strong>Ledger drift detected:</strong> {driftCount} movement{driftCount !== 1 ? 's' : ''} have a balance discrepancy (balance_before ± qty ≠ balance_after). Review and reverse if needed.</span>
        </div>
      )}

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
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="POSTED">Posted</option>
          <option value="VOIDED">Voided</option>
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

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-0.5">Showing movements</p>
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

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading ledger…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No movements found matching your filters.</div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[11%]" />
              <col className="w-[26%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              {canReverse && <col className="w-[9%]" />}
            </colgroup>
            <thead className="bg-muted/20 text-muted-foreground text-[11px] uppercase tracking-[0.16em]">
              <tr>
                {['Date / Time', 'Type', 'Item', 'Qty', 'Balance', 'Source', 'Reference', 'Details'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                ))}
                {canReverse && <th className="text-center px-2 py-2.5 font-medium whitespace-nowrap">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const rowKey = m.id || `${m.sku}-${m.created_date}-${i}`;
                const isExpanded = !!expandedRows[rowKey];
                const drift = hasLedgerDrift(m);
                return (
                  <FragmentRow
                    key={rowKey}
                    movement={m}
                    rowIndex={i}
                    rowKeyValue={rowKey}
                    isExpanded={isExpanded}
                    onToggle={toggleExpanded}
                    hasDrift={drift}
                    canReverse={canReverse}
                    onReverse={() => setReversalTarget(m)}
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

function FragmentRow({ movement: m, rowIndex, rowKeyValue, isExpanded, onToggle, hasDrift, canReverse, onReverse }) {
  const isVoided = m.status === 'VOIDED';
  const isReversal = m.movement_type === 'REVERSAL';
  const canBeReversed = canReverse && !isVoided && !isReversal;

  return (
    <>
      <tr className={`border-t border-border ${isVoided ? 'opacity-50' : rowIndex % 2 === 0 ? 'bg-card' : 'bg-background'} ${hasDrift ? 'ring-1 ring-inset ring-red-300' : ''}`}>
        <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-muted-foreground">{formatDate(m.created_date)}</td>
        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {m.direction === 'IN'
              ? <ArrowUpCircle size={14} className="shrink-0 text-green-600" />
              : <ArrowDownCircle size={14} className="shrink-0 text-red-500" />}
            <span className={`inline-flex text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${TYPE_COLORS[m.movement_type] || 'bg-muted text-muted-foreground border-border'}`}>
              {m.movement_type || '—'}
            </span>
            {isVoided && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-semibold">VOIDED</span>}
            {hasDrift && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-semibold">DRIFT</span>}
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
            <span className={`inline-flex text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${SOURCE_COLORS[m.source_type] || 'bg-muted text-muted-foreground border-border'}`}>
              {m.source_type}
            </span>
          ) : '—'}
        </td>
        <td className="px-4 py-2.5 align-middle min-w-0">
          <p className="text-xs text-muted-foreground font-mono truncate" title={m.source_ref || ''}>{shortRef(m.source_ref)}</p>
        </td>
        <td className="px-4 py-2.5 align-middle whitespace-nowrap text-center">
          <button
            type="button"
            onClick={() => onToggle(rowKeyValue)}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Details
          </button>
        </td>
        {canReverse && (
          <td className="px-2 py-2.5 align-middle whitespace-nowrap text-center">
            {canBeReversed ? (
              <button
                type="button"
                onClick={onReverse}
                title="Request governed reversal"
                className="inline-flex items-center justify-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <RotateCcw size={11} /> Reverse
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground">—</span>
            )}
          </td>
        )}
      </tr>
      {isExpanded && (
        <tr className="border-t border-border bg-muted/10">
          <td colSpan={canReverse ? 9 : 8} className="px-4 py-2.5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">Posted by</p>
                <p className="text-foreground break-all">{m.posted_by || '—'}</p>
                {m.posted_by && <p className="text-muted-foreground">{shortUser(m.posted_by)}</p>}
              </div>
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">Full reference</p>
                <p className="font-mono text-foreground break-all">{m.source_ref || '—'}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">Balance before → after</p>
                <p className="text-foreground">{m.balance_before ?? '—'} → {m.balance_after ?? '—'}</p>
                {hasDrift && <p className="text-red-600 font-semibold mt-0.5">⚠ Drift detected</p>}
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