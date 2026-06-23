import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { Search, ScanLine, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

const expiryBadge = (expiryDate) => {
  if (!expiryDate) return null;
  const parsed = parseISO(expiryDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const days = differenceInDays(parsed, new Date());
  if (days < 0)  return { label: 'Expired', cls: 'bg-red-100 text-red-700 border-red-200', days };
  if (days === 0) return { label: 'Expires Today', cls: 'bg-red-100 text-red-700 border-red-200', days };
  if (days <= 7)  return { label: `${days}d left`, cls: 'bg-orange-100 text-orange-700 border-orange-200', days };
  if (days <= 14) return { label: `${days}d left`, cls: 'bg-amber-100 text-amber-700 border-amber-200', days };
  if (days <= 30) return { label: `${days}d left`, cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', days };
  return { label: `${days}d left`, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', days };
};

function formatDate(date) {
  if (!date) return '—';
  const parsed = parseISO(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yyyy');
}

function reviewPath(batch) {
  const badge = expiryBadge(batch.expiry_date);
  if (batch.action_flag === 'Ready for Markdown') return 'Review for Markdown';
  if (batch.action_flag === 'Ready for Wastage') return 'Review for Wastage';
  if (!badge) return 'Monitor';
  if (badge.days < 0) return 'Review for Wastage';
  if (badge.days <= 14) return 'Review for Markdown';
  return 'Monitor';
}

function DetailBlock({ title, rows }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1.5">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium text-foreground text-right break-all">{row.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatchResultCard({ batch }) {
  const badge = expiryBadge(batch.expiry_date);
  const path = reviewPath(batch);
  const pathCls = path === 'Review for Wastage'
    ? 'bg-red-50 text-red-700 border-red-200'
    : path === 'Review for Markdown'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{batch.item_name || 'Unnamed item'}</p>
          <p className="text-xs font-mono text-muted-foreground">{batch.sku || 'No SKU'}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pathCls}`}>{path}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
        <DetailBlock title="Item Identity" rows={[
          { label: 'SKU', value: batch.sku },
          { label: 'Item', value: batch.item_name },
        ]} />
        <DetailBlock title="Batch / Lot Details" rows={[
          { label: 'Batch', value: batch.batch_number },
          { label: 'Lot', value: batch.lot_number },
        ]} />
        <DetailBlock title="Expiry Status" rows={[
          { label: 'Expiry', value: formatDate(batch.expiry_date) },
          { label: 'Window', value: badge?.label || batch.status || '—' },
        ]} />
        <DetailBlock title="Linked Location" rows={[
          { label: 'Location', value: batch.location_name },
          { label: 'Storage', value: batch.storage_area_name },
        ]} />
        <DetailBlock title="Recommended Review Path" rows={[
          { label: 'Path', value: path },
          { label: 'Note', value: 'Advisory only' },
        ]} />
      </div>
    </div>
  );
}

export default function BarcodeLookupTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const term = query.trim();
    setLoading(true);
    setSearched(true);

    const [barcodes, skuBarcodes, batchNumbers, lotNumbers, skuBatches] = await Promise.all([
      base44.entities.ItemBarcode.filter({ ...envFilter(), barcode: term }, '-created_date', 10),
      base44.entities.ItemBarcode.filter({ ...envFilter(), sku: term }, '-created_date', 20),
      base44.entities.ItemBatch.filter({ ...envFilter(), batch_number: term }, '-created_date', 10),
      base44.entities.ItemBatch.filter({ ...envFilter(), lot_number: term }, '-created_date', 10),
      base44.entities.ItemBatch.filter({ ...envFilter(), sku: term }, '-created_date', 20),
    ]);

    const allBarcodes = [...(barcodes || []), ...(skuBarcodes || [])].filter(
      (b, i, arr) => arr.findIndex(x => x.id === b.id) === i
    );
    const allBatches = [...(batchNumbers || []), ...(lotNumbers || []), ...(skuBatches || [])].filter(
      (b, i, arr) => arr.findIndex(x => x.id === b.id) === i
    );

    setResults({ barcodes: allBarcodes, batches: allBatches });
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Scan barcode or enter SKU / batch / lot number…"
              className="w-full h-10 border border-border rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
          >
            <Search size={14} /> Search
          </button>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p>Scan or enter a barcode, SKU, batch number, or lot number. This lookup helps confirm batch identity, expiry status, and item tracking details.</p>
          <p className="mt-1"><span className="font-medium text-foreground">Try:</span> SKU, barcode, batch number, lot number</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && results && (
        <div className="space-y-4">
          {results.batches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Batch / Lot Result Cards ({results.batches.length})</p>
              {results.batches.map(batch => <BatchResultCard key={batch.id} batch={batch} />)}
            </div>
          )}

          {results.barcodes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Barcode Links ({results.barcodes.length})</p>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                    <tr>
                      {['Barcode', 'SKU', 'Item', 'Type', 'Primary', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.barcodes.map((b, i) => (
                      <tr key={b.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                        <td className="px-4 py-2.5 font-mono text-xs">{b.barcode}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{b.sku}</td>
                        <td className="px-4 py-2.5 font-medium">{b.item_name}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">{b.barcode_type}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {b.is_primary
                            ? <CheckCircle2 size={14} className="text-emerald-500" />
                            : <XCircle size={14} className="text-muted-foreground" />}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${b.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground border-border'}`}>
                            {b.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.barcodes.length === 0 && results.batches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-border bg-card">
              <Tag size={32} className="text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm font-medium text-foreground">No results found for &quot;{query}&quot;</p>
              <p className="text-xs text-muted-foreground mt-1">Try a SKU, barcode, batch number, or lot number.</p>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border bg-muted/20">
          <ScanLine size={36} className="text-muted-foreground mb-3 opacity-30" />
          <p className="text-sm font-medium text-foreground">Scan or enter a barcode, SKU, batch number, or lot number.</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">This lookup helps confirm batch identity, expiry status, and item tracking details before staff move to Markdown or Wastage workflows.</p>
        </div>
      )}
    </div>
  );
}
