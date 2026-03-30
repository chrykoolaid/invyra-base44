import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';

const wastageRows = [
  {
    id: 'WE-2026-001',
    occurredAt: '29 Mar 2026, 09:20',
    recordedAt: '29 Mar 2026, 09:22',
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
    occurredAt: '29 Mar 2026, 08:05',
    recordedAt: '29 Mar 2026, 08:09',
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
    occurredAt: '28 Mar 2026, 17:45',
    recordedAt: '28 Mar 2026, 17:52',
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
    occurredAt: '28 Mar 2026, 15:10',
    recordedAt: '28 Mar 2026, 15:16',
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
    occurredAt: '28 Mar 2026, 11:28',
    recordedAt: '28 Mar 2026, 11:30',
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
    occurredAt: '27 Mar 2026, 18:40',
    recordedAt: '27 Mar 2026, 18:46',
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

const statusStyle = {
  DRAFT:     'bg-muted text-muted-foreground border border-border',
  SUBMITTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED:  'bg-green-50 text-green-700 border border-green-200',
  REJECTED:  'bg-red-50 text-red-600 border border-red-200',
  REVERSED:  'bg-slate-100 text-slate-600 border border-slate-200',
};

const sourceStyle = {
  ADMIN:   'text-slate-500',
  SCANNER: 'text-blue-600',
  POS:     'text-violet-600',
  IMPORT:  'text-orange-600',
};

const ALL_STATUSES = ['All', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED'];

export default function Wastage() {
  const navigate = useNavigate();
  const [query, setQuery]         = useState('');
  const [statusFilter, setStatus] = useState('All');

  const kpis = useMemo(() => {
    const pending  = wastageRows.filter(r => r.status === 'SUBMITTED').length;
    const approved = wastageRows.filter(r => r.status === 'APPROVED');
    const drafts   = wastageRows.filter(r => r.status === 'DRAFT').length;
    return {
      pending,
      approvedQty: approved.reduce((s, r) => s + r.qty, 0),
      approvedCount: approved.length,
      drafts,
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
        row.reason.toLowerCase().includes(q);
      const matchS = statusFilter === 'All' || row.status === statusFilter;
      return matchQ && matchS;
    });
  }, [query, statusFilter]);

  return (
    <div className="p-5 max-w-[1280px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-foreground">Wastage</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Stock loss tracking, approval, and audit log</p>
        </div>
        <button
          onClick={() => navigate('/Wastage/workspace?mode=create')}
          className="flex items-center gap-1.5 h-8 px-3 text-xs bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={13} /> Record Wastage
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {[
          { label: 'Pending Approval', value: kpis.pending,       sub: 'Submitted, awaiting review' },
          { label: 'Drafts',           value: kpis.drafts,        sub: 'Not yet submitted' },
          { label: 'Approved Events',  value: kpis.approvedCount, sub: 'Posted to stock movement' },
          { label: 'Approved Qty',     value: kpis.approvedQty,   sub: 'Total units deducted from stock' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="border border-border rounded bg-card px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search ID, SKU, item, location…"
            className="h-8 w-72 border border-border rounded pl-7 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>
        <div className="flex items-center gap-1.5 border border-border rounded bg-card px-2.5 h-8">
          <Filter size={12} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="text-xs bg-transparent focus:outline-none cursor-pointer pr-1"
          >
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{filteredRows.length} event{filteredRows.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Event ID / SKU', 'Item', 'Location', 'Qty', 'Reason', 'Source', 'Status', 'Occurred At', 'By'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No wastage events found.</td>
              </tr>
            )}
            {filteredRows.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/Wastage/workspace?event=${encodeURIComponent(row.id)}`)}
                className={`border-t border-border cursor-pointer hover:bg-accent/40 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}
              >
                <td className="px-4 py-2.5 align-top">
                  <div className="font-mono text-xs text-muted-foreground">{row.id}</div>
                  <div className="font-mono text-xs font-medium text-foreground mt-0.5">{row.sku}</div>
                </td>
                <td className="px-4 py-2.5 min-w-[200px] align-top">
                  <div className="font-medium text-foreground text-xs">{row.itemName}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap align-top">{row.location}</td>
                <td className="px-4 py-2.5 text-xs font-semibold align-top">{row.qty}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap align-top">{row.reason}</td>
                <td className="px-4 py-2.5 align-top">
                  <span className={`text-[11px] font-semibold ${sourceStyle[row.source]}`}>{row.source}</span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap align-top">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyle[row.status]}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap align-top">{row.occurredAt}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap align-top">{row.recordedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 px-0.5">
        Drafts do not affect stock. Stock is deducted only on Approval. Reversal restores stock through an offset movement.
      </p>
    </div>
  );
}