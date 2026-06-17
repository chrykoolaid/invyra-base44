import { useMemo } from 'react';
import ItemDetailsForecastPanel from '@/components/ItemDetailsForecastPanel';
import { Package, ShieldCheck } from 'lucide-react';

const localDevItem = {
  id: 'LOCAL-DEV-FORECAST-ITEM-001',
  sku: 'CHM-LIVE-002',
  name: 'Phase 2M Forecast Verification Item',
  stock: 18,
  unit: 'unit',
  cost_per_unit: 12.5,
  preferred_supplier: 'Local Dev Supplier',
  reorder_point: 6,
  reorder_qty: 12,
  is_active: true,
  environment: 'LIVE',
  site_id: 'LOCAL-DEV-BRANCH',
  updated_date: new Date().toISOString(),
};

function buildLocalDevMovements(item) {
  const now = new Date();
  const isoDaysAgo = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  return [
    {
      id: 'LOCAL-DEV-MOV-001',
      item_id: item.id,
      sku: item.sku,
      item_name: item.name,
      movement_type: 'SALE',
      direction: 'OUT',
      qty: 3,
      environment: 'LIVE',
      created_date: isoDaysAgo(2),
      updated_date: isoDaysAgo(2),
    },
    {
      id: 'LOCAL-DEV-MOV-002',
      item_id: item.id,
      sku: item.sku,
      item_name: item.name,
      movement_type: 'SALE',
      direction: 'OUT',
      qty: 4,
      environment: 'LIVE',
      created_date: isoDaysAgo(8),
      updated_date: isoDaysAgo(8),
    },
    {
      id: 'LOCAL-DEV-MOV-003',
      item_id: item.id,
      sku: item.sku,
      item_name: item.name,
      movement_type: 'SALE',
      direction: 'OUT',
      qty: 2,
      environment: 'LIVE',
      created_date: isoDaysAgo(15),
      updated_date: isoDaysAgo(15),
    },
    {
      id: 'LOCAL-DEV-MOV-004',
      item_id: item.id,
      sku: item.sku,
      item_name: item.name,
      movement_type: 'RECEIVE',
      direction: 'IN',
      qty: 12,
      environment: 'LIVE',
      created_date: isoDaysAgo(21),
      updated_date: isoDaysAgo(21),
    },
  ];
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '—';
  return `₱${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default function LocalForecastVerification() {
  const isDevOnly = import.meta.env.DEV === true;
  const localDevRoleOverride = import.meta.env.VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE;
  const movements = useMemo(() => buildLocalDevMovements(localDevItem), []);

  if (!isDevOnly) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Local forecast verification is only available in Vite development mode.
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 w-full max-w-none space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">Local Forecast Verification</h1>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Dev only
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Browser-only verification harness for Phase 2M/2N when local Base44 entity loading is unavailable.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 max-w-md">
          <p className="text-xs text-muted-foreground">
            This page does not create stock, adjust inventory, create purchase orders, or approve purchase orders. It only verifies the read-only forecast panel against the local forecasting API.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground truncate">SKU</p>
            <Package size={14} className="text-muted-foreground shrink-0" />
          </div>
          <p className="text-xl font-semibold text-foreground leading-tight truncate">{localDevItem.sku}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{localDevItem.name}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground truncate mb-2">On Hand</p>
          <p className="text-xl font-semibold text-foreground leading-tight truncate">{localDevItem.stock}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{localDevItem.unit}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground truncate mb-2">Movements</p>
          <p className="text-xl font-semibold text-foreground leading-tight truncate">{movements.length}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">local dev evidence rows</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground truncate">Role Override</p>
            <ShieldCheck size={14} className="text-muted-foreground shrink-0" />
          </div>
          <p className="text-xl font-semibold text-foreground leading-tight truncate">{localDevRoleOverride || 'Not set'}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">local dev only</p>
        </div>
      </div>

      <ItemDetailsForecastPanel item={localDevItem} movements={movements} loadingMovements={false} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Item Summary</h2>
          <InfoRow label="SKU" value={localDevItem.sku} />
          <InfoRow label="Unit" value={localDevItem.unit} />
          <InfoRow label="Unit Price" value={formatCurrency(localDevItem.cost_per_unit)} />
          <InfoRow label="Supplier" value={localDevItem.preferred_supplier} />
          <InfoRow label="Reorder Point" value={`${localDevItem.reorder_point} ${localDevItem.unit}`} />
          <InfoRow label="Reorder Qty" value={`${localDevItem.reorder_qty} ${localDevItem.unit}`} />
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Safety Lock</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Advisory only.</p>
            <p>Ledger remains source of truth.</p>
            <p>No stock mutation action.</p>
            <p>No purchase order creation or approval action.</p>
            <p>Hosted Base44 and production permissions are unchanged.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
