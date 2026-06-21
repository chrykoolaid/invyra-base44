import { useState } from 'react';
import { AlertTriangle, Layers, ScanLine, ShieldCheck } from 'lucide-react';
import ExpiryOverviewTab from '@/components/expiry/ExpiryOverviewTab';
import BarcodeLookupTab from '@/components/expiry/BarcodeLookupTab';
import BatchRegisterTab from '@/components/expiry/BatchRegisterTab';
import NearExpiryTab from '@/components/expiry/NearExpiryTab';

const TABS = [
  { key: 'overview', label: 'Overview',             icon: ShieldCheck   },
  { key: 'lookup',   label: 'Barcode Lookup',       icon: ScanLine      },
  { key: 'batches',  label: 'Batch & Lot Register', icon: Layers        },
  { key: 'expiry',   label: 'Near-Expiry Alerts',   icon: AlertTriangle },
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

export default function ExpiryTracking() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-5 lg:p-6 space-y-5 max-w-[1280px]">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Expiry & Barcode Tracking</h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck size={11} /> Tracking Only
          </span>
        </div>
        <p className="text-sm text-muted-foreground max-w-4xl leading-relaxed">
          Track expiry dates, barcodes, batches, and lots. Identifies near-expiry stock for Markdown and Wastage action — does not perform pricing, write-offs, or stock adjustments.
        </p>
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

      {activeTab === 'overview' && <ExpiryOverviewTab onSelectTab={setActiveTab} />}
      {activeTab === 'lookup'   && <BarcodeLookupTab />}
      {activeTab === 'batches'  && <BatchRegisterTab />}
      {activeTab === 'expiry'   && <NearExpiryTab />}
    </div>
  );
}
