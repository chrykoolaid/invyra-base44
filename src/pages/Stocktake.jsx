import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter, ENV_LIVE } from '@/lib/envFilter';
import { postInventoryMovement } from '@/lib/inventoryMovement';
import { ClipboardCheck, Search, CheckCircle2, MapPin, CalendarClock, ArrowLeft } from 'lucide-react';
import CycleCountPlanner from '@/components/stocktake/CycleCountPlanner';

const statusStyle = {
  matched:   'bg-green-50 text-green-700 border border-green-200',
  over:      'bg-blue-50 text-blue-700 border border-blue-200',
  short:     'bg-amber-50 text-amber-700 border border-amber-200',
  missing:   'bg-red-50 text-red-500 border border-red-200',
  uncounted: 'bg-muted text-muted-foreground border border-border',
};

function getVarianceStatus(expected, counted) {
  if (counted === null || counted === undefined || counted === '') return 'uncounted';
  const diff = Number(counted) - Number(expected);
  if (diff === 0) return 'matched';
  if (diff > 0) return 'over';
  if (diff < 0) return 'short';
  return 'uncounted';
}

function applyTaskFilter(items, task) {
  if (!task) return items;
  // Explicit SKU list overrides everything
  if ((task.filter_skus || []).length > 0) {
    const skuSet = new Set(task.filter_skus.map(s => s.toUpperCase()));
    return items.filter(i => skuSet.has((i.sku || '').toUpperCase()));
  }
  return items.filter(item => {
    if (task.filter_category && item.product_category !== task.filter_category) return false;
    if (task.filter_min_cost && (item.cost_per_unit || 0) < Number(task.filter_min_cost)) return false;
    if (task.filter_low_stock_only) {
      const rp = item.reorder_point ?? null;
      if (rp === null || (item.stock || 0) > rp) return false;
    }
    return true;
  });
}

export default function Stocktake() {
  const [activeTab, setActiveTab] = useState('stocktake');
  const [activeTask, setActiveTask] = useState(null); // cycle count task driving the current session

  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [counts, setCounts] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOnlyVariances, setShowOnlyVariances] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStocktakeArea, setSelectedStocktakeArea] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 500),
      base44.entities.Location.filter({ ...envFilter(), is_active: true }, 'name', 100),
      base44.entities.StorageArea.filter({ ...envFilter(), is_active: true, stocktake_allowed: true }, 'name', 200),
    ]).then(([rows, locData, areaData]) => {
      setItems(rows || []);
      setLocations(locData || []);
      setStorageAreas(areaData || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load stocktake data', err);
      setLoading(false);
    });
  }, []);

  const handleStartCycleCount = (task) => {
    setActiveTask(task);
    setCounts({});
    setQuery('');
    setShowOnlyVariances(false);
    setActiveTab('stocktake');
  };

  const baseItems = useMemo(() => applyTaskFilter(items, activeTask), [items, activeTask]);

  const filtered = useMemo(() => {
    let list = baseItems.filter(i =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      (i.sku || '').toLowerCase().includes(query.toLowerCase())
    );
    if (showOnlyVariances) {
      list = list.filter(i => {
        const st = getVarianceStatus(i.stock || 0, counts[i.id]);
        return st !== 'uncounted' && st !== 'matched';
      });
    }
    return list;
  }, [baseItems, query, counts, showOnlyVariances]);

  const stats = useMemo(() => {
    const counted = baseItems.filter(i => counts[i.id] !== undefined && counts[i.id] !== '');
    const matched = counted.filter(i => getVarianceStatus(i.stock || 0, counts[i.id]) === 'matched');
    const variances = counted.filter(i => {
      const st = getVarianceStatus(i.stock || 0, counts[i.id]);
      return st === 'short' || st === 'over';
    });
    return { total: baseItems.length, counted: counted.length, matched: matched.length, variances: variances.length };
  }, [baseItems, counts]);

  const handleCount = (id, val) => {
    setCounts(prev => ({ ...prev, [id]: val }));
  };

  const handleCommit = async () => {
    const toUpdate = baseItems.filter(i => counts[i.id] !== undefined && counts[i.id] !== '');
    if (toUpdate.length === 0) return;
    setSubmitting(true);

    const user = await base44.auth.me();
    const taskLabel = activeTask ? `CYCLECOUNT-${activeTask.name.replace(/\s+/g, '_').toUpperCase().slice(0, 20)}-` : 'STKTK-';
    const sourceRef = `${taskLabel}${Date.now().toString(36).toUpperCase()}`;

    try {
      for (const item of toUpdate) {
        const newStock = Number(counts[item.id]);
        const diff = newStock - (item.stock || 0);
        if (diff === 0) continue;
        const direction = diff >= 0 ? 'IN' : 'OUT';

        await postInventoryMovement({
          item,
          movementType: 'STOCKTAKE',
          direction,
          qty: Math.abs(diff),
          sourceType: 'STOCKTAKE',
          sourceRef,
          sourceModule: activeTask ? `Cycle Count: ${activeTask.name}` : 'Stocktake',
          notes: activeTask
            ? `Cycle count [${activeTask.name}]: ${diff >= 0 ? '+' : ''}${diff}`
            : `Stocktake adjustment: ${diff >= 0 ? '+' : ''}${diff}`,
          siteId: item.site_id || '',
          environment: ENV_LIVE,
          user,
        });
      }
    } catch (error) {
      console.error('Stocktake commit failed', error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle2 size={40} className="text-green-500" />
        <h2 className="text-lg font-semibold text-foreground">
          {activeTask ? `Cycle Count Complete` : 'Stocktake Committed'}
        </h2>
        {activeTask && <p className="text-sm text-muted-foreground font-medium">{activeTask.name}</p>}
        <p className="text-sm text-muted-foreground">{Object.keys(counts).filter(k => counts[k] !== '').length} items updated. Ledger movements posted.</p>
        <div className="flex gap-2">
          <button onClick={() => { setSubmitted(false); setCounts({}); setActiveTask(null); }}
            className="h-9 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
            {activeTask ? 'Back to Planner' : 'Start New Stocktake'}
          </button>
          {activeTask && (
            <button onClick={() => { setSubmitted(false); setCounts({}); }}
              className="h-9 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              Run Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ClipboardCheck size={18} className="text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Stocktake</h1>
          </div>
          <p className="text-sm text-muted-foreground">Enter physical counts to reconcile system stock. Variances are posted to the ledger.</p>
        </div>
        {activeTab === 'stocktake' && (
          <button
            onClick={handleCommit}
            disabled={submitting || stats.counted === 0}
            className="flex items-center gap-2 h-9 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed font-medium whitespace-nowrap">
            <CheckCircle2 size={14} /> {submitting ? 'Committing…' : `Commit ${stats.counted} Count${stats.counted !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'stocktake', label: 'Stocktake' },
          { key: 'planner', label: 'Cycle Count Planner' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); if (tab.key === 'stocktake') setActiveTask(null); }}
            className={`h-9 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.key === 'planner' && <CalendarClock size={13} className="inline mr-1.5 -mt-0.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Planner Tab */}
      {activeTab === 'planner' && (
        <CycleCountPlanner onStartCount={handleStartCycleCount} />
      )}

      {/* Stocktake Tab */}
      {activeTab === 'stocktake' && (
        <>
          {/* Active cycle count banner */}
          {activeTask && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-900">Cycle Count: {activeTask.name}</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  {activeTask.frequency} · {
                    (activeTask.filter_skus || []).length > 0
                      ? `${activeTask.filter_skus.length} specific SKUs`
                      : [activeTask.filter_category, activeTask.filter_min_cost && `Cost ≥ ₱${activeTask.filter_min_cost}`, activeTask.filter_low_stock_only && 'Low stock only'].filter(Boolean).join(' · ') || 'All active items'
                  } · {stats.total} item{stats.total !== 1 ? 's' : ''} in scope
                </p>
              </div>
              <button onClick={() => { setActiveTask(null); setCounts({}); }}
                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded border border-blue-300 bg-white text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap">
                <ArrowLeft size={11} /> Full Stocktake
              </button>
            </div>
          )}

          {/* Location Selection */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin size={14} /> Stocktake Location
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Location (optional)</label>
                <select value={selectedLocation} onChange={e => { setSelectedLocation(e.target.value); setSelectedStocktakeArea(''); }}
                  className="w-full h-8 border border-border rounded px-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">All locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.location_code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Storage Area (optional)</label>
                <select value={selectedStocktakeArea} onChange={e => setSelectedStocktakeArea(e.target.value)}
                  disabled={!selectedLocation}
                  className="w-full h-8 border border-border rounded px-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50">
                  <option value="">All areas</option>
                  {storageAreas.filter(sa => sa.location_id === selectedLocation && sa.stocktake_allowed).map(sa => (
                    <option key={sa.id} value={sa.id}>{sa.name} ({sa.storage_area_code})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Items in Scope', value: stats.total, style: 'text-foreground' },
              { label: 'Counted',        value: stats.counted, style: 'text-primary' },
              { label: 'Matched',        value: stats.matched, style: 'text-green-600' },
              { label: 'Variances',      value: stats.variances, style: stats.variances > 0 ? 'text-amber-600' : 'text-muted-foreground' },
            ].map(({ label, value, style }) => (
              <div key={label} className="border border-border rounded bg-card px-4 py-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-2xl font-bold ${style}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or SKU…"
                className="h-8 w-full border border-border rounded pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={showOnlyVariances} onChange={e => setShowOnlyVariances(e.target.checked)}
                className="rounded border-border" />
              Show variances only
            </label>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    {['SKU', 'Item Name', 'System Stock', 'Physical Count', 'Variance', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No items found.</td></tr>
                  )}
                  {filtered.map((item, i) => {
                    const counted = counts[item.id];
                    const status = getVarianceStatus(item.stock || 0, counted);
                    const variance = (counted !== undefined && counted !== '')
                      ? Number(counted) - (item.stock || 0) : null;

                    return (
                      <tr key={item.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.sku || '—'}</td>
                        <td className="px-4 py-2.5 font-medium">{item.name}</td>
                        <td className="px-4 py-2.5 font-mono">{item.stock ?? 0} <span className="text-muted-foreground text-xs">{item.unit}</span></td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min={0}
                            value={counted ?? ''}
                            onChange={e => handleCount(item.id, e.target.value)}
                            placeholder="Enter count"
                            className="w-28 h-8 border border-border rounded px-3 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring text-center"
                          />
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold">
                          {variance !== null ? (
                            <span className={variance > 0 ? 'text-blue-600' : variance < 0 ? 'text-amber-600' : 'text-green-600'}>
                              {variance > 0 ? '+' : ''}{variance}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[status]}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}