import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pencil, Send } from 'lucide-react';

const generateData = (windowDays, coverDays) => [
  { sku: 'CHM-001', name: 'Premium Detergent 20L', supplier: 'ChemSupply Co',        onHand: 4,    demand30: 96,  daily: 3.2, suggested: 20, action: 'Order Now',  reasons: 'Below safety stock, ~1 day left' },
  { sku: 'MNT-001', name: 'Machine Descaler',       supplier: 'ChemSupply Co',        onHand: 3,    demand30: 30,  daily: 1.0, suggested: 10, action: 'Order Now',  reasons: 'Critical level, 3 days remaining' },
  { sku: 'CHM-003', name: 'Bleach 5L',              supplier: 'CleanTex Distributors',onHand: 12,   demand30: 84,  daily: 2.8, suggested: 18, action: 'Review',     reasons: 'Coverage below target' },
  { sku: 'CHM-004', name: 'Stain Remover 2L',       supplier: 'CleanTex Distributors',onHand: 8,    demand30: 45,  daily: 1.5, suggested: 12, action: 'Review',     reasons: 'Trending low, reorder window open' },
  { sku: 'CHM-002', name: 'Fabric Softener 20L',    supplier: 'LaundryChem Direct',   onHand: 18,   demand30: 63,  daily: 2.1, suggested: 8,  action: 'Monitor',    reasons: 'Approaching reorder point' },
  { sku: 'PKG-002', name: 'Garment Tag Roll',        supplier: 'PackPro Solutions',    onHand: 5,    demand30: 12,  daily: 0.4, suggested: 4,  action: 'Monitor',    reasons: 'Moderate usage, within cover range' },
  { sku: 'OPS-001', name: 'Gloves Disposable',       supplier: 'SafetyFirst Supplies', onHand: 340,  demand30: 540, daily: 18,  suggested: 0,  action: 'Hold',       reasons: 'Sufficient stock on hand' },
  { sku: 'PKG-001', name: 'Packaging Bag Large',     supplier: 'PackPro Solutions',    onHand: 900,  demand30: 1260,daily: 42,  suggested: 0,  action: 'Hold',       reasons: 'Well stocked, no action needed' },
].map(row => ({
  ...row,
  coverage: row.daily > 0 ? (row.onHand / row.daily).toFixed(1) : '—',
}));

const actionStyle = {
  'Order Now': 'bg-red-50 text-red-700 border border-red-200',
  'Review':    'bg-amber-50 text-amber-700 border border-amber-200',
  'Monitor':   'bg-blue-50 text-blue-700 border border-blue-200',
  'Hold':      'bg-green-50 text-green-700 border border-green-200',
};

const coverageStyle = (val, target) => {
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  if (n < 5)       return 'text-red-600 font-semibold';
  if (n < target)  return 'text-amber-600 font-medium';
  return 'text-green-700';
};

export default function ReorderReview() {
  const navigate = useNavigate();
  const [windowDays, setWindowDays] = useState(30);
  const [coverDays, setCoverDays]   = useState(14);
  const [selected, setSelected]     = useState(new Set());
  const [data, setData]             = useState(() => generateData(30, 14));

  const toggleRow = (sku) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === data.length ? new Set() : new Set(data.map(r => r.sku)));
  };

  const handleGenerate = () => {
    setData(generateData(windowDays, coverDays));
    setSelected(new Set());
  };

  const handleCreateDraftOrders = () => {
    // Collect all "Order Now" items regardless of selection
    const orderNowItems = data.filter(r => r.action === 'Order Now');

    const lines = orderNowItems.map((row, idx) => ({
      line_id: `line-${idx + 1}`,
      sku: row.sku,
      name: row.name,
      qty: row.suggested,
      supplier: row.supplier,
      source: 'recommendation',
    }));

    const draftOrder = {
      order_id: `DRAFT-${Date.now()}`,
      source: 'reorder_review',
      lines,
    };

    // Debug validation
    if (lines.length !== orderNowItems.length) {
      console.error(
        `[ReorderReview] Line count mismatch: expected ${orderNowItems.length}, got ${lines.length}`,
        { draftOrder }
      );
    } else {
      console.log(`[ReorderReview] Draft order created with ${lines.length} lines:`, draftOrder);
    }

    navigate('/Orders?source=reorder_review');
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground mb-4">Reorder Review</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Window days */}
        <div className="flex items-center gap-2 border border-border rounded bg-card px-3 h-8">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Window</span>
          <select
            value={windowDays}
            onChange={e => setWindowDays(Number(e.target.value))}
            className="text-sm bg-transparent focus:outline-none cursor-pointer"
          >
            {[7, 14, 21, 30, 60].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>

        {/* Target cover days */}
        <div className="flex items-center gap-2 border border-border rounded bg-card px-3 h-8">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Cover target</span>
          <select
            value={coverDays}
            onChange={e => setCoverDays(Number(e.target.value))}
            className="text-sm bg-transparent focus:outline-none cursor-pointer"
          >
            {[7, 10, 14, 21, 30].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          <Play size={12} /> Generate Recommendations
        </button>

        <button
          disabled={selected.size === 0}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Pencil size={13} /> Override Selected {selected.size > 0 && `(${selected.size})`}
        </button>

        <button className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
          <Send size={13} /> Create Draft Orders
        </button>

        <span className="ml-auto text-xs text-muted-foreground">{data.length} items</span>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2.5 w-8">
                <input type="checkbox" checked={selected.size === data.length} onChange={toggleAll} className="cursor-pointer" />
              </th>
              {['SKU', 'Name', 'Supplier', 'On Hand', `Demand ${windowDays}D`, 'Daily', `Coverage (days)`, 'Suggested', 'Action', 'Reasons'].map(h => {
                const isNumeric = ['On Hand', `Demand ${windowDays}D`, 'Daily', 'Coverage (days)', 'Suggested'].includes(h);
                return (
                  <th key={h} className={`px-5 py-2.5 font-semibold whitespace-nowrap text-muted-foreground text-xs uppercase tracking-wide ${isNumeric ? 'text-right' : 'text-left'}`}>{h}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.sku}
                onClick={() => toggleRow(row.sku)}
                className={`border-t border-border cursor-pointer transition-colors ${
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
                <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{row.sku}</td>
                <td className="px-5 py-2.5 font-medium">{row.name}</td>
                <td className="px-5 py-2.5 text-muted-foreground">{row.supplier}</td>
                <td className="px-5 py-2.5 text-right font-mono text-sm">{row.onHand.toLocaleString()}</td>
                <td className="px-5 py-2.5 text-right font-mono text-sm text-muted-foreground">{row.demand30.toLocaleString()}</td>
                <td className="px-5 py-2.5 text-right font-mono text-sm text-muted-foreground">{row.daily}</td>
                <td className={`px-5 py-2.5 text-right font-mono text-sm font-semibold ${coverageStyle(row.coverage, coverDays)}`}>{row.coverage}</td>
                <td className="px-5 py-2.5 text-right font-mono text-sm">{row.suggested > 0 ? row.suggested : '—'}</td>
                <td className="px-5 py-2.5">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (row.action === 'Order Now') {
                        navigate('/Orders?source=reorder_review');
                      }
                    }}
                    disabled={row.action !== 'Order Now'}
                    className={`text-xs px-3 py-1 rounded font-semibold cursor-pointer transition-opacity disabled:cursor-default ${actionStyle[row.action]} ${row.action === 'Order Now' ? 'hover:opacity-80' : ''}`}
                  >
                    {row.action}
                  </button>
                </td>
                <td className="px-5 py-2.5 text-muted-foreground text-xs max-w-xs">{row.reasons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}