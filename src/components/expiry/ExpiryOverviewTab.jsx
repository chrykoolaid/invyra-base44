import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, CalendarClock, Layers, RefreshCw, ScanLine, ShieldCheck } from 'lucide-react';

function daysUntil(expiryDate) {
  if (!expiryDate) return null;
  const parsed = parseISO(expiryDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return differenceInDays(parsed, new Date());
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 min-h-[112px] flex flex-col justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-2 leading-none">{value}</p>
      </div>
      {helper && <p className="text-xs text-muted-foreground mt-3 leading-snug">{helper}</p>}
    </div>
  );
}

function NeedsAttentionRow({ label, count, guidance, tone = 'default' }) {
  const toneClass = tone === 'warning'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : tone === 'danger'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_90px_190px] gap-2 md:gap-4 px-4 py-3 border-t border-border first:border-t-0 items-center">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div>
        <span className={`inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-full border text-xs font-semibold ${toneClass}`}>
          {count}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{guidance}</div>
    </div>
  );
}

export default function ExpiryOverviewTab({ onSelectTab }) {
  const [batches, setBatches] = useState([]);
  const [balances, setBalances] = useState([]);
  const [barcodes, setBarcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastViewed, setLastViewed] = useState('');

  const load = async () => {
    setLoading(true);
    const [batchRows, balanceRows, barcodeRows] = await Promise.all([
      base44.entities.ItemBatch.filter(envFilter(), '-created_date', 500),
      base44.entities.ItemExpiryBalance.filter(envFilter(), 'expiry_date', 500),
      base44.entities.ItemBarcode.filter(envFilter(), '-created_date', 500),
    ]);
    setBatches(batchRows || []);
    setBalances(balanceRows || []);
    setBarcodes(barcodeRows || []);
    setLastViewed(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const activeBatches = batches.filter(b => b.status !== 'Depleted' && b.status !== 'Disposed').length;
    const expiredBatches = batches.filter(b => (daysUntil(b.expiry_date) ?? 9999) < 0 || b.status === 'Expired').length;
    const nearExpiryBatches = batches.filter(b => {
      const days = daysUntil(b.expiry_date);
      return days !== null && days >= 0 && days <= 30;
    }).length;
    const missingExpiry = batches.filter(b => !b.expiry_date).length;
    const missingStorageArea = batches.filter(b => !b.location_id || !b.storage_area_id).length;
    const unlinkedBarcodes = barcodes.filter(b => !b.item_id || !b.sku).length;
    const markdownReady = balances.filter(b => b.action_flag === 'Ready for Markdown').length;
    const wastageReady = balances.filter(b => b.action_flag === 'Ready for Wastage').length;
    const fefoReady = balances.filter(b => b.action_flag === 'Priority FEFO').length;
    const needsAttention = expiredBatches + nearExpiryBatches + missingExpiry + missingStorageArea + unlinkedBarcodes + markdownReady + wastageReady;

    return {
      activeBatches,
      nearExpiryBatches,
      expiredBatches,
      missingExpiry,
      missingStorageArea,
      unlinkedBarcodes,
      markdownReady,
      wastageReady,
      fefoReady,
      needsAttention,
      barcodeCount: barcodes.length,
    };
  }, [batches, balances, barcodes]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl border border-border bg-muted/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={16} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Expiry, batch, and barcode visibility</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              This module tracks barcodes, batches, lots, and expiry exposure. It can guide Markdown, Wastage, and FEFO review, but does not perform pricing changes, write-offs, or stock adjustments.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="h-9 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted disabled:opacity-50 flex items-center gap-2 w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <SummaryCard label="Active Batches" value={stats.activeBatches} helper="Tracked batch or lot records" />
        <SummaryCard label="Near Expiry" value={stats.nearExpiryBatches} helper="Batches within 30 days" />
        <SummaryCard label="Expired" value={stats.expiredBatches} helper="Expired batches needing review" />
        <SummaryCard label="Barcode Links" value={stats.barcodeCount} helper="Registered scannable codes" />
        <SummaryCard label="Needs Attention" value={stats.needsAttention} helper={lastViewed ? `Viewed ${lastViewed}` : 'No refresh recorded'} />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
          <AlertTriangle size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Needs Attention</h2>
        </div>
        {stats.needsAttention === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No expiry or barcode setup issues found.</div>
        ) : (
          <div>
            <NeedsAttentionRow label="Near-expiry batches needing review" count={stats.nearExpiryBatches} guidance="Review expiry window" tone={stats.nearExpiryBatches > 0 ? 'warning' : 'default'} />
            <NeedsAttentionRow label="Expired batches still tracked" count={stats.expiredBatches} guidance="Route to Wastage if required" tone={stats.expiredBatches > 0 ? 'danger' : 'default'} />
            <NeedsAttentionRow label="Barcode records without item assignment" count={stats.unlinkedBarcodes} guidance="Complete barcode link" tone={stats.unlinkedBarcodes > 0 ? 'warning' : 'default'} />
            <NeedsAttentionRow label="Batches without expiry date" count={stats.missingExpiry} guidance="Complete batch data" tone={stats.missingExpiry > 0 ? 'warning' : 'default'} />
            <NeedsAttentionRow label="Batches missing location or storage area" count={stats.missingStorageArea} guidance="Review setup" tone={stats.missingStorageArea > 0 ? 'warning' : 'default'} />
            <NeedsAttentionRow label="Ready for Markdown" count={stats.markdownReady} guidance="Open Markdown workflow" tone={stats.markdownReady > 0 ? 'warning' : 'default'} />
            <NeedsAttentionRow label="Ready for Wastage" count={stats.wastageReady} guidance="Open Wastage workflow" tone={stats.wastageReady > 0 ? 'danger' : 'default'} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <button
          onClick={() => onSelectTab('lookup')}
          className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-muted/30 transition-colors"
        >
          <ScanLine size={16} className="text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground">Barcode Lookup</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Search barcode, SKU, or batch number without changing stock.</p>
        </button>
        <button
          onClick={() => onSelectTab('batches')}
          className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-muted/30 transition-colors"
        >
          <Layers size={16} className="text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground">Batch & Lot Register</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Maintain batch metadata and expiry records for tracking.</p>
        </button>
        <button
          onClick={() => onSelectTab('expiry')}
          className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-muted/30 transition-colors"
        >
          <CalendarClock size={16} className="text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground">Near-Expiry Alerts</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Review FEFO, Markdown, and Wastage guidance only.</p>
        </button>
      </div>
    </div>
  );
}
