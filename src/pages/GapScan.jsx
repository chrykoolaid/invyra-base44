import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Download, Lightbulb, Upload, AlertCircle, ScanLine, ClipboardList, PackagePlus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import ScanDataImportModal from '@/components/ScanDataImportModal';
import FillTasksTab from '@/components/gapscan/FillTasksTab';
import CreateFillTaskModal from '@/components/gapscan/CreateFillTaskModal';

// Derive risk/flag from days left
const getRiskAndFlag = (daysLeft, stock) => {
  if (stock === 0)      return { risk: 'Critical', flag: 'Critical' };
  if (daysLeft <= 3)    return { risk: 'Critical', flag: 'Critical' };
  if (daysLeft <= 7)    return { risk: 'High',     flag: 'Watch'    };
  if (daysLeft <= 14)   return { risk: 'Medium',   flag: 'Watch'    };
  if (daysLeft <= 21)   return { risk: 'Low',      flag: 'OK'       };
  return                       { risk: 'None',     flag: 'OK'       };
};

// Build scan rows from live inventory items + stock movements in the lookback window
const buildScanData = (items, movements, lookbackDays) => {
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

  return items.map(item => {
    // Sum outbound movements in the lookback window for avg use/day
    const outbound = movements.filter(m =>
      m.sku === item.sku &&
      m.direction === 'OUT' &&
      m.status === 'POSTED' &&
      new Date(m.created_date).getTime() >= cutoff
    );
    const totalOut = outbound.reduce((s, m) => s + (m.qty ?? 0), 0);
    const avgUse = lookbackDays > 0 ? Math.round((totalOut / lookbackDays) * 10) / 10 : 0;
    const daysLeft = avgUse > 0 ? Math.round(item.stock / avgUse) : null;
    const suggested = item.reorder_qty ?? 0;
    const { risk, flag } = getRiskAndFlag(daysLeft ?? 999, item.stock);

    return {
      sku:         item.sku,
      name:        item.name,
      systemStock: item.stock,
      onHand:      item.stock, // physical = system until a floor scan overrides it
      avgUse,
      daysLeft:    daysLeft ?? '—',
      suggested:   item.stock === 0 || (daysLeft != null && daysLeft <= 14) ? suggested : 0,
      risk,
      flag,
      unit:        item.unit,
    };
  });
};

const flagStyle = {
  Critical: 'bg-red-50 text-red-700 border border-red-200',
  Watch:    'bg-amber-50 text-amber-700 border border-amber-200',
  OK:       'bg-green-50 text-green-700 border border-green-200',
};

const daysLeftStyle = (days) => {
  if (typeof days !== 'number') return 'text-muted-foreground';
  if (days <= 3)  return 'text-red-600 font-semibold';
  if (days <= 7)  return 'text-amber-600 font-medium';
  return 'text-foreground';
};

// Build real 30-day trend from OUT stock movements grouped by day
const buildTrendData = (movements) => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const byDay = {};
  movements
    .filter(m => m.direction === 'OUT' && m.status === 'POSTED' && new Date(m.created_date).getTime() >= cutoff)
    .forEach(m => {
      const day = new Date(m.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay[day] = (byDay[day] || 0) + 1;
    });

  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    data.push({ date: label, missing: byDay[label] || 0 });
  }
  return data;
};

export default function GapScan() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scan');
  const [lookback, setLookback] = useState(14);
  const [selected, setSelected] = useState(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedFrom, setImportedFrom] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [fillTaskRow, setFillTaskRow] = useState(null); // row for which modal is open
  const hasResults = results.length > 0;

  const handleRunScan = async () => {
    setScanning(true);
    setImportError('');
    setImportedFrom('');
    try {
      const [items, movements] = await Promise.all([
        base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }),
        base44.entities.StockMovement.filter(envFilter(), '-created_date', 500),
      ]);
      const data = buildScanData(items, movements, lookback);
      data.sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3, None: 4 };
        return (order[a.risk] ?? 5) - (order[b.risk] ?? 5);
      });
      setResults(data);
      setTrendData(buildTrendData(movements));
      setSelected(new Set());
      setShowExplanation(false);
      setHighlightedRow(null);
    } catch (e) {
      setImportError(`Scan failed: ${e.message}`);
    }
    setScanning(false);
  };

  useEffect(() => { handleRunScan(); }, []);

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
      {fillTaskRow && (
        <CreateFillTaskModal
          scanRow={fillTaskRow}
          onClose={() => setFillTaskRow(null)}
          onCreated={() => { setFillTaskRow(null); setActiveTab('fill-tasks'); }}
        />
      )}
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-foreground">Gap Scan</h1>
        <Link
          to="/GapScan/floor"
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium"
        >
          <ScanLine size={15} /> Floor Scan Mode
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-5">
        {[
          { key: 'scan', label: 'Gap Scan' },
          { key: 'fill-tasks', label: 'Fill Tasks', icon: ClipboardList },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`h-9 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab.icon && <tab.icon size={13} className="inline mr-1.5 -mt-0.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fill Tasks Tab */}
      {activeTab === 'fill-tasks' && <FillTasksTab />}

      {activeTab === 'scan' && (<>

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
          disabled={scanning}
          className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          <Play size={12} /> {scanning ? 'Scanning…' : 'Run Scan'}
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

      {/* Summary cards */}
      {hasResults && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="border border-border rounded-lg bg-card p-5">
            <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Total processed</p>
            <p className="text-4xl font-bold text-foreground">{results.length}</p>
          </div>
          <div className="border border-red-200 rounded-lg bg-red-50 p-5">
            <p className="text-xs text-red-600 font-semibold uppercase mb-2">Critical</p>
            <p className="text-4xl font-bold text-red-700">{results.filter(r => r.flag === 'Critical').length}</p>
          </div>
          <div className="border border-amber-200 rounded-lg bg-amber-50 p-5">
            <p className="text-xs text-amber-600 font-semibold uppercase mb-2">Watch</p>
            <p className="text-4xl font-bold text-amber-700">{results.filter(r => r.flag === 'Watch').length}</p>
          </div>
          <div className="border border-green-200 rounded-lg bg-green-50 p-5">
            <p className="text-xs text-green-600 font-semibold uppercase mb-2">OK</p>
            <p className="text-4xl font-bold text-green-700">{results.filter(r => r.flag === 'OK').length}</p>
          </div>
        </div>
      )}

      {/* 30-day trend chart */}
      {hasResults && (
        <div className="mb-6 border border-border rounded bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Outbound movements trend (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Line type="monotone" dataKey="missing" stroke="hsl(0, 70%, 50%)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
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
        <>
          {/* Side-by-side comparison view */}
          <div className="mb-6 border border-border rounded bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">System vs. Physical Scan Comparison</h3>
            <div className="grid grid-cols-1 gap-4">
              {results.map((row) => {
                const discrepancy = Math.abs(row.systemStock - row.onHand);
                const discrepancyPercent = row.systemStock > 0 ? Math.round((discrepancy / row.systemStock) * 100) : 0;
                const hasDiscrepancy = discrepancy > 0;
                
                return (
                  <div
                    key={row.sku}
                    className={`rounded-lg border px-4 py-3 transition-colors ${
                      hasDiscrepancy
                        ? 'border-red-200 bg-red-50/30'
                        : 'border-green-200 bg-green-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{row.sku}</p>
                        <p className="font-medium text-foreground">{row.name}</p>
                      </div>
                      {hasDiscrepancy && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          {discrepancyPercent}% variance
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center border-r border-border/20">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">System Stock</p>
                        <p className="text-2xl font-bold text-foreground">{row.systemStock?.toLocaleString() ?? 'N/A'}</p>
                      </div>
                      <div className="text-center border-r border-border/20">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Physical Scan</p>
                        <p className="text-2xl font-bold text-foreground">{row.onHand.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Difference</p>
                        <p className={`text-2xl font-bold ${hasDiscrepancy ? 'text-red-600' : 'text-green-600'}`}>
                          {hasDiscrepancy ? (row.systemStock > row.onHand ? '−' : '+') : ''}
                          {discrepancy.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Original table */}
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
                  {['SKU', 'Item', 'On Hand', 'Avg Use / Day', 'Days Left', 'Suggested Order', 'Risk', 'Flag', ''].map(h => (
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
                    <td className="px-4 py-2.5">
                      <button
                        onClick={e => { e.stopPropagation(); setFillTaskRow(row); }}
                        title="Create fill task"
                        className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground whitespace-nowrap">
                        <PackagePlus size={11} /> Fill Task
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </>)}
    </div>
  );
}