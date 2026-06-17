import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ItemDetailsForecastPanel from '@/components/ItemDetailsForecastPanel';
import { envFilter } from '@/lib/envFilter';
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  Package,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  getLocalDevStockMovements,
  isLocalDevInventoryFallbackEnabled,
  localDevInventoryFallbackNotice,
  withLocalDevTimeout,
} from '@/lib/localDevInventoryFallback';

const TYPE_LABELS = {
  RECEIVE: 'Stock In',
  WASTE: 'Wastage',
  REVERSAL: 'Reversal',
  ADJUST: 'Adjustment',
  SALE: 'Stock Out',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
  STOCKTAKE: 'Stocktake',
};

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '—';
  return `₱${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateOnly(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function movementDate(row) {
  const date = new Date(row?.created_date || row?.updated_date || 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function withinLastDays(row, days) {
  const date = movementDate(row);
  if (!date) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

function statusForItem({ item, avgDailyOut, daysCover }) {
  const stock = safeNumber(item?.stock);
  const reorderPoint = item?.reorder_point === null || item?.reorder_point === undefined
    ? null
    : safeNumber(item.reorder_point, null);

  if (reorderPoint !== null && stock <= reorderPoint) {
    return { label: 'Low Stock', tone: 'red', description: 'At or below reorder point' };
  }
  if (avgDailyOut > 0 && daysCover !== null && daysCover <= 7) {
    return { label: 'At Risk', tone: 'amber', description: 'Less than 7 days cover' };
  }
  if (stock > 0 && avgDailyOut === 0) {
    return { label: 'Slow Moving', tone: 'slate', description: 'No 30-day outflow recorded' };
  }
  return { label: 'Healthy', tone: 'green', description: 'No immediate item-level issue' };
}

function statusClass(tone) {
  switch (tone) {
    case 'red': return 'bg-red-50 text-red-700 border-red-200';
    case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'green': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function KpiCard({ icon: Icon, label, value, subtext }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 min-w-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground truncate">{label}</p>
        {Icon && <Icon size={14} className="text-muted-foreground shrink-0" />}
      </div>
      <p className="text-xl font-semibold text-foreground leading-tight truncate">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">{subtext}</p>
    </div>
  );
}

function InfoRow({ label, value, valueClassName = '' }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground text-right ${valueClassName}`}>{value}</span>
    </div>
  );
}

function MiniUsageTrend({ movements }) {
  const buckets = useMemo(() => {
    const now = new Date();
    const blocks = [
      { label: 'Days 22–30', start: 30, end: 22, qty: 0 },
      { label: 'Days 15–21', start: 21, end: 15, qty: 0 },
      { label: 'Days 8–14', start: 14, end: 8, qty: 0 },
      { label: 'Days 0–7', start: 7, end: 0, qty: 0 },
    ];

    movements.forEach(row => {
      if (row.direction !== 'OUT') return;
      const date = movementDate(row);
      if (!date) return;
      const ageDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      const block = blocks.find(candidate => ageDays <= candidate.start && ageDays >= candidate.end);
      if (block) block.qty += safeNumber(row.qty);
    });

    const max = Math.max(...blocks.map(block => block.qty), 1);
    return blocks.map(block => ({ ...block, width: Math.max(8, Math.round((block.qty / max) * 100)) }));
  }, [movements]);

  return (
    <div className="space-y-2.5">
      {buckets.map(bucket => (
        <div key={bucket.label} className="grid grid-cols-[88px_1fr_42px] items-center gap-2 text-xs">
          <span className="text-muted-foreground">{bucket.label}</span>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-foreground/40" style={{ width: `${bucket.width}%` }} />
          </div>
          <span className="text-right font-medium text-foreground">{formatNumber(bucket.qty)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ItemDetailsWorkspace({ item, onBack }) {
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [error, setError] = useState('');

  const loadMovements = useCallback(async () => {
    if (!item?.id && !item?.sku) return;
    setLoadingMovements(true);
    setError('');

    try {
      // Read-only and intentionally aligned with the existing Movements/Stock History ledger path.
      const request = base44.entities.StockMovement.filter(envFilter(), '-created_date', 500);
      const rows = await withLocalDevTimeout(request, 4000, 'StockMovement.filter');
      const targetSku = (item?.sku || '').toLowerCase();
      const targetId = item?.id || '';
      const itemRows = (rows || []).filter(row =>
        (targetId && row.item_id === targetId) ||
        (targetSku && (row.sku || '').toLowerCase() === targetSku)
      );
      setMovements(itemRows);
    } catch (err) {
      if (isLocalDevInventoryFallbackEnabled()) {
        setMovements(getLocalDevStockMovements(item));
        setError(localDevInventoryFallbackNotice('Stock movements'));
      } else {
        setError(err?.message || 'Could not load item movement summary.');
      }
    } finally {
      setLoadingMovements(false);
    }
  }, [item]);

  useEffect(() => { loadMovements(); }, [loadMovements]);

  const summary = useMemo(() => {
    const last30 = movements.filter(row => withinLastDays(row, 30));
    const stockIn30 = last30.filter(row => row.direction === 'IN').reduce((sum, row) => sum + safeNumber(row.qty), 0);
    const stockOut30 = last30.filter(row => row.direction === 'OUT').reduce((sum, row) => sum + safeNumber(row.qty), 0);
    const adjustments30 = last30
      .filter(row => row.movement_type === 'ADJUST')
      .reduce((sum, row) => sum + (row.direction === 'IN' ? safeNumber(row.qty) : -safeNumber(row.qty)), 0);
    const wastage30 = last30
      .filter(row => row.movement_type === 'WASTE')
      .reduce((sum, row) => sum + safeNumber(row.qty), 0);
    const net30 = stockIn30 - stockOut30;
    const avgDailyOut = stockOut30 / 30;
    const stock = safeNumber(item?.stock);
    const daysCover = avgDailyOut > 0 ? stock / avgDailyOut : null;
    const lastMovement = movements[0] || null;
    const runoutDate = daysCover !== null
      ? new Date(Date.now() + Math.ceil(daysCover) * 24 * 60 * 60 * 1000)
      : null;
    const status = statusForItem({ item, avgDailyOut, daysCover });
    const reorderPoint = item?.reorder_point === null || item?.reorder_point === undefined ? null : safeNumber(item.reorder_point, null);
    const reorderQty = item?.reorder_qty === null || item?.reorder_qty === undefined ? null : safeNumber(item.reorder_qty, null);
    const suggestedOrderQty = status.label === 'Low Stock' || status.label === 'At Risk'
      ? (reorderQty || Math.max(0, Math.ceil(stockOut30 - stock)))
      : 0;

    return {
      last30,
      stockIn30,
      stockOut30,
      adjustments30,
      wastage30,
      net30,
      avgDailyOut,
      daysCover,
      lastMovement,
      runoutDate,
      status,
      reorderPoint,
      reorderQty,
      suggestedOrderQty,
    };
  }, [item, movements]);

  if (!item) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
          <ArrowLeft size={14} /> Back to Inventory
        </button>
        <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No item selected.
        </div>
      </div>
    );
  }

  const unit = item.unit || 'unit';
  const openFullMovements = () => {
    navigate(`/Movements?sku=${encodeURIComponent(item.sku || '')}`);
  };

  return (
    <div className="p-5 lg:p-6 w-full max-w-none space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to Inventory
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground truncate">{item.name || 'Unnamed item'}</h1>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(summary.status.tone)}`}>
              {summary.status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">SKU: {item.sku || '—'}</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 max-w-md">
          <p className="text-xs text-muted-foreground">
            Item Details upgrades the old stock-history workflow into a read-only item insight view. Full transaction history remains in the Movements module.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard icon={Package} label="On Hand" value={formatNumber(item.stock ?? 0)} subtext={unit} />
        <KpiCard icon={TrendingUp} label="Avg 30D Usage" value={formatNumber(summary.avgDailyOut, 1)} subtext={`${unit} / day outflow`} />
        <KpiCard icon={BarChart3} label="Days Cover" value={summary.daysCover === null ? '—' : formatNumber(summary.daysCover, 0)} subtext={summary.daysCover === null ? 'No 30D outflow' : 'estimated days remaining'} />
        <KpiCard icon={AlertTriangle} label="Status" value={summary.status.label} subtext={summary.status.description} />
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <ItemDetailsForecastPanel item={item} movements={movements} loadingMovements={loadingMovements} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-4">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Item Summary</h2>
            <Activity size={15} className="text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <InfoRow label="SKU" value={item.sku || '—'} />
            <InfoRow label="Unit" value={unit} />
            <InfoRow label="Unit Price" value={formatCurrency(item.cost_per_unit)} />
            <InfoRow label="Supplier" value={item.preferred_supplier || '—'} />
            <InfoRow label="Reorder Point" value={summary.reorderPoint === null ? '—' : `${formatNumber(summary.reorderPoint)} ${unit}`} />
            <InfoRow label="Reorder Qty" value={summary.reorderQty === null ? '—' : `${formatNumber(summary.reorderQty)} ${unit}`} />
            <InfoRow label="Primary Site" value={item.site_id || '—'} />
            <InfoRow label="Last Updated" value={formatDateTime(item.updated_date)} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Usage & Demand</h2>
              <p className="text-xs text-muted-foreground">Last 30 days, based on posted OUT movements</p>
            </div>
            <button
              type="button"
              onClick={loadMovements}
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RefreshCw size={12} className={loadingMovements ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loadingMovements ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading item insights…</div>
          ) : (
            <>
              <MiniUsageTrend movements={summary.last30} />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Avg Daily Out</p>
                  <p className="text-lg font-semibold text-foreground">{formatNumber(summary.avgDailyOut, 1)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Total Out 30D</p>
                  <p className="text-lg font-semibold text-foreground">{formatNumber(summary.stockOut30)}</p>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Reorder Intelligence</h2>
            <AlertTriangle size={15} className="text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <InfoRow label="Current Stock" value={`${formatNumber(item.stock ?? 0)} ${unit}`} />
            <InfoRow label="Reorder Point" value={summary.reorderPoint === null ? '—' : `${formatNumber(summary.reorderPoint)} ${unit}`} />
            <InfoRow label="Reorder Qty" value={summary.reorderQty === null ? '—' : `${formatNumber(summary.reorderQty)} ${unit}`} />
            <InfoRow label="Projected Runout" value={summary.runoutDate ? formatDateOnly(summary.runoutDate) : 'No 30D outflow'} />
            <InfoRow label="Suggested Order Qty" value={summary.suggestedOrderQty > 0 ? `${formatNumber(summary.suggestedOrderQty)} ${unit}` : 'No action'} />
          </div>
          <div className={`mt-4 rounded-lg border px-3 py-3 text-sm ${statusClass(summary.status.tone)}`}>
            <p className="font-semibold">Recommendation</p>
            <p className="mt-1 text-xs">
              {summary.suggestedOrderQty > 0
                ? 'Review this item for reorder. This is read-only decision support and does not create a purchase order.'
                : 'No immediate reorder action suggested from this item-level view.'}
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Stock Movement Summary</h2>
            <p className="text-xs text-muted-foreground">Lightweight summary only. Full ledger stays in Movements. Inbound/outbound are direction totals; category cards are diagnostic breakdowns, not extra additions.</p>
          </div>
          <button
            type="button"
            onClick={openFullMovements}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
          >
            <ExternalLink size={13} /> Open Full Movements
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <InfoMetric label="Last Movement Date" value={formatDateTime(summary.lastMovement?.created_date)} />
          <InfoMetric label="Last Movement Type" value={TYPE_LABELS[summary.lastMovement?.movement_type] || summary.lastMovement?.movement_type || '—'} />
          <InfoMetric label="Inbound 30D" value={`${formatNumber(summary.stockIn30)} ${unit}`} />
          <InfoMetric label="Outbound 30D" value={`${formatNumber(summary.stockOut30)} ${unit}`} />
          <InfoMetric label="Adjustments 30D" value={`${summary.adjustments30 > 0 ? '+' : ''}${formatNumber(summary.adjustments30)} ${unit}`} />
          <InfoMetric label="Wastage 30D" value={`${formatNumber(summary.wastage30)} ${unit}`} />
          <InfoMetric label="Net Change 30D" value={`${summary.net30 > 0 ? '+' : ''}${formatNumber(summary.net30)} ${unit}`} />
          <InfoMetric label="Rows Read" value={`${formatNumber(summary.last30.length)} movement${summary.last30.length === 1 ? '' : 's'}`} />
        </div>
      </section>

      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        Safety lock: this screen is read-only and does not replace the Stock History engine, movement ledger, Gap Scan, Reorder Review, dashboard alerts, reporting, or audit calculations.
      </div>
    </div>
  );
}

function InfoMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground truncate">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-1 truncate">{value}</p>
    </div>
  );
}
