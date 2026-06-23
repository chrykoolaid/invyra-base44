import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { differenceInDays, format, parseISO } from 'date-fns';
import { AlertTriangle, CalendarClock, Layers, RefreshCw, ScanLine, ShieldCheck } from 'lucide-react';

function daysUntil(expiryDate) {
  if (!expiryDate) return null;
  const parsed = parseISO(expiryDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return differenceInDays(parsed, new Date());
}

function formatExpiry(expiryDate) {
  if (!expiryDate) return '—';
  const parsed = parseISO(expiryDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yyyy');
}

function daysLabel(days) {
  if (days === null || Number.isNaN(days)) return '—';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  return `${days}d`;
}

function suggestedPath(row, days) {
  if (row.action_flag === 'Ready for Markdown') return 'Review for Markdown';
  if (row.action_flag === 'Ready for Wastage') return 'Review for Wastage';
  if (days !== null && days < 0) return 'Review for Wastage';
  if (days !== null && days <= 14) return 'Review for Markdown';
  return 'Monitor';
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 min-h-[104px] flex flex-col justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-2 leading-none">{value}</p>
      </div>
      {helper && <p className="text-xs text-muted-foreground mt-3 leading-snug">{helper}</p>}
    </div>
  );
}

function PathBadge({ label }) {
  const cls = label === 'Review for Wastage'
    ? 'bg-red-50 text-red-700 border-red-200'
    : label === 'Review for Markdown'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-muted text-muted-foreground border-border';

  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{label}</span>;
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

  const expiryRows = useMemo(() => (
    balances.length > 0 ? balances : batches
  ), [balances, batches]);

  const stats = useMemo(() => {
    const c = { expired: 0, today: 0, week: 0, fortnight: 0, month: 0, healthy: 0 };

    expiryRows.forEach(row => {
      const days = daysUntil(row.expiry_date);
      if (days === null) return;
      if (days < 0) c.expired++;
      else if (days === 0) c.today++;
      else if (days <= 7) c.week++;
      else if (days <= 14) c.fortnight++;
      else if (days <= 30) c.month++;
      else c.healthy++;
    });

    return {
      ...c,
      barcodeCount: barcodes.length,
    };
  }, [expiryRows, barcodes.length]);

  const attentionRows = useMemo(() => {
    return expiryRows
      .map(row => {
        const days = daysUntil(row.expiry_date);
        return { ...row, days };
      })
      .filter(row => row.days !== null && (row.days <= 30 || row.action_flag === 'Ready for Markdown' || row.action_flag === 'Ready for Wastage'))
      .sort((a, b) => a.days - b.days)
      .slice(0, 10);
  }, [expiryRows]);

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
              Review expired and near-expiry stock evidence. This page can route attention to Markdown or Wastage review, but it does not create markdowns, write off waste, post movements, or adjust stock.
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

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <SummaryCard label="Expired" value={stats.expired} helper="Past expiry date" />
        <SummaryCard label="Due Today" value={stats.today} helper="Expires today" />
        <SummaryCard label="≤7 Days" value={stats.week} helper="Urgent review window" />
        <SummaryCard label="≤14 Days" value={stats.fortnight} helper="Markdown review window" />
        <SummaryCard label="≤30 Days" value={stats.month} helper="Monitor or plan action" />
        <SummaryCard label="Healthy" value={stats.healthy} helper="More than 30 days" />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Needs Attention</h2>
          </div>
          <span className="text-xs text-muted-foreground">{lastViewed ? `Viewed ${lastViewed}` : 'No refresh recorded'}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : batches.length === 0 && balances.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No expiry batches recorded yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add batches in Batch & Lot Register or scan an item in Barcode Lookup.</p>
          </div>
        ) : attentionRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No expired or near-expiry batches need attention right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  {['Item', 'Batch', 'Location', 'Expiry', 'Days Left', 'Suggested Next Step'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attentionRows.map((row, i) => {
                  const path = suggestedPath(row, row.days);
                  return (
                    <tr key={row.id || `${row.sku}-${row.batch_number}-${i}`} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-foreground">{row.item_name || 'Unnamed item'}</p>
                        <p className="font-mono text-xs text-muted-foreground">{row.sku || 'No SKU'}</p>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{row.batch_number || row.lot_number || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.location_name || '—'}{row.storage_area_name ? ` · ${row.storage_area_name}` : ''}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{formatExpiry(row.expiry_date)}</td>
                      <td className={`px-4 py-2.5 whitespace-nowrap ${row.days < 0 ? 'text-red-600 font-semibold' : row.days <= 7 ? 'text-orange-600 font-semibold' : 'text-foreground'}`}>{daysLabel(row.days)}</td>
                      <td className="px-4 py-2.5"><PathBadge label={path} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Search barcode, SKU, batch number, or lot number without changing stock.</p>
        </button>
        <button
          onClick={() => onSelectTab('batches')}
          className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-muted/30 transition-colors"
        >
          <Layers size={16} className="text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground">Batch & Lot Register</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Add and maintain batch metadata for expiry visibility only.</p>
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
