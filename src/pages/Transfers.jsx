import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { Plus } from 'lucide-react';
import TransferForm from '@/components/transfers/TransferForm';
import TransferPendingPanel from '@/components/transfers/TransferPendingPanel';
import TransferInTransitPanel from '@/components/transfers/TransferInTransitPanel';
import TransferHistory from '@/components/transfers/TransferHistory';

export default function Transfers() {
  const [sites, setSites] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
  const inTransitDrafts = drafts.filter(d => d.status === 'IN_TRANSIT');

  const handleSubmitted = (data) => {
    setShowForm(false);
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
    loadData();
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div className="p-5 lg:p-6 max-w-[1100px] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Transfers</h1>
          <p className="text-sm text-muted-foreground">
            Move stock between sites with governed approval, in-transit tracking, and receiving confirmation.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium flex-shrink-0"
        >
          <Plus size={14} /> New Transfer
        </button>
      </div>

      {successMsg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${successMsg.includes('discrepanc') ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {successMsg.includes('discrepanc') ? '⚠ ' : '✓ '}{successMsg}
        </div>
      )}

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

      <TransferPendingPanel
        drafts={pendingDrafts}
        canApprove={canApprove}
        onUpdated={loadData}
      />

      <TransferInTransitPanel
        drafts={inTransitDrafts}
        onUpdated={handleReceived}
      />

      <TransferHistory
        drafts={drafts}
        loading={loading}
        onRefresh={loadData}
      />
    </div>
  );
}