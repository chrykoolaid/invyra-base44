import { useState } from 'react';
import {
  Plus, ArrowUpDown, RotateCcw, Trash2, ArrowLeftRight, RefreshCw, History
} from 'lucide-react';

const initialItems = [
  { sku: 'CHM-001', name: 'Premium Detergent 20L',  onHand: 48,  unitCost: 32.00, price: 45.00, expiry: '2027-06-01', supplier: 'ChemSupply' },
  { sku: 'CHM-002', name: 'Fabric Softener 20L',    onHand: 30,  unitCost: 28.50, price: 39.00, expiry: '2027-04-15', supplier: 'ChemSupply' },
  { sku: 'CHM-003', name: 'Bleach 5L',              onHand: 72,  unitCost: 8.00,  price: 13.00, expiry: '2026-12-01', supplier: 'CleanTex' },
  { sku: 'CHM-004', name: 'Stain Remover 2L',       onHand: 55,  unitCost: 11.00, price: 17.50, expiry: '2026-09-30', supplier: 'CleanTex' },
  { sku: 'PKG-001', name: 'Packaging Bag Large',    onHand: 1200, unitCost: 0.15, price: 0.30,  expiry: '—',          supplier: 'PackPro' },
  { sku: 'PKG-002', name: 'Garment Tag Roll',       onHand: 18,  unitCost: 4.50,  price: 7.00,  expiry: '—',          supplier: 'PackPro' },
  { sku: 'OPS-001', name: 'Gloves Disposable',      onHand: 340, unitCost: 0.08,  price: 0.18,  expiry: '2028-01-01', supplier: 'SafetyFirst' },
  { sku: 'OPS-002', name: 'Hanger Standard',        onHand: 890, unitCost: 0.22,  price: 0.50,  expiry: '—',          supplier: 'HangerCo' },
  { sku: 'MNT-001', name: 'Machine Descaler',       onHand: 14,  unitCost: 19.00, price: 29.00, expiry: '2027-03-01', supplier: 'ChemSupply' },
  { sku: 'OPS-003', name: 'Thermal Receipt Roll',   onHand: 60,  unitCost: 1.80,  price: 3.50,  expiry: '—',          supplier: 'PackPro' },
];

const actions = [
  { label: 'Add / Update Item', icon: Plus },
  { label: 'Adjust Stock (+/-)', icon: ArrowUpDown },
  { label: 'Return / Refund', icon: RotateCcw },
  { label: 'Wastage', icon: Trash2 },
  { label: 'Transfer', icon: ArrowLeftRight },
  { label: 'Reload', icon: RefreshCw },
  { label: 'Stock History', icon: History },
];

export default function Inventory() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  const filtered = initialItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase()) ||
    item.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRow = (sku) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(i => i.sku)));
  };

  return (
    <div className="p-6">
      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground mb-4">Inventory</h1>

      {/* Search row */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setSearch(query)}
          placeholder="Search by SKU, name, or supplier…"
          className="h-8 w-80 border border-border rounded px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
        />
        <button
          onClick={() => setSearch(query)}
          className="h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          Search
        </button>
        <button
          onClick={() => { setQuery(''); setSearch(''); }}
          className="h-8 px-3 text-sm border border-border rounded hover:bg-muted transition-colors text-foreground"
        >
          Clear
        </button>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {actions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
                  <th className="px-4 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              {['SKU', 'Name', 'On Hand', 'Unit Cost', 'Price', 'Expiry', 'Supplier'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr
                key={item.sku}
                onClick={() => toggleRow(item.sku)}
                className={`border-t border-border cursor-pointer transition-colors ${
                  selected.has(item.sku) ? 'bg-primary/5' : i % 2 === 0 ? 'bg-card' : 'bg-background'
                } hover:bg-accent/40`}
              >
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(item.sku)}
                    onChange={() => toggleRow(item.sku)}
                    onClick={e => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                <td className="px-4 py-2.5 font-medium">{item.name}</td>
                <td className="px-4 py-2.5">{item.onHand.toLocaleString()}</td>
                <td className="px-4 py-2.5">${item.unitCost.toFixed(2)}</td>
                <td className="px-4 py-2.5">${item.price.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{item.expiry}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{item.supplier}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-3">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}