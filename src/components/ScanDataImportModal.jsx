import { useState } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ScanDataImportModal({ onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState([]);

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setError('');
    setPreview([]);
    setFile(f);

    // Parse and preview file
    try {
      const text = await f.text();
      let parsed = [];

      if (f.name.endsWith('.json')) {
        parsed = JSON.parse(text);
      } else if (f.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        parsed = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] }), {});
        });
      } else {
        setError('Only .csv and .json files supported');
        setFile(null);
        return;
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setError('File must contain an array of scan records');
        setFile(null);
        return;
      }

      setPreview(parsed.slice(0, 3));
    } catch (err) {
      setError(`Parse error: ${err.message}`);
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) return;

    setImporting(true);
    setError('');

    try {
      const text = await file.text();
      let scanData = [];

      if (file.name.endsWith('.json')) {
        scanData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        scanData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] }), {});
        });
      }

      const response = await base44.functions.invoke('receiveGapScanData', {
        scanData,
        scanTimestamp: new Date().toISOString(),
      });

      if (response.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          onImportSuccess(response.data.data);
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Upload scan file</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">Done</p>
              <p className="text-sm text-muted-foreground mt-1">Your scan data is now in GapScan.</p>
            </div>
          </div>
        ) : (
          <div className="px-5 py-6 space-y-5">
            {/* Step 1: File input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground">Step 1: Pick your file</label>
              <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/20 transition-colors">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={importing}
                />
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground mb-1">Click or drag file</p>
                  <p className="text-xs text-muted-foreground">.csv or .json only</p>
                  {file && <p className="text-xs text-green-600 font-medium mt-2">✓ {file.name}</p>}
                </div>
              </label>
            </div>

            {/* Error state */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700">Problem</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Step 2: Preview */}
            {preview.length > 0 && !error && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground">Step 2: Check your data</label>
                <div className="border border-border rounded-lg overflow-auto max-h-40 bg-background">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted text-muted-foreground border-b border-border">
                      <tr>
                        {Object.keys(preview[0]).map(key => (
                          <th key={key} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className={`${i % 2 === 0 ? 'bg-card' : ''} border-t border-border`}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 text-foreground">{String(val).slice(0, 25)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={onClose}
                disabled={importing}
                className="h-9 px-4 text-sm border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !file || preview.length === 0}
                className={`h-9 px-5 text-sm rounded-lg font-semibold transition-opacity ${
                  importing || !file || preview.length === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {importing ? 'Loading…' : 'Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}