import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Filter, Plus, Search, ShieldAlert } from 'lucide-react';
import { getReasonPolicy, getWastageRows, statusStyle } from '../lib/wastageData.js';

const statusTabs = [
  { key: 'ALL', label: 'All Events' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'EXCEPTIONS', label: 'Exceptions' },
];

function KpiCard({ label, value, helper, accent = 'text-foreground' }) {
  return (
    <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px] shadow-sm">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">{label}</p>
      <p className={`text-[1.95rem] leading-none font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{helper}</p>
    </div>
  );
}

function StatusTab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3.5 rounded-xl border text-sm font-medium transition-colors ${
        active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

export default function Wastage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const rows = useMemo(() => getWastageRows(), []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.itemName.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q) ||
        row.reason.toLowerCase().includes(q) ||
        row.recordedBy.toLowerCase().includes(q);

      const matchesTab =
        activeTab === 'ALL'
          ? true
          : activeTab === 'EXCEPTIONS'
            ? ['REJECTED', 'REVERSED'].includes(row.status)
            : row.status === activeTab;

      return matchesQuery && matchesTab;
    });
  }, [activeTab, query, rows]);

  const kpis = useMemo(() => {
    const submittedRows = rows.filter((row) => row.status === 'SUBMITTED');
    const approvedRows = rows.filter((row) => row.status === 'APPROVED');
    const reorderAffectingRows = rows.filter((row) => getReasonPolicy(row.reason).effect === 'Reorder affecting');
    const activeAlerts = rows.filter((row) => row.activeAlert).length;

    return {
      pendingApproval: submittedRows.length,
      approvedQty: approvedRows.reduce((sum, row) => sum + Number(row.qty || 0), 0),
      reorderAffecting: reorderAffectingRows.length,
      activeAlerts,
    };
  }, [rows]);

  const submittedCount = rows.filter((row) => row.status === 'SUBMITTED').length;
  const activeAlerts = rows.filter((row) => row.activeAlert).length;

  return (
    <div className="p-5 lg:p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Wastage</h1>
        <p className="text-sm text-muted-foreground">Track stock losses, route approvals, and preserve clear inventory-intelligence treatment for each reason, including scanner-captured events that resolve into SKU-based records.</p>
      </div>

      <div className="border border-border rounded-2xl bg-card px-4 py-3 flex flex-col xl:flex-row xl:items-center gap-3 shadow-sm">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Approval queue and intelligence review</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {submittedCount} submitted event{submittedCount !== 1 ? 's' : ''} awaiting review. {activeAlerts} active alert{activeAlerts !== 1 ? 's' : ''} currently flagged for follow-up. Scanner-originated capture can now be reviewed through the same queue after barcode-to-SKU resolution.
            </p>
          </div>
        </div>
        <div className="xl:ml-auto flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-1.5 h-10 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
            <AlertTriangle size={14} /> Run Alert Check
          </button>
          <button
            onClick={() => navigate('/Wastage/workspace?mode=create')}
            className="flex items-center gap-1.5 h-10 px-4 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-medium"
          >
            <Plus size={14} /> Record Wastage
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Pending Approval" value={kpis.pendingApproval} helper="Submitted records waiting for review" accent="text-amber-700" />
        <KpiCard label="Approved Waste Qty" value={kpis.approvedQty} helper="Quantity already posted to stock" accent="text-green-700" />
        <KpiCard label="Reorder-Affecting Events" value={kpis.reorderAffecting} helper="Events that contribute to planning signals" accent="text-amber-800" />
        <KpiCard label="Active Alerts" value={kpis.activeAlerts} helper="Loss records requiring manager follow-up" accent="text-red-700" />
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
            <div className="relative flex-1 min-w-[240px] max-w-[460px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by ID, SKU, item, location, reason, or staff"
                className="h-10 w-full border border-border rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter size={13} />
              <span>{filteredRows.length} visible event{filteredRows.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => (
              <StatusTab
                key={tab.key}
                label={tab.label}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-base font-medium text-foreground mb-1">No wastage events match this view</p>
            <p className="text-sm text-muted-foreground mb-4">Try another search or reset the status filter to review the full queue.</p>
            <button
              onClick={() => {
                setQuery('');
                setActiveTab('ALL');
              }}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1040px]">
              <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                <tr>
                  {['Event', 'Item', 'Qty', 'Reason & Policy', 'Workflow', 'Recorded By'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => {
                  const policy = getReasonPolicy(row.reason);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/Wastage/workspace?event=${encodeURIComponent(row.id)}`)}
                      className={`border-t border-border cursor-pointer hover:bg-muted/25 transition-colors ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}
                    >
                      <td className="px-4 py-3 align-top whitespace-nowrap min-w-[190px]">
                        <div className="font-medium text-foreground">{row.id}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{row.location}</div>
                        <div className="text-[11px] text-muted-foreground">Occurred {row.occurredAt}</div>
                      </td>

                      <td className="px-4 py-3 align-top min-w-[250px]">
                        <div className="font-medium text-foreground">{row.itemName}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">SKU {row.sku} · On hand {row.currentOnHand}</div>
                        {row.notes ? <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{row.notes}</div> : null}
                      </td>

                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <div className="font-semibold text-foreground">{row.qty}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">units affected</div>
                      </td>

                      <td className="px-4 py-3 align-top min-w-[230px]">
                        <div className="font-medium text-foreground">{row.reason}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${policy.chipClass}`}>
                            {policy.effect}
                          </span>
                          {row.activeAlert ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">Alert</span> : null}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{policy.helper}</div>
                      </td>

                      <td className="px-4 py-3 align-top whitespace-nowrap min-w-[180px]">
                        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>
                          {row.status}
                        </span>
                        <div className="text-[11px] text-muted-foreground mt-1.5">Source {row.source}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          Open workspace <ArrowRight size={12} />
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top whitespace-nowrap min-w-[150px]">
                        <div className="text-foreground font-medium">{row.recordedBy}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Recorded {row.recordedAt}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
