import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RecordStockOutModal from '@/components/wastage/RecordStockOutModal';
import WastageTab from '@/components/wastage/WastageTab';
import StoreUseTab from '@/components/wastage/StoreUseTab';
import ScannerIntakeTab from '@/components/wastage/ScannerIntakeTab';
import AmendmentsTab from '@/components/wastage/AmendmentsTab';
import AlertsTab from '@/components/wastage/AlertsTab';
import ReportsTab from '@/components/wastage/ReportsTab';

const mainTabs = [
  { key: 'WASTAGE', label: 'Wastage' },
  { key: 'STORE_USE', label: 'Store Use' },
  { key: 'SCANNER_INTAKE', label: 'Scanner Intake' },
  { key: 'AMENDMENTS', label: 'Amendments' },
  { key: 'ALERTS', label: 'Alerts' },
  { key: 'REPORTS', label: 'Reports' },
];

function PillTab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3.5 rounded-xl border text-sm font-medium transition-colors ${
        active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

export default function Wastage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (() => {
    const tab = searchParams.get('tab');
    return mainTabs.some((t) => t.key === tab) ? tab : 'WASTAGE';
  })();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);




  const updateTab = (tabKey) => {
    setActiveTab(tabKey);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tabKey);
    setSearchParams(nextParams);
  };





  return (
    <div className="p-5 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Stock-Out Exceptions</h1>
          <p className="text-sm text-muted-foreground">Record, review, and track wastage and store use inventory exceptions.</p>
        </div>
        <button
          onClick={() => setShowRecordModal(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium whitespace-nowrap"
        >
          <Plus size={14} /> Record Stock-Out
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mainTabs.map((tab) => (
          <PillTab key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => updateTab(tab.key)} />
        ))}
      </div>

      {showRecordModal && (
        <RecordStockOutModal
          onClose={() => setShowRecordModal(false)}
          onSuccess={() => {
            setShowRecordModal(false);
            setRefreshTick(t => t + 1);
          }}
        />
      )}

      {activeTab === 'WASTAGE' && <WastageTab refreshTick={refreshTick} />}
      {activeTab === 'STORE_USE' && <StoreUseTab refreshTick={refreshTick} />}
      {activeTab === 'SCANNER_INTAKE' && <ScannerIntakeTab refreshTick={refreshTick} />}
      {activeTab === 'AMENDMENTS' && <AmendmentsTab refreshTick={refreshTick} />}
      {activeTab === 'ALERTS' && <AlertsTab refreshTick={refreshTick} />}
      {activeTab === 'REPORTS' && <ReportsTab refreshTick={refreshTick} />}
    </div>
  );
}