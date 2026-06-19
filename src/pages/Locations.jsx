import { useState } from 'react';
import StockLookupTab from '@/components/locations/StockLookupTab';
import BranchStockTab from '@/components/locations/BranchStockTab';
import LocationManagementTab from '@/components/locations/LocationManagementTab';
import { MapPin } from 'lucide-react';

const TABS = [
  { key: 'lookup', label: 'Stock Lookup' },
  { key: 'branches', label: 'Branch Stock View' },
  { key: 'locations', label: 'Manage Locations' },
];

function PillTab({ active, onClick, label }) {
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

export default function Locations() {
  const [activeTab, setActiveTab] = useState('lookup');

  return (
    <div className="p-5 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-muted-foreground" />
            <h1 className="text-xl font-semibold text-foreground">Locations</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Branch and storage area management. Search stock by item across locations. Stock changes must be made through Adjustments, Transfers, Receiving, or Wastage.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <PillTab
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      {activeTab === 'lookup' && <StockLookupTab />}
      {activeTab === 'branches' && <BranchStockTab />}
      {activeTab === 'locations' && <LocationManagementTab />}
    </div>
  );
}