import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { Plus } from 'lucide-react';
import AdjustmentForm from '@/components/adjustments/AdjustmentForm';
import PendingApprovalsPanel from '@/components/adjustments/PendingApprovalsPanel';
import AdjustmentHistory from '@/components/adjustments/AdjustmentHistory';

export default function Adjustments() {
  const [items, setItems] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canApprove = ['supervisor', 'manager', 'admin', 'owner'].includes((userRole || '').toLowerCase());

  const loadData = async () => {
    setLoading(true);
    const [itemData, movements, locData, areaData, draftData, user] = await Promise.all([
      base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 500),
      base44.entities.StockMovement.filter({ ...envFilter(), movement_type: 'ADJUST' }, '-created_date', 200),
      base44.entities.Location.filter({ ...envFilter(), is_active: true }, 'name', 100),
      base44.entities.StorageArea.filter({ ...envFilter(), is_active: true }, 'name', 200),
      base44.entities.AdjustmentDraft.filter(envFilter(), '-created_date', 100),
      base44.auth.me(),
    ]);
    setItems(itemData || []);
    setAdjustments((movements || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLocations(locData || []);
    setStorageAreas(areaData || []);
    setDrafts(draftData || []);
    setUserRole(user?.role || '');
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const pendingDrafts = drafts.filter(d => d.status === 'PENDING_APPROVAL');

  const handleSubmitted = ({ selfApproved }) => {
    setShowForm(false);
    setSuccessMsg(selfApproved
      ? 'Adjustment posted to the ledger.'
      : 'Adjustment submitted for approval.'
    );
    loadData();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="p-5 lg:p-6 max-w-[1000px] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Inventory Adjustments</h1>
          <p className="text-sm text-muted-foreground">
            Correct stock levels for non-wastage reasons. Staff submissions require Supervisor or Manager approval before posting.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium flex-shrink-0"
        >
          <Plus size={14} /> New Adjustment
        </button>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-medium">
          ✓ {successMsg}
        </div>
      )}

      {showForm && (
        <AdjustmentForm
          items={items}
          locations={locations}
          storageAreas={storageAreas}
          userRole={userRole}
          onSubmitted={handleSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}

      {pendingDrafts.length > 0 && (
        <PendingApprovalsPanel
          drafts={pendingDrafts}
          locations={locations}
          canApprove={canApprove}
          onUpdated={loadData}
        />
      )}

      <AdjustmentHistory
        adjustments={adjustments}
        drafts={drafts}
        locations={locations}
        loading={loading}
        onRefresh={loadData}
      />
    </div>
  );
}