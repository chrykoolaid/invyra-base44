import { useState, useEffect } from 'react';
import {
  BarChart3,
  CircleAlert,
  ClipboardList,
  DollarSign,
  FileClock,
  FileSpreadsheet,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LedgerViewer from '@/components/LedgerViewer';

const overviewCards = [
  {
    eyebrow: 'Module role',
    title: 'Admin oversight hub',
    body: 'Reserved for audit visibility, adjustment reporting, supplier scorecards, and inventory-level admin controls.',
  },
  {
    eyebrow: 'Build status',
    title: 'Planned placeholder',
    body: 'This workspace is intentionally honest in this build. Reporting actions are not wired yet and no live report generation runs from here.',
  },
  {
    eyebrow: 'What exists now',
    title: 'Roadmap + readiness only',
    body: 'Use this page to show upcoming reporting surfaces, rollout order, and what core inventory flows still need to be completed first.',
  },
];

const capabilityGroups = [
  {
    title: 'Admin controls',
    description: 'High-trust oversight surfaces for managers and admin roles.',
    items: [
      {
        icon: ShieldCheck,
        title: 'Audit history',
        body: 'Trace stock edits, overrides, approvals, and other protected admin activity once ledger coverage is fully connected.',
        tag: 'Planned',
      },
      {
        icon: SlidersHorizontal,
        title: 'Adjustment review',
        body: 'Summaries for manual stock adjustments, return-related corrections, and wastage postings.',
        tag: 'Depends on ledger',
      },
      {
        icon: FileClock,
        title: 'Exception visibility',
        body: 'Future review surface for unresolved mismatches, override activity, and admin follow-up queues.',
        tag: 'Later',
      },
    ],
  },
  {
    title: 'Reporting surface',
    description: 'Operational reporting once the underlying inventory events are complete and trustworthy.',
    items: [
      {
        icon: BarChart3,
        title: 'Stock valuation',
        body: 'Category, supplier, and total inventory value reporting powered by completed cost and movement data.',
        tag: 'Planned',
      },
      {
        icon: TrendingUp,
        title: 'Supplier performance',
        body: 'On-time delivery, receipt accuracy, and supplier scorecards after receiving and order outcomes are fully connected.',
        tag: 'Depends on Orders + Receiving',
      },
      {
        icon: FileSpreadsheet,
        title: 'Adjustment reporting',
        body: 'Clean reporting for wastage, stock corrections, and exceptions without pretending those outputs are active yet.',
        tag: 'Planned',
      },
    ],
  },
];

const readinessRows = [
  {
    label: 'Inventory movement ledger coverage',
    status: 'In progress',
    detail: 'Needed before valuation, audit, and adjustment reporting can be trusted.',
  },
  {
    label: 'Wastage flow completion',
    status: 'Depends on rollout',
    detail: 'Required so admin reporting reflects approved wastage events rather than placeholder summaries.',
  },
  {
    label: 'Return / refund inventory effects',
    status: 'Pending later module',
    detail: 'Needed for full adjustment reporting and future exception visibility.',
  },
  {
    label: 'Export layer',
    status: 'Separate module',
    detail: 'Report delivery and export output belongs to Exports & Integrations, not this workspace.',
  },
];

const roadmapBlocks = [
  {
    title: 'Wave 1',
    body: 'Present a clear admin/reporting hub with honest status messaging, dependencies, and future reporting categories.',
  },
  {
    title: 'Wave 2',
    body: 'Connect trusted read-only reporting views once inventory events, costs, and receiving outcomes are stable enough to support them.',
  },
  {
    title: 'Wave 3',
    body: 'Add export-ready outputs, filters, and role-gated admin history once the export layer and permissions are finalised.',
  },
];

const readinessTone = {
  'In progress': 'text-amber-700 bg-amber-50 border-amber-200',
  'Depends on rollout': 'text-sky-700 bg-sky-50 border-sky-200',
  'Pending later module': 'text-slate-600 bg-slate-100 border-slate-200',
  'Separate module': 'text-violet-700 bg-violet-50 border-violet-200',
};

function OverviewCard({ eyebrow, title, body }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-2">{eyebrow}</p>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function CapabilityCard({ icon: Icon, title, body, tag }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/70 border border-border">
            <Icon className="h-4 w-4 text-foreground" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {tag}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

const TABS = ['Unit Pricing', 'Ledger', 'Audit Log', 'Roadmap'];

export default function InventoryAdmin() {
  const [tab, setTab] = useState('Unit Pricing');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    if (tab === 'Unit Pricing') {
      setItemsLoading(true);
      base44.entities.InventoryItem.filter({ is_active: true }, 'name', 500).then(data => {
        setItems(data || []);
        setItemsLoading(false);
      });
    } else if (tab === 'Audit Log') {
      setAuditLoading(true);
      base44.entities.AuditLog.list('-created_date', 100).then(data => {
        setAuditLogs(data || []);
        setAuditLoading(false);
      });
    }
  }, [tab]);

  const handlePriceSave = async (itemId, item) => {
    if (!priceInput.trim()) {
      setEditingPrice(null);
      setPriceInput('');
      return;
    }
    const price = parseFloat(priceInput);
    if (isNaN(price)) return;

    setSavingPrice(true);
    const user = await base44.auth.me();
    const changedBy = user?.email || user?.full_name || 'unknown';

    await base44.entities.InventoryItem.update(itemId, { cost_per_unit: price });
    await base44.entities.AuditLog.create({
      item_id: itemId,
      sku: item.sku,
      item_name: item.name,
      change_type: 'PRICE_UPDATE',
      field_name: 'cost_per_unit',
      old_value: String(item.cost_per_unit || ''),
      new_value: String(price),
      changed_by: changedBy,
    });

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, cost_per_unit: price } : i));
    setEditingPrice(null);
    setPriceInput('');
    setSavingPrice(false);
  };

  return (
    <div className="p-5 lg:p-6 max-w-[1280px] space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Inventory Admin &amp; Reporting</h1>
        <p className="text-sm text-muted-foreground">Stock movement ledger and admin reporting hub.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Unit Pricing' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/25">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Price Configuration</p>
                  <h2 className="text-sm font-semibold text-foreground">Unit pricing for stock valuation</h2>
                  <p className="text-sm text-muted-foreground mt-1">Set landed cost per unit to calculate accurate total inventory value</p>
                </div>
                <DollarSign className="h-5 w-5 text-primary flex-shrink-0" />
              </div>
            </div>
            {itemsLoading ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">Loading inventory items…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">No active inventory items found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                    <tr>
                      {['SKU', 'Item Name', 'Unit', 'On Hand', 'Unit Price (₱)', 'Total Value', 'Action'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.unit || '—'}</td>
                        <td className="px-4 py-3 text-foreground font-mono">{item.stock || 0}</td>
                        <td className="px-4 py-3">
                          {editingPrice === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={priceInput}
                                onChange={e => setPriceInput(e.target.value)}
                                placeholder="0.00"
                                className="w-24 h-8 px-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                              />
                              <button
                                onClick={() => handlePriceSave(item.id, item)}
                                disabled={savingPrice}
                                className="inline-flex items-center gap-1 h-8 px-2 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                              >
                                <Save size={12} /> Save
                              </button>
                              <button
                                onClick={() => { setEditingPrice(null); setPriceInput(''); }}
                                className="inline-flex items-center h-8 px-2 text-xs rounded border border-border hover:bg-muted"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-foreground">{item.cost_per_unit ? item.cost_per_unit.toFixed(2) : '—'}</span>
                              <button
                                onClick={() => { setEditingPrice(item.id); setPriceInput(String(item.cost_per_unit || '')); }}
                                className="text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">
                          {item.cost_per_unit ? `₱${((item.stock || 0) * item.cost_per_unit).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!item.cost_per_unit && (
                            <span className="inline-flex text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Ledger' && <LedgerViewer />}

      {tab === 'Audit Log' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/25">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Change History</p>
              <h2 className="text-sm font-semibold text-foreground">All inventory item modifications</h2>
              <p className="text-sm text-muted-foreground mt-1">Price updates, threshold changes, and configuration edits</p>
            </div>
            {auditLoading ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">Loading audit log…</div>
            ) : auditLogs.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">No changes recorded yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                    <tr>
                      {['Timestamp', 'Item', 'Change Type', 'Field', 'Old Value', 'New Value', 'Changed By'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, i) => (
                      <tr key={log.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">{log.created_date ? new Date(log.created_date).toLocaleString() : '—'}</td>
                        <td className="px-4 py-3 font-medium">
                          <div className="text-foreground">{log.item_name}</div>
                          <div className="text-xs text-muted-foreground">{log.sku}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
                            {log.change_type === 'PRICE_UPDATE' ? 'Price Update' : log.change_type === 'THRESHOLD_UPDATE' ? 'Threshold' : log.change_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-sm">{log.field_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.old_value || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">{log.new_value || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-sm">{log.changed_by || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Roadmap' && <>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 mt-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
            <CircleAlert className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">This module is intentionally presented as a roadmap hub in this build.</p>
            <p className="text-sm leading-relaxed text-amber-800/90">
              It is not a fake finished reporting page. Live report generation, audit output, and export actions will be connected later once the underlying inventory events are complete and trusted.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {overviewCards.map((card) => (
          <OverviewCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {capabilityGroups.map((group) => (
          <section key={group.title} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/25">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Planned capabilities</p>
              <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
            </div>
            <div className="p-4 space-y-3">
              {group.items.map((item) => (
                <CapabilityCard key={item.title} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/25">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Readiness</p>
            <h2 className="text-sm font-semibold text-foreground">What must be finished first</h2>
          </div>
          <div className="divide-y divide-border">
            {readinessRows.map((row) => (
              <div key={row.label} className="px-4 py-3.5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{row.detail}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${readinessTone[row.status]}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/25">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Rollout plan</p>
            <h2 className="text-sm font-semibold text-foreground">How this workspace should mature</h2>
          </div>
          <div className="p-4 space-y-3">
            {roadmapBlocks.map((block) => (
              <div key={block.title} className="rounded-2xl border border-border bg-background px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                  <p className="text-sm font-semibold text-foreground">{block.title}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      </>}
    </div>
  );
}