import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Download, Lightbulb, Upload, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ScanDataImportModal from '@/components/ScanDataImportModal';

const scanData = [
  { sku: 'CHM-001', name: 'Premium Detergent 20L', onHand: 4,   avgUse: 3.2, daysLeft: 1,  suggested: 20, risk: 'Critical', flag: 'Critical' },
  { sku: 'MNT-001', name: 'Machine Descaler',      onHand: 3,   avgUse: 1.0, daysLeft: 3,  suggested: 10, risk: 'Critical', flag: 'Critical' },
  { sku: 'CHM-003', name: 'Bleach 5L',             onHand: 12,  avgUse: 2.8, daysLeft: 4,  suggested: 18, risk: 'High',     flag: 'Watch'    },
  { sku: 'CHM-004', name: 'Stain Remover 2L',      onHand: 8,   avgUse: 1.5, daysLeft: 5,  suggested: 12, risk: 'High',     flag: 'Watch'    },
  { sku: 'CHM-002', name: 'Fabric Softener 20L',   onHand: 18,  avgUse: 2.1, daysLeft: 8,  suggested: 8,  risk: 'Medium',   flag: 'Watch'    },
  { sku: 'PKG-002', name: 'Garment Tag Roll',       onHand: 5,   avgUse: 0.4, daysLeft: 12, suggested: 4,  risk: 'Low',      flag: 'OK'       },
  { sku: 'OPS-001', name: 'Gloves Disposable',      onHand: 340, avgUse: 18,  daysLeft: 18, suggested: 0,  risk: 'Low',      flag: 'OK'       },
  { sku: 'PKG-001', name: 'Packaging Bag Large',    onHand: 900, avgUse: 42,  daysLeft: 21, suggested: 0,  risk: 'None',     flag: 'OK'       },
];

const flagStyle = {
  Critical: 'bg-red-50 text-red-700 border border-red-200',
  Watch:    'bg-amber-50 text-amber-700 border border-amber-200',
  OK:       'bg-green-50 text-green-700 border border-green-200',
};

const daysLeftStyle = (days) => {
  if (days <= 3)  return 'text-red-600 font-semibold';
  if (days <= 7)  return 'text-amber-600 font-medium';
  return 'text-foreground';
};

export default function GapScan() {
  const navigate = useNavigate();
  const [lookback, setLookback] = useState(14);
  const [selected, setSelected] = useState(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [results, setResults] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedFrom, setImportedFrom] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const hasResults = results.length > 0;

  const handleRunScan = () => {
    setResults(scanData);
    setSelected(new Set());
    setShowExplanation(false);
    setHighlightedRow(null);
    setImportedFrom('');
    setImportError('');
  };

  const handleImportFromScanner = async () => {
    setImporting(true);
    setImportError('');
    try {
      const response = await base44.functions.invoke('receiveGapScanData', {
        scanData: [],
        trigger: 'manual_fetch',
      });
      
      if (response.data?.success && response.data?.data) {
        setResults(response.data.data);
        setImportedFrom(`Imported ${response.data.data.length} items from scanner at ${new Date(response.data.receivedAt).toLocaleTimeString()}`);
        setSelected(new Set());
        setShowExplanation(false);
        setHighlightedRow(null);
      }
    } catch (err) {
      setImportError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const toggleRow = (sku) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === results.length ? new Set() : new Set(results.map(r => r.sku)));
  };

  const getExplanation = () => {
    if (selected.size === 0) return '';

    const selectedItems = results.filter(r => selected.has(r.sku));
    const avgDaysLeft = selectedItems.reduce((sum, r) => sum + r.daysLeft, 0) / selectedItems.length;
    const avgUsage = selectedItems.reduce((sum, r) => sum + r.avgUse, 0) / selectedItems.length;

    if (avgDaysLeft <= 3 && avgUsage > 2) {
      return 'High usage rate with low remaining stock. Suggested reorder to maintain 14-day coverage.';
    } else if (avgDaysLeft <= 7) {
      return 'Stock levels approaching reorder point. Consider ordering to prevent stockouts.';
    } else if (avgUsage > 0 && avgDaysLeft > 14) {
      return 'Current stock levels are adequate. Monitor usage trends.';
    }
    return 'Review usage patterns and adjust reorder quantities as needed.';
  };

  const handleImportSuccess = (data) => {
    setResults(data);
    setSelected(new Set());
    setShowExplanation(false);
    setHighlightedRow(null);
    setImportedFrom(`Imported ${data.length} items from scan file`);
    setImportError('');
  };

  return (
    <div className="p-6">
      {showImportModal && (
        <ScanDataImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}
      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground mb-4">Gap Scan</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-2 border border-border rounded bg-card px-3 h-8">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Lookback</span>
          <select
            value={lookback}
            onChange={e => setLookback(Number(e.target.value))}
            className="text-sm bg-transparent focus:outline-none cursor-pointer"
          >
            {[7, 14, 21, 30].map(d => (
              <option key={d} value={d}>{d} days</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRunScan}
          className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          <Play size={12} /> Run Scan
        </button>

        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
        >
          <Upload size={13} /> Upload Scan File
        </button>

        <button
          disabled={!hasResults}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={13} /> Export
        </button>

        <button
          disabled={selected.size === 0}
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb size={13} /> Explain Selected {selected.size > 0 && `(${selected.size})`}
        </button>

        <span className="ml-auto text-xs text-muted-foreground">
          {hasResults ? `${results.length} items scanned` : 'No scan run'}
        </span>
      </div>

      {/* Error panel */}
      {importError && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{importError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Imported from badge */}
      {importedFrom && (
        <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✓ {importedFrom}
        </div>
      )}

      {/* Explanation panel */}
      {showExplanation && selected.size > 0 && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <div className="flex items-start gap-3">
            <Lightbulb size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Analysis ({selected.size} item{selected.size !== 1 ? 's' : ''} selected)</p>
              <p className="text-blue-600">{getExplanation()}</p>
            </div>
          </div>
        </div>
      )}

      {!hasResults ? (
        <div className="border border-dashed border-border rounded bg-card min-h-[220px] flex items-center justify-center text-center px-6">
          <div className="max-w-md">
            <p className="text-sm font-medium text-foreground mb-1">No gap scan results yet</p>
            <p className="text-sm text-muted-foreground">
              Choose a lookback period, then run the scan to populate stock risk, days left, and suggested order quantities.
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === results.length}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                {['SKU', 'Item', 'On Hand', 'Avg Use / Day', 'Days Left', 'Suggested Order', 'Risk', 'Flag'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr
                  key={row.sku}
                  onClick={() => toggleRow(row.sku)}
                  className={`border-t border-border cursor-pointer transition-all duration-150 ${
                    highlightedRow === row.sku ? 'bg-primary/10 scale-98' :
                    selected.has(row.sku) ? 'bg-primary/5' : i % 2 === 0 ? 'bg-card' : 'bg-background'
                  } hover:bg-accent/40`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(row.sku)}
                      onChange={() => toggleRow(row.sku)}
                      onClick={e => e.stopPropagation()}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.sku}</td>
                  <td
                    onClick={() => {
                      setHighlightedRow(row.sku);
                      setTimeout(() => navigate('/Inventory'), 200);
                    }}
                    className="px-4 py-2.5 font-medium text-primary hover:underline cursor-pointer transition-colors"
                  >
                    {row.name}
                  </td>
                  <td className="px-4 py-2.5">{row.onHand.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.avgUse}</td>
                  <td className={`px-4 py-2.5 ${daysLeftStyle(row.daysLeft)}`}>{row.daysLeft}</td>
                  <td className="px-4 py-2.5">{row.suggested > 0 ? row.suggested : '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.risk}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${flagStyle[row.flag]}`}>
                      {row.flag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}