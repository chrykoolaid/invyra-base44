import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  ExternalLink,
  RefreshCw,
  ScrollText,
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

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function SummaryCard({ label, value, tone = 'text-foreground', helper }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-semibold leading-tight ${tone}`}>{value}</p>
      {helper && <p className="mt-1 text-xs text-muted-foreground truncate">{helper}</p>}
    </div>
  );
}

export default function MovementLedgerSummary() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.StockMovement.filter(envFilter(), '-created_date', 200);
    setMovements(rows || []);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const inQty = movements.filter(m => m.direction === 'IN').reduce((sum, m) => sum + (m.qty || 0), 0);
    const outQty = movements.filter(m => m.direction === 'OUT').reduce((sum, m) => sum + (m.qty || 0), 0);
    return { inQty, outQty };
  }, [movements]);

  const latestRows = movements.slice(0, 8);
  const latestMovement = movements[0];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-4 border-b border-border bg-muted/25">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
                <ScrollText className="h-4 w-4 text-primary" strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Movement Ledger Summary</p>
                <h2 className="text-sm font-semibold text-foreground">Admin read-only summary</h2>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  This tab now summarises the single StockMovement ledger for admin oversight. The full searchable ledger remains in the dedicated Inventory → Movements module.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={load}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <Link
                to="/Movements"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Open Full Movements Ledger
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <SummaryCard label="Total movements" value={movements.length.toLocaleString()} helper="Latest 200 live records" />
            <SummaryCard label="Total IN qty" value={totals.inQty.toLocaleString()} tone="text-green-700" />
            <SummaryCard label="Total OUT qty" value={totals.outQty.toLocaleString()} tone="text-red-700" />
            <SummaryCard
              label="Last movement"
              value={latestMovement ? formatTime(latestMovement.created_date) : '—'}
              helper={latestMovement ? formatDateTime(latestMovement.created_date) : 'No movement posted yet'}
            />
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" strokeWidth={2} />
              <p className="text-sm leading-relaxed text-blue-900">
                No duplicate ledger tools live here. Use this admin tab for proof and quick visibility; use Inventory → Movements for filtering, row expansion, references, and detailed stock movement investigation.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-background">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 bg-muted/15">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Latest movement activity</h3>
                <p className="text-xs text-muted-foreground">Showing the newest 8 ledger rows only</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Last refreshed: <span className="font-medium text-foreground">{lastRefresh ? lastRefresh.toLocaleTimeString('en-GB') : '—'}</span>
              </p>
            </div>

            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading movement summary…</div>
            ) : latestRows.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No movements found. Confirm receiving, stocktake, transfer, adjustment, wastage, or POS deduction workflows to create ledger entries.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-muted/20 text-muted-foreground text-[11px] uppercase tracking-[0.16em]">
                    <tr>
                      {['Date / Time', 'Type', 'Item', 'Qty', 'Balance', 'Source'].map(header => (
                        <th key={header} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {latestRows.map((movement, index) => (
                      <tr key={movement.id || `${movement.sku}-${movement.created_date}-${index}`} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(movement.created_date)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {movement.direction === 'IN'
                              ? <ArrowUpCircle size={15} className="shrink-0 text-green-600" />
                              : <ArrowDownCircle size={15} className="shrink-0 text-red-500" />}
                            <span className={`inline-flex max-w-full truncate text-[11px] px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[movement.movement_type] || 'bg-muted text-muted-foreground border-border'}`}>
                              {movement.movement_type || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 min-w-0">
                          <p className="font-medium text-foreground truncate">{movement.item_name || '—'}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{movement.sku || '—'}</p>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-semibold">
                          <span className={movement.direction === 'IN' ? 'text-green-700' : 'text-red-600'}>
                            {movement.direction === 'IN' ? '+' : '-'}{movement.qty || 0}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-foreground">{movement.balance_after ?? '—'}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">{movement.source_type || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
