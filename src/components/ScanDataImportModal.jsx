import { useState } from 'react';
import { X, Upload, AlertCircle, Check } from 'lucide-react';
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
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Import Scan Data</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-10 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={24} className="text-green-600" />
              </div>
            </div>
            <p className="font-semibold text-foreground">Import successful</p>
            <p className="text-sm text-muted-foreground">Scan data has been loaded and is ready for analysis.</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* File input */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Select file
              </label>
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={importing}
                />
                <div className="text-center">
                  <Upload size={20} className="mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Drag CSV or JSON file here, or click to browse</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Supported: .csv, .json</p>
                </div>
              </label>
              {file && <p className="text-xs text-muted-foreground mt-2">✓ {file.name}</p>}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Preview (first 3 rows)</p>
                <div className="border border-border rounded overflow-x-auto bg-background">
                  <table className="w-full text-[11px]">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        {Object.keys(preview[0]).map(key => (
                          <th key={key} className="text-left px-2 py-1.5 font-medium whitespace-nowrap">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-background border-t border-border'}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-2 py-1.5 text-muted-foreground">{String(val).slice(0, 20)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={onClose}
                disabled={importing}
                className="h-8 px-4 text-sm border border-border rounded hover:bg-muted transition-colors text-foreground disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !file || preview.length === 0}
                className="h-8 px-5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}