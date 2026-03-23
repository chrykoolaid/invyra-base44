import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

const receivingRows = [
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         item: 'Premium Detergent 20L', expected: 20,  received: 0,   unit: 'drum',   status: 'Awaiting'  },
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         item: 'Machine Descaler',       expected: 10,  received: 0,   unit: 'bottle', status: 'Awaiting'  },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', item: 'Bleach 5L',              expected: 18,  received: 18,  unit: 'bottle', status: 'Completed' },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', item: 'Stain Remover 2L',       expected: 12,  received: 8,   unit: 'bottle', status: 'Partial'   },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     item: 'Packaging Bag Large',    expected: 500, received: 500, unit: 'pack',   status: 'Completed' },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     item: 'Garment Tag Roll',        expected: 10,  received: 4,   unit: 'roll',   status: 'Partial'   },
  { po: 'PO-2026-004', supplier: 'LaundryChem Direct',    item: 'Fabric Softener 20L',    expected: 8,   received: 8,   unit: 'drum',   status: 'Completed' },
  { po: 'PO-2026-005', supplier: 'SafetyFirst Supplies',  item: 'Gloves Disposable',       expected: 200, received: 0,   unit: 'pcs',    status: 'Awaiting'  },
];

const statusStyle = {
  Awaiting:       'bg-muted text-muted-foreground border border-border',
  Partial:        'bg-amber-50 text-amber-700 border border-amber-200',
  Completed:      'bg-green-50 text-green-700 border border-green-200',
  'Over-received':'bg-purple-50 text-purple-700 border border-purple-200',
};

export default function ReceivingWorkspace() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const po = params.get('po');

  const baseItems = receivingRows.filter(r => r.po === po);
  const supplier = baseItems[0]?.supplier ?? '—';

  const [received, setReceived] = useState(
    Object.fromEntries(baseItems.map(r => [r.item, r.received]))
  );

  const items = baseItems.map(r => ({ ...r, received: received[r.item] }));
  const totalExpected = items.reduce((s, r) => s + r.expected, 0);
  const totalReceived = items.reduce((s, r) => s + r.received, 0);

  const setQty = (item, val) => {
    const n = Math.max(0, Number(val));
    if (!isNaN(n)) setReceived(prev => ({ ...prev, [item]: n }));
  };

  const itemStatus = (row) => {
    if (row.received === 0)              return 'Awaiting';
    if (row.received < row.expected)     return 'Partial';
    if (row.received === row.expected)   return 'Completed';
    return 'Over-received';
  };

  const overallStatus = () => {
    const statuses = items.map(i => itemStatus(i));
    if (statuses.some(s => s === 'Over-received'))          return 'Over-received';
    if (statuses.every(s => s === 'Completed'))             return 'Completed';
    if (statuses.every(s => s === 'Awaiting'))              return 'Awaiting';
    return 'Partial';
  };

  if (!po || items.length === 0) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/Receiving')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={14} /> Back to Receiving
        </button>
        <p className="text-sm text-muted-foreground">Purchase order not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[900px]">

      {/* Back */}
      <button
        onClick={() => navigate('/Receiving')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Receiving
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-lg font-semibold text-foreground">{po}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[overallStatus()]}`}>
            {overallStatus()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{supplier}</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-border rounded bg-card px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Lines</p>
          <p className="text-xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="border border-border rounded bg-card px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Expected</p>
          <p className="text-xl font-bold text-foreground">{totalExpected.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded bg-card px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Received</p>
          <p className={`text-xl font-bold ${totalReceived === 0 ? 'text-muted-foreground' : totalReceived > totalExpected ? 'text-purple-700' : totalReceived < totalExpected ? 'text-amber-600' : 'text-green-700'}`}>
            {totalReceived.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Items table */}
      <div className="border border-border rounded overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Line Items</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Item', 'Expected', 'Received', 'Unit', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => {
            const status = itemStatus(row);
            return (
              <tr key={row.item} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                <td className="px-5 py-3 font-medium">{row.item}</td>
                <td className="px-5 py-3 text-muted-foreground">{row.expected}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQty(row.item, row.received - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-border bg-muted hover:bg-accent transition-colors text-foreground"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={row.expected}
                      value={row.received}
                      onChange={e => setQty(row.item, e.target.value)}
                        className="w-14 h-7 text-center text-sm border border-border rounded bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    <button
                      onClick={() => setQty(row.item, row.received + 1, row.expected)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-border bg-muted hover:bg-accent transition-colors text-foreground"
                    >
                      <Plus size={12} />
                    </button>
                    <span className="text-xs text-muted-foreground ml-1">/ {row.expected} {row.unit}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{row.unit}</td>
                <td className="px-5 py-3">
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

      <p className="text-xs text-muted-foreground mt-4 px-1">Editable receiving inputs will be connected in a future phase.</p>
    </div>
  );
}