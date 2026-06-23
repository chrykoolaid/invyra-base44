import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ItemDetailsForecastPanel from '@/components/ItemDetailsForecastPanel';
import WasteInsightWidget from '@/components/item/WasteInsightWidget';
import { envFilter } from '@/lib/envFilter';
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  Lock,
  Package,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Tags,
  TrendingUp,
} from 'lucide-react';
import ItemGovernanceEditModal from '@/components/item/ItemGovernanceEditModal';
import { canManageGovernance } from '@/lib/rolePermissions';
import {
  getLocalDevStockMovements,
  isLocalDevInventoryFallbackEnabled,
  localDevInventoryFallbackNotice,
  withLocalDevTimeout,
} from '@/lib/localDevInventoryFallback';

const TYPE_LABELS = {
  RECEIVE: 'Stock In',
  WASTE: 'Wastage',
  REVERSAL: 'Reversal',
  ADJUST: 'Adjustment',
  SALE: 'Stock Out',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
  STOCKTAKE: 'Stocktake',
};

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '—';
  return `₱${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateOnly(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}


function firstPresent(...values) {
  return values.find(value => value !== null && value !== undefined && value !== '');
}

function formatPlain(value) {
  const present = firstPresent(value);
  if (present === undefined) return '—';
  if (typeof present === 'boolean') return present ? 'Yes' : 'No';
  return String(present);
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function ruleChipTone(value) {
  if (value === true) return 'bg-green-50 text-green-700 border-green-200';
  if (value === false) return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function flagLabel(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Not configured';
}

function getItemBarcodeFields(item) {
  const candidates = [
    { barcode: item?.barcode, barcode_type: item?.barcode_type || 'INVENTORY_FIELD', is_primary: true, is_active: true, notes: 'Stored on inventory item record' },
    { barcode: item?.primary_barcode, barcode_type: item?.primary_barcode_type || 'INVENTORY_FIELD', is_primary: true, is_active: true, notes: 'Primary barcode field on inventory item' },
    { barcode: item?.item_barcode, barcode_type: item?.item_barcode_type || 'INVENTORY_FIELD', is_primary: true, is_active: true, notes: 'Item barcode field on inventory item' },
    { barcode: item?.ean, barcode_type: 'EAN13', is_primary: true, is_active: true, notes: 'EAN field on inventory item' },
  ];
  return candidates.filter(candidate => hasValue(candidate.barcode));
}

function uniqueByBarcode(rows) {
  const seen = new Set();
  return (rows || []).filter(row => {
    const key = String(row?.barcode || row?.id || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deriveGovernance(item) {
  const supplierName = firstPresent(item?.preferred_supplier, item?.supplier_name, item?.supplier);
  const supplierItemCode = firstPresent(item?.supplier_item_code, item?.preferred_supplier_item_code, item?.supplier_sku);
  const supplierPackSize = firstPresent(item?.supplier_pack_size, item?.preferred_supplier_pack_size);
  const supplierUom = firstPresent(item?.supplier_uom, item?.preferred_supplier_uom);

  const ruleFlags = [
    { label: 'POS sellable', value: firstPresent(item?.pos_sellable, item?.is_pos_sellable) },
    { label: 'Reorder eligible', value: firstPresent(item?.reorder_eligible, item?.is_reorder_eligible) },
    { label: 'Expiry tracking required', value: firstPresent(item?.expiry_tracking_required, item?.requires_expiry_tracking) },
    { label: 'Batch tracking required', value: firstPresent(item?.batch_tracking_required, item?.requires_batch_tracking) },
    { label: 'Markdown eligible', value: firstPresent(item?.markdown_eligible, item?.is_markdown_eligible) },
    { label: 'Wastage eligible', value: firstPresent(item?.wastage_eligible, item?.is_wastage_eligible) },
    { label: 'Stocktake eligible', value: firstPresent(item?.stocktake_eligible, item?.is_stocktake_eligible) },
    { label: 'Transfer eligible', value: firstPresent(item?.transfer_eligible, item?.is_transfer_eligible) },
  ];

  const metadataFields = [
    item?.product_category,
    item?.category,
    item?.pack_size,
    item?.tax_group,
    item?.governance_notes,
    item?.governance_updated_at,
    item?.governance_updated_by,
    supplierItemCode,
    supplierPackSize,
    supplierUom,
    item?.supplier_reference_updated_at,
    ...ruleFlags.map(rule => rule.value),
  ];

  return {
    category: firstPresent(item?.product_category, item?.category),
    packSize: firstPresent(item?.pack_size, item?.packSize),
    taxGroup: firstPresent(item?.tax_group, item?.taxGroup),
    supplierName,
    supplierItemCode,
    supplierPackSize,
    supplierUom,
    supplierReferenceUpdatedAt: firstPresent(item?.supplier_reference_updated_at, item?.supplier_ref_updated_at),
    notes: firstPresent(item?.governance_notes, item?.item_governance_notes),
    updatedBy: firstPresent(item?.governance_updated_by, item?.item_governance_updated_by),
    updatedAt: firstPresent(item?.governance_updated_at, item?.updated_date),
    ruleFlags,
    hasMetadata: metadataFields.some(value => value === true || value === false || hasValue(value)),
    hasSupplierReference: [supplierName, supplierItemCode, supplierPackSize, supplierUom].some(hasValue),
  };
}

function movementDate(row) {
  const date = new Date(row?.created_date || row?.updated_date || 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function withinLastDays(row, days) {
  const date = movementDate(row);
  if (!date) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

function statusForItem({ item, avgDailyOut, daysCover }) {
  const stock = safeNumber(item?.stock);
  const reorderPoint = item?.reorder_point === null || item?.reorder_point === undefined
    ? null
    : safeNumber(item.reorder_point, null);

  if (reorderPoint !== null && stock <= reorderPoint) {
    return { label: 'Low Stock', tone: 'red', description: 'At or below reorder point' };
  }
  if (avgDailyOut > 0 && daysCover !== null && daysCover <= 7) {
    return { label: 'At Risk', tone: 'amber', description: 'Less than 7 days cover' };
  }
  if (stock > 0 && avgDailyOut === 0) {
    return { label: 'Slow Moving', tone: 'slate', description: 'No 30-day outflow recorded' };
  }
  return { label: 'Healthy', tone: 'green', description: 'No immediate item-level issue' };
}

function statusClass(tone) {
  switch (tone) {
    case 'red': return 'bg-red-50 text-red-700 border-red-200';
    case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'green': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function KpiCard({ icon: Icon, label, value, subtext }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 min-w-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground truncate">{label}</p>
        {Icon && <Icon size={14} className="text-muted-foreground shrink-0" />}
      </div>
      <p className="text-xl font-semibold text-foreground leading-tight truncate">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">{subtext}</p>
    </div>
  );
}

function InfoRow({ label, value, valueClassName = '' }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground text-right ${valueClassName}`}>{value}</span>
    </div>
  );
}

function MiniUsageTrend({ movements }) {
  const buckets = useMemo(() => {
    const now = new Date();
    const blocks = [
      { label: 'Days 22–30', start: 30, end: 22, qty: 0 },
      { label: 'Days 15–21', start: 21, end: 15, qty: 0 },
      { label: 'Days 8–14', start: 14, end: 8, qty: 0 },
      { label: 'Days 0–7', start: 7, end: 0, qty: 0 },
    ];

    movements.forEach(row => {
      if (row.direction !== 'OUT') return;
      const date = movementDate(row);
      if (!date) return;
      const ageDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      const block = blocks.find(candidate => ageDays <= candidate.start && ageDays >= candidate.end);
      if (block) block.qty += safeNumber(row.qty);
    });

    const max = Math.max(...blocks.map(block => block.qty), 1);
    return blocks.map(block => ({ ...block, width: Math.max(8, Math.round((block.qty / max) * 100)) }));
  }, [movements]);

  return (
    <div className="space-y-2.5">
      {buckets.map(bucket => (
        <div key={bucket.label} className="grid grid-cols-[88px_1fr_42px] items-center gap-2 text-xs">
          <span className="text-muted-foreground">{bucket.label}</span>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-foreground/40" style={{ width: `${bucket.width}%` }} />
          </div>
          <span className="text-right font-medium text-foreground">{formatNumber(bucket.qty)}</span>
        </div>
      ))}
    </div>
  );
}


function RuleChip({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ruleChipTone(value)}`}>
        {flagLabel(value)}
      </span>
    </div>
  );
}

function GovernanceEmptyState({ children }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground text-center">
      {children}
    </div>
  );
}

function GovernancePanel({ item, aliases, auditRows, loading, notice, onEditGovernance, canEdit }) {
  const governance = deriveGovernance(item);
  const unit = item?.unit || 'unit';
  const latestAudit = auditRows?.[0] || null;
  const hasAudit = Boolean(latestAudit);

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Product Governance</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              <ShieldCheck size={11} /> Metadata Only
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              <Lock size={11} /> No Stock Mutation
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Controlled item identity and operational rules. This section does not change stock balances.
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={onEditGovernance}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-primary/40 rounded bg-primary/5 text-primary hover:bg-primary/10 transition-colors font-medium"
          >
            <Pencil size={12} /> Edit Governance
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-border rounded bg-muted text-muted-foreground cursor-not-allowed" title="Manager or above required">
            <Lock size={11} /> Manager+ Required
          </span>
        )}
      </div>

      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {notice}
        </div>
      )}

      {!governance.hasMetadata && (
        <GovernanceEmptyState>No governance metadata has been configured for this item yet.</GovernanceEmptyState>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-background p-4 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-foreground">Identity</h3>
            <Package size={15} className="text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <InfoRow label="Item Name" value={item?.name || '—'} />
            <InfoRow label="SKU" value={item?.sku || '—'} valueClassName="font-mono" />
            <InfoRow label="Internal Item ID" value={item?.id || '—'} valueClassName="font-mono text-xs" />
            <InfoRow label="Product Category" value={formatPlain(governance.category)} />
            <InfoRow label="UOM" value={unit} />
            <InfoRow label="Pack Size" value={formatPlain(governance.packSize)} />
            <InfoRow label="Tax Group" value={formatPlain(governance.taxGroup)} />
            <InfoRow
              label="Status"
              value={item?.is_active === false ? 'Inactive' : 'Active'}
              valueClassName={item?.is_active === false ? 'text-slate-600' : 'text-green-700'}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Barcode Aliases</h3>
              <p className="text-xs text-muted-foreground">Aliases identify the item only.</p>
            </div>
            <Tags size={15} className="text-muted-foreground" />
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading barcode aliases…</div>
          ) : aliases.length === 0 ? (
            <GovernanceEmptyState>No barcode aliases are linked to this item.</GovernanceEmptyState>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Barcode</th>
                    <th className="text-left px-3 py-2 font-medium">Type</th>
                    <th className="text-left px-3 py-2 font-medium">Primary</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aliases.map((row, index) => (
                    <tr key={row.id || row.barcode || index} className="border-t border-border">
                      <td className="px-3 py-2 font-mono text-xs text-foreground whitespace-nowrap">{row.barcode || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{row.barcode_type || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{row.is_primary === false ? 'No' : 'Yes'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${row.is_active === false ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          {row.is_active === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Barcode aliases identify the item only. They do not change stock, price, or expiry records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-xl border border-border bg-background p-4 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-3">Operational Rules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {governance.ruleFlags.map(rule => (
              <RuleChip key={rule.label} label={rule.label} value={rule.value} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Rule flags are read by downstream workflows only when configured. This panel does not create Markdown, Wastage, Transfer, Stocktake, RFID, ScanOps, Forecasting, or Movement records.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-3">Supplier Reference</h3>
          {!governance.hasSupplierReference ? (
            <GovernanceEmptyState>No preferred supplier reference has been assigned.</GovernanceEmptyState>
          ) : (
            <div className="space-y-0.5">
              <InfoRow label="Preferred Supplier" value={formatPlain(governance.supplierName)} />
              <InfoRow label="Supplier Item Code" value={formatPlain(governance.supplierItemCode)} valueClassName="font-mono" />
              <InfoRow label="Supplier Pack Size" value={formatPlain(governance.supplierPackSize)} />
              <InfoRow label="Supplier UOM" value={formatPlain(governance.supplierUom)} />
              <InfoRow label="Last Reference Update" value={formatDateTime(governance.supplierReferenceUpdatedAt)} />
            </div>
          )}
          <p className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Supplier references do not own item identity. Inventory remains the source of truth for product identity.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Governance Notes / Audit Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoMetric label="Last Updated" value={formatDateTime(governance.updatedAt)} />
          <InfoMetric label="Updated By" value={formatPlain(governance.updatedBy)} />
          <InfoMetric label="Latest Audit Event" value={hasAudit ? `${latestAudit.change_type || 'Audit'} · ${formatDateTime(latestAudit.created_date || latestAudit.updated_date)}` : '—'} />
        </div>
        <div className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
          {governance.notes || (hasAudit
            ? `Audit preview available from ${latestAudit.source_module || 'Inventory'} for ${latestAudit.field_name || 'item governance'}.`
            : 'No governance audit history is available yet.')}
        </div>
      </div>
    </section>
  );
}

export default function ItemDetailsWorkspace({ item: initialItem, onBack }) {
  const navigate = useNavigate();
  const [item, setItem] = useState(initialItem);
  const [movements, setMovements] = useState([]);
  const [barcodeAliases, setBarcodeAliases] = useState([]);
  const [governanceAudit, setGovernanceAudit] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [loadingGovernance, setLoadingGovernance] = useState(true);
  const [error, setError] = useState('');
  const [governanceNotice, setGovernanceNotice] = useState('');
  const [showGovernanceEdit, setShowGovernanceEdit] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => setUserRole(u?.role || ''));
  }, []);

  const loadMovements = useCallback(async () => {
    if (!item?.id && !item?.sku) return;
    setLoadingMovements(true);
    setError('');

    try {
      // Read-only and intentionally aligned with the existing Movements/Stock History ledger path.
      const request = base44.entities.StockMovement.filter(envFilter(), '-created_date', 500);
      const rows = await withLocalDevTimeout(request, 4000, 'StockMovement.filter');
      const targetSku = (item?.sku || '').toLowerCase();
      const targetId = item?.id || '';
      const itemRows = (rows || []).filter(row =>
        (targetId && row.item_id === targetId) ||
        (targetSku && (row.sku || '').toLowerCase() === targetSku)
      );
      setMovements(itemRows);
    } catch (err) {
      if (isLocalDevInventoryFallbackEnabled()) {
        setMovements(getLocalDevStockMovements(item));
        setError(localDevInventoryFallbackNotice('Stock movements'));
      } else {
        setError(err?.message || 'Could not load item movement summary.');
      }
    } finally {
      setLoadingMovements(false);
    }
  }, [item]);

  useEffect(() => { loadMovements(); }, [loadMovements]);


  const loadGovernance = useCallback(async () => {
    if (!item?.id && !item?.sku) return;
    setLoadingGovernance(true);
    setGovernanceNotice('');

    const inlineAliases = getItemBarcodeFields(item);

    try {
      const targetSku = item?.sku || '';
      const barcodeRequests = [];
      if (item?.id) {
        barcodeRequests.push(base44.entities.ItemBarcode.filter({ ...envFilter(), item_id: item.id }, '-created_date', 50));
      }
      if (targetSku) {
        barcodeRequests.push(base44.entities.ItemBarcode.filter({ ...envFilter(), sku: targetSku }, '-created_date', 50));
      }

      const auditRequest = item?.id
        ? base44.entities.AuditLog.filter({ ...envFilter(), item_id: item.id }, '-created_date', 20)
        : base44.entities.AuditLog.filter({ ...envFilter(), sku: targetSku }, '-created_date', 20);

      const [barcodeSettled, auditSettled] = await Promise.allSettled([
        Promise.all(barcodeRequests.map(request => withLocalDevTimeout(request, 4000, 'ItemBarcode.filter'))),
        withLocalDevTimeout(auditRequest, 4000, 'AuditLog.filter'),
      ]);

      const barcodeRows = barcodeSettled.status === 'fulfilled'
        ? barcodeSettled.value.flat().filter(Boolean)
        : [];
      const auditRows = auditSettled.status === 'fulfilled'
        ? auditSettled.value || []
        : [];

      setBarcodeAliases(uniqueByBarcode([...barcodeRows, ...inlineAliases]));
      setGovernanceAudit((auditRows || []).filter(row =>
        ['ITEM_CREATE', 'ITEM_UPDATE', 'PRICE_UPDATE', 'THRESHOLD_UPDATE', 'SUPPLIER_UPDATE'].includes(row?.change_type) ||
        ['item_master', 'cost_per_unit', 'preferred_supplier', 'reorder_point', 'reorder_qty'].includes(row?.field_name)
      ));

      if (barcodeSettled.status === 'rejected' || auditSettled.status === 'rejected') {
        setGovernanceNotice('Some governance reference data could not be loaded. Core item identity remains visible.');
      }
    } catch (err) {
      setBarcodeAliases(inlineAliases);
      setGovernanceAudit([]);
      setGovernanceNotice(err?.message || 'Governance reference data could not be loaded. Core item identity remains visible.');
    } finally {
      setLoadingGovernance(false);
    }
  }, [item]);

  useEffect(() => { loadGovernance(); }, [loadGovernance]);

  const summary = useMemo(() => {
    const last30 = movements.filter(row => withinLastDays(row, 30));
    const stockIn30 = last30.filter(row => row.direction === 'IN').reduce((sum, row) => sum + safeNumber(row.qty), 0);
    const stockOut30 = last30.filter(row => row.direction === 'OUT').reduce((sum, row) => sum + safeNumber(row.qty), 0);
    const adjustments30 = last30
      .filter(row => row.movement_type === 'ADJUST')
      .reduce((sum, row) => sum + (row.direction === 'IN' ? safeNumber(row.qty) : -safeNumber(row.qty)), 0);
    const wastage30 = last30
      .filter(row => row.movement_type === 'WASTE')
      .reduce((sum, row) => sum + safeNumber(row.qty), 0);
    const net30 = stockIn30 - stockOut30;
    const avgDailyOut = stockOut30 / 30;
    const stock = safeNumber(item?.stock);
    const daysCover = avgDailyOut > 0 ? stock / avgDailyOut : null;
    const lastMovement = movements[0] || null;
    const runoutDate = daysCover !== null
      ? new Date(Date.now() + Math.ceil(daysCover) * 24 * 60 * 60 * 1000)
      : null;
    const status = statusForItem({ item, avgDailyOut, daysCover });
    const reorderPoint = item?.reorder_point === null || item?.reorder_point === undefined ? null : safeNumber(item.reorder_point, null);
    const reorderQty = item?.reorder_qty === null || item?.reorder_qty === undefined ? null : safeNumber(item.reorder_qty, null);
    const suggestedOrderQty = status.label === 'Low Stock' || status.label === 'At Risk'
      ? (reorderQty || Math.max(0, Math.ceil(stockOut30 - stock)))
      : 0;

    return {
      last30,
      stockIn30,
      stockOut30,
      adjustments30,
      wastage30,
      net30,
      avgDailyOut,
      daysCover,
      lastMovement,
      runoutDate,
      status,
      reorderPoint,
      reorderQty,
      suggestedOrderQty,
    };
  }, [item, movements]);

  if (!item) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
          <ArrowLeft size={14} /> Back to Inventory
        </button>
        <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No item selected.
        </div>
      </div>
    );
  }

  const unit = item.unit || 'unit';
  const openFullMovements = () => {
    navigate(`/Movements?sku=${encodeURIComponent(item.sku || '')}`);
  };

  return (
    <div className="p-5 lg:p-6 w-full max-w-none space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to Inventory
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground truncate">{item.name || 'Unnamed item'}</h1>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(summary.status.tone)}`}>
              {summary.status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">SKU: {item.sku || '—'}</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 max-w-md">
          <p className="text-xs text-muted-foreground">
            Item Details upgrades the old stock-history workflow into a read-only item insight view. Full transaction history remains in the Movements module.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard icon={Package} label="On Hand" value={formatNumber(item.stock ?? 0)} subtext={unit} />
        <KpiCard icon={TrendingUp} label="Avg 30D Usage" value={formatNumber(summary.avgDailyOut, 1)} subtext={`${unit} / day outflow`} />
        <KpiCard icon={BarChart3} label="Days Cover" value={summary.daysCover === null ? '—' : formatNumber(summary.daysCover, 0)} subtext={summary.daysCover === null ? 'No 30D outflow' : 'estimated days remaining'} />
        <KpiCard icon={AlertTriangle} label="Status" value={summary.status.label} subtext={summary.status.description} />
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <ItemDetailsForecastPanel item={item} movements={movements} loadingMovements={loadingMovements} />

      <WasteInsightWidget item={item} />

      {showGovernanceEdit && (
        <ItemGovernanceEditModal
          item={item}
          onClose={() => setShowGovernanceEdit(false)}
          onSaved={(updatedItem) => {
            setItem(updatedItem);
            setShowGovernanceEdit(false);
          }}
        />
      )}

      <GovernancePanel
        item={item}
        aliases={barcodeAliases}
        auditRows={governanceAudit}
        loading={loadingGovernance}
        notice={governanceNotice}
        canEdit={canManageGovernance(userRole)}
        onEditGovernance={() => setShowGovernanceEdit(true)}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-4">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Item Summary</h2>
            <Activity size={15} className="text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <InfoRow label="SKU" value={item.sku || '—'} />
            <InfoRow label="Unit" value={unit} />
            <InfoRow label="Unit Price" value={formatCurrency(item.cost_per_unit)} />
            <InfoRow label="Supplier" value={item.preferred_supplier || '—'} />
            <InfoRow label="Reorder Point" value={summary.reorderPoint === null ? '—' : `${formatNumber(summary.reorderPoint)} ${unit}`} />
            <InfoRow label="Reorder Qty" value={summary.reorderQty === null ? '—' : `${formatNumber(summary.reorderQty)} ${unit}`} />
            <InfoRow label="Primary Site" value={item.site_id || '—'} />
            <InfoRow label="Last Updated" value={formatDateTime(item.updated_date)} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Usage & Demand</h2>
              <p className="text-xs text-muted-foreground">Last 30 days, based on posted OUT movements</p>
            </div>
            <button
              type="button"
              onClick={loadMovements}
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RefreshCw size={12} className={loadingMovements ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loadingMovements ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading item insights…</div>
          ) : (
            <>
              <MiniUsageTrend movements={summary.last30} />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Avg Daily Out</p>
                  <p className="text-lg font-semibold text-foreground">{formatNumber(summary.avgDailyOut, 1)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Total Out 30D</p>
                  <p className="text-lg font-semibold text-foreground">{formatNumber(summary.stockOut30)}</p>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Reorder Intelligence</h2>
            <AlertTriangle size={15} className="text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <InfoRow label="Current Stock" value={`${formatNumber(item.stock ?? 0)} ${unit}`} />
            <InfoRow label="Reorder Point" value={summary.reorderPoint === null ? '—' : `${formatNumber(summary.reorderPoint)} ${unit}`} />
            <InfoRow label="Reorder Qty" value={summary.reorderQty === null ? '—' : `${formatNumber(summary.reorderQty)} ${unit}`} />
            <InfoRow label="Projected Runout" value={summary.runoutDate ? formatDateOnly(summary.runoutDate) : 'No 30D outflow'} />
            <InfoRow label="Suggested Order Qty" value={summary.suggestedOrderQty > 0 ? `${formatNumber(summary.suggestedOrderQty)} ${unit}` : 'No action'} />
          </div>
          <div className={`mt-4 rounded-lg border px-3 py-3 text-sm ${statusClass(summary.status.tone)}`}>
            <p className="font-semibold">Recommendation</p>
            <p className="mt-1 text-xs">
              {summary.suggestedOrderQty > 0
                ? 'Review this item for reorder. This is read-only decision support and does not create a purchase order.'
                : 'No immediate reorder action suggested from this item-level view.'}
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Stock Movement Summary</h2>
            <p className="text-xs text-muted-foreground">Lightweight summary only. Full ledger stays in Movements. Inbound/outbound are direction totals; category cards are diagnostic breakdowns, not extra additions.</p>
          </div>
          <button
            type="button"
            onClick={openFullMovements}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
          >
            <ExternalLink size={13} /> Open Full Movements
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <InfoMetric label="Last Movement Date" value={formatDateTime(summary.lastMovement?.created_date)} />
          <InfoMetric label="Last Movement Type" value={TYPE_LABELS[summary.lastMovement?.movement_type] || summary.lastMovement?.movement_type || '—'} />
          <InfoMetric label="Inbound 30D" value={`${formatNumber(summary.stockIn30)} ${unit}`} />
          <InfoMetric label="Outbound 30D" value={`${formatNumber(summary.stockOut30)} ${unit}`} />
          <InfoMetric label="Adjustments 30D" value={`${summary.adjustments30 > 0 ? '+' : ''}${formatNumber(summary.adjustments30)} ${unit}`} />
          <InfoMetric label="Wastage 30D" value={`${formatNumber(summary.wastage30)} ${unit}`} />
          <InfoMetric label="Net Change 30D" value={`${summary.net30 > 0 ? '+' : ''}${formatNumber(summary.net30)} ${unit}`} />
          <InfoMetric label="Rows Read" value={`${formatNumber(summary.last30.length)} movement${summary.last30.length === 1 ? '' : 's'}`} />
        </div>
      </section>

      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        Safety lock: this screen is read-only and does not replace the Stock History engine, movement ledger, Gap Scan, Reorder Review, dashboard alerts, reporting, or audit calculations.
      </div>
    </div>
  );
}

function InfoMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground truncate">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-1 truncate">{value}</p>
    </div>
  );
}