import { useState } from 'react';
import OverviewTab from '@/components/locations/OverviewTab';
import StockLookupTab from '@/components/locations/StockLookupTab';
import BranchStockTab from '@/components/locations/BranchStockTab';
import LocationManagementTab from '@/components/locations/LocationManagementTab';
import StorageAreasTab from '@/components/locations/StorageAreasTab';
import { MapPin, ShieldCheck } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'lookup', label: 'Stock Lookup' },
  { key: 'branches', label: 'Branch Stock View' },
  { key: 'locations', label: 'Manage Locations' },
  { key: 'storage', label: 'Storage Areas' },
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
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-5 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-muted-foreground" />
            <h1 className="text-xl font-semibold text-foreground">Locations</h1>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-border bg-card text-muted-foreground font-semibold uppercase tracking-wide">
              <ShieldCheck size={10} /> Read-only visibility
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-4xl">
            Multi-location stock visibility for branches and storage areas. Stock changes must be made through Adjustments, Transfers, Receiving, Wastage, or other approved inventory workflows.
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

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'lookup' && <StockLookupTab />}
      {activeTab === 'branches' && <BranchStockTab />}
      {activeTab === 'locations' && <LocationManagementTab />}
      {activeTab === 'storage' && <StorageAreasTab />}
    </div>
  );
}
