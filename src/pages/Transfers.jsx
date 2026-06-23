import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { CheckCircle2, Clock, History, Plus, ShieldCheck, Truck } from 'lucide-react';
import TransferOverviewTab from '@/components/transfers/TransferOverviewTab';
import TransferForm from '@/components/transfers/TransferForm';
import TransferPendingPanel from '@/components/transfers/TransferPendingPanel';
import TransferInTransitPanel from '@/components/transfers/TransferInTransitPanel';
import TransferHistory from '@/components/transfers/TransferHistory';

const TABS = [
  { key: 'overview', label: 'Overview',         icon: ShieldCheck },
  { key: 'active',   label: 'Active Transfers', icon: Clock       },
  { key: 'receiving',label: 'Receiving',        icon: Truck       },
  { key: 'history',  label: 'History',          icon: History     },
];

function PillTab({ active, onClick, label, Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-sm font-medium transition-colors ${
        active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
      <CheckCircle2 size={28} className="mx-auto text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
    </div>
  );
}

export default function Transfers() {
  const [sites, setSites] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canApprove = ['supervisor', 'manager', 'admin', 'owner'].includes((userRole || '').toLowerCase());

  const loadData = async () => {
    setLoading(true);
    const [siteData, itemData, locData, areaData, draftData, user] = await Promise.all([
      base44.entities.Site.filter({ is_active: true }, 'name', 100),
      base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 500),
      base44.entities.Location.filter({ ...envFilter(), is_active: true }, 'name', 100),
      base44.entities.StorageArea.filter({ ...envFilter(), is_active: true }, 'name', 200),
      base44.entities.TransferDraft.filter(envFilter(), '-submitted_at', 200),
      base44.auth.me(),
    ]);
    setSites(siteData || []);
    setItems(itemData || []);
    setLocations(locData || []);
    setStorageAreas(areaData || []);
    setDrafts(draftData || []);
    setUserRole(user?.role || '');
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const pendingDrafts = drafts.filter(d => d.status === 'PENDING_APPROVAL');
  const inTransitDrafts = drafts.filter(d => ['IN_TRANSIT', 'APPROVED'].includes(d.status)); // APPROVED retained only for legacy records
  const activeDrafts = drafts.filter(d => ['PENDING_APPROVAL', 'IN_TRANSIT', 'APPROVED'].includes(d.status));

  const openTransferForm = () => {
    setShowForm(true);
    setActiveTab('active');
  };

  const handleSubmitted = (data) => {
    setShowForm(false);
    setActiveTab(data?.self_approved ? 'receiving' : 'active');
    setSuccessMsg(data?.self_approved
      ? `Transfer ${data.ref} dispatched — stock deducted from source. Awaiting receiving confirmation.`
      : `Transfer ${data.ref} submitted for approval.`
    );
    loadData();
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleReceived = (hasDiscrepancy) => {
    setSuccessMsg(hasDiscrepancy
      ? 'Transfer received with discrepancies. A HIGH alert has been raised in the Exception Center.'
      : 'Transfer fully received. Ledger updated.'
    );
    setActiveTab('history');
    loadData();
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div className="p-5 lg:p-6 max-w-[1280px] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">Transfers</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck size={11} /> Governed Workflow
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-4xl leading-relaxed">
            Move stock between sites with governed approval, in-transit tracking, and receiving confirmation. Locations provides visibility; Transfers performs approved movement workflow.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setActiveTab('active'); }}
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium flex-shrink-0"
        >
          <Plus size={14} /> New Transfer
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(tab => (
          <PillTab
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            label={tab.label}
            Icon={tab.icon}
          />
        ))}
      </div>

      {successMsg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${successMsg.includes('discrepanc') ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {successMsg.includes('discrepanc') ? '⚠ ' : '✓ '}{successMsg}
        </div>
      )}

      {activeTab === 'overview' && (
        <TransferOverviewTab
          drafts={drafts}
          loading={loading}
          onRefresh={loadData}
          onNewTransfer={openTransferForm}
        />
      )}

      {activeTab === 'active' && (
        <div className="space-y-4">
          {showForm && (
            <TransferForm
              sites={sites}
              items={items}
              locations={locations}
              storageAreas={storageAreas}
              userRole={userRole}
              onSubmitted={handleSubmitted}
              onCancel={() => setShowForm(false)}
            />
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Active Transfers</h2>
                <p className="text-xs text-muted-foreground mt-1">Drafts awaiting approval and in-transit transfers are shown here. Legacy APPROVED records are treated as awaiting receiving.</p>
              </div>
              <div className="text-xs text-muted-foreground">
                {activeDrafts.length} active transfer{activeDrafts.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <TransferPendingPanel
            drafts={pendingDrafts}
            canApprove={canApprove}
            onUpdated={loadData}
          />

          <TransferInTransitPanel
            drafts={inTransitDrafts}
            onUpdated={handleReceived}
          />

          {!showForm && activeDrafts.length === 0 && (
            <EmptyState title="No active transfers" message="Create a new transfer when stock needs to move between sites." />
          )}
        </div>
      )}

      {activeTab === 'receiving' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Receiving Confirmation</h2>
            <p className="text-xs text-muted-foreground mt-1">Confirm actual quantities received for in-transit transfers. Discrepancies raise exception alerts through the existing workflow.</p>
          </div>
          <TransferInTransitPanel
            drafts={inTransitDrafts}
            onUpdated={handleReceived}
          />
          {inTransitDrafts.length === 0 && (
            <EmptyState title="No transfers awaiting receiving" message="In-transit transfers will appear here once dispatched." />
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <TransferHistory
          drafts={drafts}
          loading={loading}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
