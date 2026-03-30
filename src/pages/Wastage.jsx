import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertTriangle, Filter } from 'lucide-react';

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
  DRAFT: 'bg-muted text-muted-foreground border border-border',
  SUBMITTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  REVERSED: 'bg-slate-100 text-slate-700 border border-slate-200',
};

function KpiCard({ label, value, helper }) {
  return (
    <div className="border border-border rounded bg-card px-4 py-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {helper ? <p className="text-xs text-muted-foreground mt-1">{helper}</p> : null}
    </div>
  );
}

export default function Wastage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [submittedOnly, setSubmittedOnly] = useState(false);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wastageRows.filter((row) => {
      const matchesQuery =
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.itemName.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q);

      const matchesSubmitted = !submittedOnly || row.status === 'SUBMITTED';
      return matchesQuery && matchesSubmitted;
    });
  }, [query, submittedOnly]);

  const kpis = useMemo(() => {
    const pendingApproval = wastageRows.filter((row) => row.status === 'SUBMITTED').length;
    const approvedRows = wastageRows.filter((row) => row.status === 'APPROVED');
    const approvedQty = approvedRows.reduce((sum, row) => sum + row.qty, 0);
    const activeAlerts = wastageRows.filter((row) => row.activeAlert).length;

    return {
      pendingApproval,
      approvedQty,
      approvedEvents: approvedRows.length,
      activeAlerts,
    };
  }, []);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground mb-1">Wastage</h1>
        <p className="text-sm text-muted-foreground">Track, review, and approve stock losses across locations.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by event ID, SKU, item, or location…"
            className="h-8 w-80 border border-border rounded pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>

        <button
          onClick={() => navigate('/Wastage/workspace?mode=create')}
          className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          <Plus size={13} /> Record Wastage
        </button>

        <button
          onClick={() => setSubmittedOnly((prev) => !prev)}
          className={`flex items-center gap-1.5 h-8 px-3 text-sm rounded border transition-colors ${
            submittedOnly
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-border bg-card text-foreground hover:bg-muted'
          }`}
        >
          <Filter size={13} /> Review Submitted
        </button>

        <button
          className="flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
        >
          <AlertTriangle size={13} /> Run Alert Check
        </button>

        <span className="ml-auto text-xs text-muted-foreground">{filteredRows.length} events</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Pending Approval" value={kpis.pendingApproval} helper="Submitted events awaiting review" />
        <KpiCard label="Approved Waste Qty" value={kpis.approvedQty} helper="Approved quantity across current sample" />
        <KpiCard label="Approved Events" value={kpis.approvedEvents} helper="Records already posted to stock" />
        <KpiCard label="Active Alerts" value={kpis.activeAlerts} helper="Threshold breaches requiring attention" />
      </div>

      {filteredRows.length === 0 ? (
        <div className="border border-border rounded bg-card px-6 py-10 text-center">
          <p className="text-base font-medium text-foreground mb-1">No wastage events yet</p>
          <p className="text-sm text-muted-foreground mb-4">Recorded wastage events will appear here once created.</p>
          <button
            onClick={() => navigate('/Wastage/workspace?mode=create')}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Record Wastage
          </button>
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden bg-card">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Wastage Events</span>
            {submittedOnly ? (
              <span className="text-xs text-amber-700 font-medium">Submitted filter active</span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  {['Event ID', 'Occurred At', 'Location', 'SKU', 'Item Name', 'Qty', 'Reason', 'Status', 'Recorded By'].map((heading) => (
                    <th key={heading} className="text-left px-5 py-2.5 font-medium whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/Wastage/workspace?event=${encodeURIComponent(row.id)}`)}
                    className={`border-t border-border cursor-pointer hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-card' : 'bg-background'}`}
                  >
                    <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">{row.id}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{row.occurredAt}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{row.location}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{row.sku}</td>
                    <td className="px-5 py-3 min-w-[220px]">{row.itemName}</td>
                    <td className="px-5 py-3 font-medium whitespace-nowrap">{row.qty}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{row.reason}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{row.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
