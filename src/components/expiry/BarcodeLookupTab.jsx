import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { Search, ScanLine, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

const expiryBadge = (expiryDate) => {
  if (!expiryDate) return null;
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0)  return { label: 'Expired',     cls: 'bg-red-100 text-red-700 border-red-200' };
  if (days === 0) return { label: 'Expires Today', cls: 'bg-red-100 text-red-700 border-red-200' };
  if (days <= 7)  return { label: `${days}d left`, cls: 'bg-orange-100 text-orange-700 border-orange-200' };
  if (days <= 14) return { label: `${days}d left`, cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (days <= 30) return { label: `${days}d left`, cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: `${days}d left`, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
};

export default function BarcodeLookupTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const [barcodes, batches] = await Promise.all([
      base44.entities.ItemBarcode.filter({ ...envFilter(), barcode: query.trim() }, '-created_date', 10),
      base44.entities.ItemBatch.filter({ ...envFilter(), batch_number: query.trim() }, '-created_date', 10),
    ]);

    // Also search by SKU/item name
    const skuBarcodes = await base44.entities.ItemBarcode.filter({ ...envFilter(), sku: query.trim() }, '-created_date', 20);

    const allBarcodes = [...(barcodes || []), ...(skuBarcodes || [])].filter(
      (b, i, arr) => arr.findIndex(x => x.id === b.id) === i
    );

    setResults({ barcodes: allBarcodes, batches: batches || [] });
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Scan barcode or enter SKU / batch number…"
            className="w-full h-10 border border-border rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
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

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && results && (
        <div className="space-y-4">
          {/* Barcode results */}
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

          {/* Batch results */}
          {results.batches.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Batch Records ({results.batches.length})</p>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                    <tr>
                      {['Batch #', 'SKU', 'Item', 'Expiry', 'Qty', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.batches.map((b, i) => {
                      const badge = expiryBadge(b.expiry_date);
                      return (
                        <tr key={b.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                          <td className="px-4 py-2.5 font-mono text-xs font-semibold">{b.batch_number}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{b.sku}</td>
                          <td className="px-4 py-2.5 font-medium">{b.item_name}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{b.expiry_date ? format(parseISO(b.expiry_date), 'dd MMM yyyy') : '—'}</span>
                              {badge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${badge.cls}`}>{badge.label}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-mono">{b.quantity}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                              b.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              b.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-200' :
                              b.status === 'Near Expiry' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-muted text-muted-foreground border-border'
                            }`}>{b.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.barcodes.length === 0 && results.batches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag size={32} className="text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm font-medium text-muted-foreground">No results found for "{query}"</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try the barcode value, SKU, or batch number.</p>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ScanLine size={36} className="text-muted-foreground mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">Scan or enter a barcode, SKU, or batch number to look up an item.</p>
        </div>
      )}
    </div>
  );
}