import { useState } from 'react';
import { AlertTriangle, Bell, ShieldAlert } from 'lucide-react';
import InventoryExceptionsTab from '@/components/exceptions/InventoryExceptionsTab';
import StockOutAlertTab from '@/components/exceptions/StockOutAlertTab';

const TABS = [
  {
    key: 'inventory',
    label: 'Inventory Exceptions',
    icon: AlertTriangle,
    description: 'Negative stock, below reorder point, receiving discrepancies, and data quality flags.',
  },
  {
    key: 'alerts',
    label: 'Stock-Out Alert Queue',
    icon: Bell,
    description: 'Wastage alerts, barcode issues, amendment flags — with full lifecycle management.',
  },
];

export default function Exceptions() {
  const [activeTab, setActiveTab] = useState('inventory');

  const active = TABS.find(t => t.key === activeTab);
  const ActiveIcon = active.icon;

  return (
    <div className="p-5 lg:p-6 max-w-[960px] space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 mt-0.5">
          <ShieldAlert size={18} className="text-red-600" strokeWidth={1.9} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Exception & Alert Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unified triage surface for inventory exceptions and stock-out alert lifecycle management.
          </p>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active tab description */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <ActiveIcon size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{active.description}</p>
      </div>

      {/* Tab Content */}
      {activeTab === 'inventory' && <InventoryExceptionsTab />}
      {activeTab === 'alerts' && <StockOutAlertTab />}
    </div>
  );
}