import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight } from 'lucide-react';

const wastageRows = [
  {
    id: 'WE-2026-001',
    occurredAt: '29 Mar 09:20',
    recordedAt: '29 Mar 09:22',
    location: 'Main Store',
    sku: 'CHM-001',
    itemName: 'Premium Detergent 20L',
    qty: 2,
    reason: 'Spill',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'A. Manager',
    notes: 'Leaked during transfer.',
    currentOnHand: 18,
    activeAlert: true,
  },
  {
    id: 'WE-2026-002',
    occurredAt: '29 Mar 08:05',
    recordedAt: '29 Mar 08:09',
    location: 'Main Store',
    sku: 'PKG-003',
    itemName: 'Garment Tag Roll',
    qty: 1,
    reason: 'Damaged',
    source: 'ADMIN',
    status: 'APPROVED',
    recordedBy: 'S. Cruz',
    notes: 'Outer wrap torn during unloading.',
    currentOnHand: 57,
    activeAlert: false,
  },
  {
    id: 'WE-2026-003',
    occurredAt: '28 Mar 17:45',
    recordedAt: '28 Mar 17:52',
    location: 'Branch A',
    sku: 'CHM-005',
    itemName: 'Bleach 5L',
    qty: 4,
    reason: 'Expired',
    source: 'IMPORT',
    status: 'DRAFT',
    recordedBy: 'R. Santos',
    notes: 'Pending supervisor review.',
    currentOnHand: 24,
    activeAlert: true,
  },
  {
    id: 'WE-2026-004',
    occurredAt: '28 Mar 15:10',
    recordedAt: '28 Mar 15:16',
    location: 'Main Store',
    sku: 'SAFE-021',
    itemName: 'Disposable Gloves',
    qty: 12,
    reason: 'Production Use',
    source: 'POS',
    status: 'REVERSED',
    recordedBy: 'M. Lopez',
    notes: 'Reversed after duplicate count.',
    currentOnHand: 320,
    activeAlert: false,
  },
  {
    id: 'WE-2026-005',
    occurredAt: '28 Mar 11:28',
    recordedAt: '28 Mar 11:30',
    location: 'Branch A',
    sku: 'CHEM-009',
    itemName: 'Stain Remover 2L',
    qty: 3,
    reason: 'Damage in Handling',
    source: 'SCANNER',
    status: 'REJECTED',
    recordedBy: 'L. David',
    notes: 'Rejected due to incorrect SKU selection.',
    currentOnHand: 41,
    activeAlert: false,
  },
  {
    id: 'WE-2026-006',
    occurredAt: '27 Mar 18:40',
    recordedAt: '27 Mar 18:46',
    location: 'Main Store',
    sku: 'PKG-011',
    itemName: 'Laundry Bag Large',
    qty: 22,
    reason: 'Sampling/Promos',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'J. Reyes',
    notes: 'Promo bundle drawdown awaiting approval.',
    currentOnHand: 260,
    activeAlert: true,
  },
];

// Status chip — intent-first, calm palette
const statusChip = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  SUBMITTED: { label: 'Submitted', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  APPROVED:  { label: 'Approved',  cls: 'bg-green-50 text-green-700 border border-green-200' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-500 border border-red-200' },
  REVERSED:  { label: 'Reversed',  cls: 'bg-slate-100 text-slate-500 border border-slate-200 line-through' },
};

// Which statuses affect stock (for row-level visual cue)
const stockImpactStatus = new Set(['APPROVED', 'REVERSED']);
const pendingStatus     = new Set(['SUBMITTED']);
const inactiveStatus    = new Set(['REJECTED', 'REVERSED', 'DRAFT']);

const ALL_FILTERS = [
  { key: 'All',       label: 'All' },
  { key: 'SUBMITTED', label: 'Pending review' },
  { key: 'DRAFT',     label: 'Drafts' },
  { key: 'APPROVED',  label: 'Approved' },
  { key: 'REJECTED',  label: 'Rejected' },
  { key: 'REVERSED',  label: 'Reversed' },
];

export default function Wastage() {
  const navigate = useNavigate();
  const [query, setQuery]         = useState('');
  const [activeFilter, setFilter] = useState('All');

  const kpis = useMemo(() => {
    const submitted = wastageRows.filter(r => r.status === 'SUBMITTED');
    const approved  = wastageRows.filter(r => r.status === 'APPROVED');
    const alerts    = wastageRows.filter(r => r.activeAlert);
    return {
      pending:      submitted.length,
      approvedQty:  approved.reduce((s, r) => s + r.qty, 0),
      approvedCount: approved.length,
      alerts:       alerts.length,
    };
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wastageRows.filter(row => {
      const matchQ = !q ||
        row.id.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.itemName.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q) ||
        row.reason.toLowerCase().includes(q) ||
        row.recordedBy.toLowerCase().includes(q);
      const matchF = activeFilter === 'All' || row.status === activeFilter;
      return matchQ && matchF;
    });
  }, [query, activeFilter]);

  return (
    <div className="p-5 max-w-[1260px]">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Wastage</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Append-only stock loss ledger · review, approve, and audit</p>
        </div>
        <button
          onClick={() => navigate('/Wastage/workspace?mode=create')}
          className="flex items-center gap-1.5 h-7 px-3 text-xs bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={12} /> Record Wastage
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Pending Approval', value: kpis.pending,       note: 'Submitted, awaiting review',     highlight: kpis.pending > 0 },
          { label: 'Approved Events',  value: kpis.approvedCount, note: 'Posted to stock movement',       highlight: false },
          { label: 'Approved Qty',     value: kpis.approvedQty,   note: 'Units deducted from stock',      highlight: false },
          { label: 'Active Alerts',    value: kpis.alerts,        note: 'Threshold breaches flagged',     highlight: kpis.alerts > 0 },
        ].map(({ label, value, note, highlight }) => (
          <div key={label} className={`border rounded px-3 py-2 flex items-center gap-4 ${highlight ? 'border-amber-200 bg-amber-50/50' : 'border-border bg-card'}`}>
            <div>
              <p className={`text-xl font-bold leading-none ${highlight ? 'text-amber-700' : 'text-foreground'}`}>{value}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight ml-auto text-right max-w-[90px]">{note}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search ID, SKU, item, location, person…"
            className="h-7 w-80 border border-border rounded pl-7 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring bg-card placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0.5">
          {ALL_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`h-7 px-3 text-xs rounded transition-colors font-medium ${
                activeFilter === f.key
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filteredRows.length} event{filteredRows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Ledger table ── */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border">
            <tr>
              <th className="text-left px-3.5 py-2 font-semibold w-[130px]">Reference</th>
              <th className="text-left px-3.5 py-2 font-semibold w-[110px]">SKU</th>
              <th className="text-left px-3.5 py-2 font-semibold">Item</th>
              <th className="text-right px-3.5 py-2 font-semibold w-14">Qty</th>
              <th className="text-left px-3.5 py-2 font-semibold w-[140px]">Reason</th>
              <th className="text-left px-3.5 py-2 font-semibold w-[110px]">Status</th>
              <th className="text-left px-3.5 py-2 font-semibold w-[110px]">Location</th>
              <th className="text-left px-3.5 py-2 font-semibold w-[100px]">By</th>
              <th className="text-left px-3.5 py-2 font-semibold w-[110px]">Occurred</th>
              <th className="w-6 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  No wastage events match this filter.
                </td>
              </tr>
            )}
            {filteredRows.map((row, i) => {
              const chip     = statusChip[row.status];
              const isPending = pendingStatus.has(row.status);
              const isStock   = stockImpactStatus.has(row.status);
              const isInactive = inactiveStatus.has(row.status);

              return (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/Wastage/workspace?event=${encodeURIComponent(row.id)}`)}
                  className={`border-t border-border cursor-pointer transition-colors group
                    ${i % 2 === 0 ? 'bg-card' : 'bg-background'}
                    hover:bg-primary/5
                    ${isPending ? 'border-l-2 border-l-amber-300' : ''}
                  `}
                >
                  {/* Reference */}
                  <td className="px-3.5 py-2.5 align-middle">
                    <span className="font-mono text-[11px] font-medium text-foreground">{row.id}</span>
                  </td>

                  {/* SKU */}
                  <td className="px-3.5 py-2.5 align-middle">
                    <span className={`font-mono text-[11px] ${isInactive ? 'text-muted-foreground' : 'text-foreground'}`}>{row.sku}</span>
                  </td>

                  {/* Item name */}
                  <td className="px-3.5 py-2.5 align-middle">
                    <span className={`font-medium ${isInactive ? 'text-muted-foreground' : 'text-foreground'}`}>{row.itemName}</span>
                  </td>

                  {/* Qty */}
                  <td className="px-3.5 py-2.5 align-middle text-right">
                    <span className={`font-semibold tabular-nums ${
                      row.status === 'APPROVED' ? 'text-red-600' :
                      row.status === 'REVERSED' ? 'text-slate-400 line-through' :
                      isInactive ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {row.status === 'APPROVED' ? `–${row.qty}` : row.qty}
                    </span>
                  </td>

                  {/* Reason */}
                  <td className="px-3.5 py-2.5 align-middle text-muted-foreground whitespace-nowrap">{row.reason}</td>

                  {/* Status */}
                  <td className="px-3.5 py-2.5 align-middle">
                    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${chip.cls}`}>
                      {chip.label}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-3.5 py-2.5 align-middle text-muted-foreground whitespace-nowrap">{row.location}</td>

                  {/* Recorded by */}
                  <td className="px-3.5 py-2.5 align-middle text-muted-foreground whitespace-nowrap">{row.recordedBy}</td>

                  {/* Occurred timing */}
                  <td className="px-3.5 py-2.5 align-middle text-muted-foreground whitespace-nowrap">{row.occurredAt}</td>

                  {/* Row chevron */}
                  <td className="px-2 py-2.5 align-middle text-right">
                    <ChevronRight size={12} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground mt-2.5 px-0.5 leading-relaxed">
        Drafts and rejected events do not affect stock.
        Approved events post a stock deduction. Reversed events post an offset movement restoring stock.
      </p>
    </div>
  );
}