import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SupplierImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            sku: values[headers.indexOf('sku')] || '',
            name: values[headers.indexOf('name')] || values[headers.indexOf('item')] || '',
            supplier: values[headers.indexOf('supplier')] || '',
            unit: values[headers.indexOf('unit')] || 'units',
            unit_cost: values[headers.indexOf('unit_cost')] || values[headers.indexOf('price')] || '',
          };
        }).filter(r => r.sku || r.name);

        setFile(selectedFile);
        setPreview(rows.slice(0, 5));
        setResult(null);
      } catch (err) {
        setResult({ error: 'Failed to parse CSV: ' + err.message });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) return;
    
    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            sku: values[headers.indexOf('sku')] || '',
            name: values[headers.indexOf('name')] || values[headers.indexOf('item')] || '',
            supplier: values[headers.indexOf('supplier')] || '',
            unit: values[headers.indexOf('unit')] || 'units',
            unit_cost: values[headers.indexOf('unit_cost')] || values[headers.indexOf('price')] || '',
          };
        }).filter(r => r.sku || r.name);

        const response = await base44.functions.invoke('importSupplierCatalogue', { rows });
        setResult(response.data.results);
        setImporting(false);
        
        if (response.data.results.success > 0) {
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 2000);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setResult({ error: err.message });
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Supplier Catalogue Import</h2>
            <p className="text-xs text-muted-foreground mt-1">Import SKU, pricing, and supplier data from CSV</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!file ? (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <label className="block cursor-pointer">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Select CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">Columns: SKU, Name, Supplier, Unit, Unit Cost</p>
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          ) : (
            <>
              <div className="bg-muted/25 rounded-xl p-3 text-sm">
                <p className="font-medium text-foreground mb-1">{file.name}</p>
                <p className="text-xs text-muted-foreground">{preview.length} rows to import</p>
              </div>

              {preview.length > 0 && !result && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/15">
                      <tr>
                        {['SKU', 'Name', 'Supplier', 'Unit Cost'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-mono text-foreground">{row.sku}</td>
                          <td className="px-3 py-2 text-foreground">{row.name}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{row.supplier || '—'}</td>
                          <td className="px-3 py-2 font-mono text-foreground">{row.unit_cost || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result && (
                <div className={`rounded-xl p-3 ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-start gap-2">
                    {result.error ? (
                      <AlertCircle className="h-4 w-4 text-red-700 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      {result.error ? (
                        <p className="text-xs text-red-700 font-medium">{result.error}</p>
                      ) : (
                        <>
                          <p className="text-xs text-green-700 font-medium">Import complete</p>
                          <p className="text-xs text-green-600 mt-1">{result.success} successful • {result.failed} failed</p>
                          {result.errors.length > 0 && (
                            <div className="mt-2 max-h-24 overflow-y-auto text-[10px] text-green-600 space-y-1">
                              {result.errors.slice(0, 3).map((e, i) => <p key={i}>• {e}</p>)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border bg-muted/10 flex gap-2 justify-end">
          <button
            onClick={() => {
              setFile(null);
              setPreview([]);
              setResult(null);
            }}
            className="px-3 py-1.5 text-sm rounded-xl border border-border hover:bg-muted transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-3 py-1.5 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 font-medium"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : null}
            {importing ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}