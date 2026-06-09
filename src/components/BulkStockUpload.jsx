import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ENV_LIVE } from '@/lib/envFilter';
import { postInventoryMovement } from '@/lib/inventoryMovement';
import { Upload, X, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

// Parse a CSV text into an array of {sku, stock} rows
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], error: 'CSV must have a header row and at least one data row.' };

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const skuIdx = headers.indexOf('sku');
  const stockIdx = headers.indexOf('stock');

  if (skuIdx === -1 || stockIdx === -1) {
    return { rows: [], error: 'CSV must have "sku" and "stock" columns.' };
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const sku = cols[skuIdx];
    const stock = Number(cols[stockIdx]);
    if (!sku) continue;
    if (isNaN(stock) || stock < 0) {
      return { rows: [], error: `Row ${i + 1}: invalid stock value "${cols[stockIdx]}" for SKU "${sku}".` };
    }
    rows.push({ sku, stock });
  }

  if (rows.length === 0) return { rows: [], error: 'No valid data rows found.' };
  return { rows, error: null };
}

function downloadTemplate() {
  const csv = 'sku,stock\nCHM-001,50\nPKG-001,200';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stock_update_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkStockUpload({ allItems, onClose, onDone }) {
  const fileRef = useRef(null);
  const [parseResult, setParseResult] = useState(null); // { rows, error }
  const [preview, setPreview] = useState([]); // enriched rows with match info
  const [applying, setApplying] = useState(false);
  const [results, setResults] = useState(null); // { updated, notFound }

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const result = parseCsv(e.target.result);
      setParseResult(result);
      if (!result.error) {
        const enriched = result.rows.map(row => {
          const match = allItems.find(i => (i.sku || '').toLowerCase() === row.sku.toLowerCase());
          return { ...row, match, currentStock: match?.stock ?? null };
        });
        setPreview(enriched);
      } else {
        setPreview([]);
      }
      setResults(null);
    };
    reader.readAsText(file);
  };

  const handleApply = async () => {
    const toUpdate = preview.filter(r => r.match);
    if (toUpdate.length === 0) return;
    setApplying(true);
    const user = await base44.auth.me();
    for (const r of toUpdate) {
      const diff = Number(r.stock) - Number(r.match.stock || 0);
      if (diff === 0) continue;
      await postInventoryMovement({
        item: r.match,
        movementType: 'ADJUST',
        direction: diff > 0 ? 'IN' : 'OUT',
        qty: Math.abs(diff),
        sourceType: 'MANUAL',
        sourceRef: `BULK-${Date.now().toString(36).toUpperCase()}`,
        sourceModule: 'Bulk Stock Upload',
        notes: 'Bulk stock upload adjustment',
        siteId: r.match.site_id || '',
        environment: ENV_LIVE,
        user,
      });
    }
    setApplying(false);
    setResults({
      updated: toUpdate.length,
      notFound: preview.filter(r => !r.match).map(r => r.sku),
    });
  };

  const handleFinish = () => {
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Bulk Stock Update</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Upload a CSV with <code className="font-mono bg-muted px-1 rounded">sku</code> and <code className="font-mono bg-muted px-1 rounded">stock</code> columns to update multiple items at once.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Upload zone */}
          {!results && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="border-2 border-dashed border-border rounded-2xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <Upload size={24} className="text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Click to upload or drag & drop a CSV</p>
              <p className="text-xs text-muted-foreground">Required columns: <code className="font-mono bg-muted px-1 rounded">sku</code>, <code className="font-mono bg-muted px-1 rounded">stock</code></p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
          )}

          {/* Download template */}
          {!results && (
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Download size={12} /> Download CSV template
            </button>
          )}

          {/* Parse error */}
          {parseResult?.error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle size={15} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{parseResult.error}</p>
            </div>
          )}

          {/* Preview table */}
          {!results && preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{preview.length} rows parsed</p>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wide">
                    <tr>
                      {['SKU', 'Item Name', 'Current Stock', 'New Stock', 'Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={row.sku} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.sku}</td>
                        <td className="px-3 py-2 text-foreground">{row.match?.name || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.currentStock ?? '—'}</td>
                        <td className="px-3 py-2 font-semibold text-foreground">{row.stock}</td>
                        <td className="px-3 py-2">
                          {row.match
                            ? <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-200">Will update</span>
                            : <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600 border border-red-200">SKU not found</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <CheckCircle2 size={15} className="text-green-700 mt-0.5 shrink-0" />
                <p className="text-sm text-green-800 font-medium">{results.updated} item{results.updated !== 1 ? 's' : ''} updated successfully.</p>
              </div>
              {results.notFound.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle size={15} className="text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">{results.notFound.length} SKU{results.notFound.length !== 1 ? 's' : ''} not found and skipped:</p>
                    <p className="text-xs text-amber-700 mt-1 font-mono">{results.notFound.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          {!results ? (
            <>
              <button onClick={onClose} className="h-9 px-4 text-sm border border-border rounded-xl bg-card hover:bg-muted transition-colors text-foreground">
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying || preview.filter(r => r.match).length === 0}
                className="h-9 px-5 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {applying ? 'Applying…' : `Apply ${preview.filter(r => r.match).length} Update${preview.filter(r => r.match).length !== 1 ? 's' : ''}`}
              </button>
            </>
          ) : (
            <button onClick={handleFinish} className="h-9 px-5 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}