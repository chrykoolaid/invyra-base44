/**
 * InventorySettings — Admin/Owner-only configuration module.
 *
 * DECOUPLING RULES: This page must never import or call:
 *   inventoryMovement, postInventoryMovement, stocktake, receiving,
 *   transfer, wastage, or PO approval logic.
 *
 * Only uses: settings-service, base44.auth, and UI components.
 */

import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getConfiguration, initConfiguration, saveConfigurationSection } from '@/lib/settings-service';
import SettingsSectionShell from '@/components/settings/SettingsSectionShell';
import SettingsField from '@/components/settings/SettingsField';
import LockedFeatureBadge from '@/components/settings/LockedFeatureBadge';
import { Lock, Settings, ShieldCheck, Bell, RefreshCw, Cpu, Share2, FileSpreadsheet, FileUp, PlugZap, CircleAlert, ClipboardList } from 'lucide-react';

const TABS = [
  { id: 'general',       label: 'General',                  icon: Settings    },
  { id: 'inventory',     label: 'Inventory Rules',          icon: ShieldCheck  },
  { id: 'reorder',       label: 'Reorder Behaviour',        icon: RefreshCw    },
  { id: 'gap-scan',      label: 'Gap Scan / Replenishment', icon: ClipboardList },
  { id: 'devices',       label: 'Sync & Devices',           icon: Cpu         },
  { id: 'data-exchange', label: 'Data Exchange',            icon: Share2      },
  { id: 'compliance',    label: 'Environment & Compliance', icon: Lock        },
  { id: 'notifications', label: 'Notifications',            icon: Bell        },
];

const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD MMM YYYY'];
const TIMEZONES    = ['Asia/Manila', 'Asia/Singapore', 'UTC', 'Asia/Hong_Kong', 'Australia/Sydney'];
const UOM_OPTIONS  = ['pcs', 'kg', 'L', 'ml', 'g', 'box', 'pack', 'pair'];

function getInitialSettingsTab() {
  if (typeof window === 'undefined') return 'general';
  const requested = new URLSearchParams(window.location.search).get('tab');
  return TABS.some(tab => tab.id === requested) ? requested : 'general';
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-primary' : 'bg-muted'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-9 w-full max-w-xs border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full max-w-xs border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

// ─── Tab: General ────────────────────────────────────────────────────────────
function TabGeneral({ config, onSave, saving, saveResult }) {
  const [form, setForm] = useState(config?.business_defaults ?? {});
  useEffect(() => setForm(config?.business_defaults ?? {}), [config]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <SettingsSectionShell
      title="General Defaults"
      description="Business identity and regional formatting. These values are used as system-wide defaults."
      onSave={() => onSave('business_defaults', config?.business_defaults ?? {}, form)}
      saving={saving}
      saveResult={saveResult}
      saveLabel="Save General Settings"
    >
      <SettingsField label="Currency" hint="ISO currency code used across inventory valuation.">
        <TextInput value={form.currency_code} onChange={v => set('currency_code', v)} placeholder="PHP" />
      </SettingsField>
      <SettingsField label="Timezone" hint="Default timezone for date/time display and reporting.">
        <SelectInput value={form.timezone ?? 'Asia/Manila'} onChange={v => set('timezone', v)} options={TIMEZONES} />
      </SettingsField>
      <SettingsField label="Date Format" hint="How dates are displayed across the system.">
        <SelectInput value={form.date_format ?? 'YYYY-MM-DD'} onChange={v => set('date_format', v)} options={DATE_FORMATS} />
      </SettingsField>
      <SettingsField label="Default Unit of Measure" hint="Applied when no UOM is specified on an item.">
        <SelectInput value={form.default_uom ?? 'pcs'} onChange={v => set('default_uom', v)} options={UOM_OPTIONS} />
      </SettingsField>
    </SettingsSectionShell>
  );
}

// ─── Tab: Inventory Rules ─────────────────────────────────────────────────────
function TabInventory({ config, onSave, saving, saveResult }) {
  const [form, setForm] = useState(config?.inventory_rules ?? {});
  useEffect(() => setForm(config?.inventory_rules ?? {}), [config]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <SettingsSectionShell
      title="Inventory Rules"
      description="Controls how the inventory system handles stock guardrails and adjustment requirements."
      onSave={() => onSave('inventory_rules', config?.inventory_rules ?? {}, form)}
      saving={saving}
      saveResult={saveResult}
      saveLabel="Save Inventory Rules"
    >
      <SettingsField label="Allow Negative Stock" hint="When disabled, the system blocks any movement that would push stock below zero.">
        <Toggle checked={!!form.allow_negative_stock} onChange={v => set('allow_negative_stock', v)} />
      </SettingsField>
      <SettingsField label="Require Reason for Adjustments" hint="Forces a reason note whenever a manual adjustment is posted.">
        <Toggle checked={!!form.require_reason_for_adjustments} onChange={v => set('require_reason_for_adjustments', v)} />
      </SettingsField>
      <SettingsField label="Track Stock by Default" hint="New inventory items are set to tracked by default.">
        <Toggle checked={!!form.track_stock_by_default} onChange={v => set('track_stock_by_default', v)} />
      </SettingsField>
      <SettingsField label="Reference Requirements" hint="Policy requiring reference codes on all movements.">
        <LockedFeatureBadge label="Planned" reason="Reference requirement enforcement will be configurable in a future release." />
      </SettingsField>
    </SettingsSectionShell>
  );
}

// ─── Tab: Reorder Behaviour ───────────────────────────────────────────────────
function TabReorder({ config, onSave, saving, saveResult }) {
  const [form, setForm] = useState(config?.reorder_behavior ?? {});
  useEffect(() => setForm(config?.reorder_behavior ?? {}), [config]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <SettingsSectionShell
      title="Reorder Behaviour"
      description="Default values used by Reorder Review when calculating order recommendations."
      onSave={() => onSave('reorder_behavior', config?.reorder_behavior ?? {}, form)}
      saving={saving}
      saveResult={saveResult}
      saveLabel="Save Reorder Settings"
    >
      <SettingsField label="Coverage Days Default" hint="Number of days of stock cover targeted by reorder recommendations.">
        <TextInput
          value={form.coverage_days_default ?? 14}
          onChange={v => set('coverage_days_default', v)}
          placeholder="14"
          type="number"
        />
      </SettingsField>
      <SettingsField label="Safety Stock %" hint="Percentage buffer above calculated reorder quantity.">
        <LockedFeatureBadge label="Planned" reason="Safety stock calculation will be enabled after stable movement history exists." />
      </SettingsField>
      <SettingsField label="Pack-Size Rounding Rule" hint="Rounds suggested order quantities to nearest supplier pack size.">
        <LockedFeatureBadge label="Planned" reason="Pack-size rounding requires supplier pack-size data to be fully wired." />
      </SettingsField>
      <SettingsField label="Recommendation Rules" hint="Advanced ruleset governing automated reorder suggestions.">
        <LockedFeatureBadge label="Planned" reason="Recommendation rules will be available after the Threshold Intelligence engine is complete." />
      </SettingsField>
    </SettingsSectionShell>
  );
}

// ─── Tab: Gap Scan / Replenishment ───────────────────────────────────────────
function TabGapScanReplenishment() {
  return (
    <SettingsSectionShell
      title="Gap Scan / Replenishment"
      description="Roadmap-only planning for future Fill Task creation modes. Active behaviour remains manual-only."
      hideSave
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
            <CircleAlert className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">Manual only is the current default</p>
            <p className="text-sm leading-relaxed text-amber-800/90">
              Gap Scan may suggest replenishment rows, but it does not auto-create Fill Tasks on page load or Run Scan. Automation remains a future Admin setting after staff workflow testing.
            </p>
          </div>
        </div>
      </div>

      <SettingsField label="Fill Task Creation Mode" hint="Future setting. Current active behaviour is manual-only.">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Manual only
          </span>
          <LockedFeatureBadge label="Future Options Planned" reason="Suggest only, auto-create critical only, and auto-create critical + watch will stay disabled until Fill Task lifecycle is proven in live staff flow." />
        </div>
      </SettingsField>

      <SettingsField label="Automation Boundary" hint="Protects Gap Scan, Reorder Review, Orders, Stocktake, and StockMovement separation.">
        <LockedFeatureBadge label="Locked" reason="No automatic Fill Task creation, stock movement, reorder draft, purchase order, stock adjustment, or Item Master mutation is active from this settings plan." />
      </SettingsField>
    </SettingsSectionShell>
  );
}


// ─── Tab: Environment & Compliance ───────────────────────────────────────────
function TabCompliance({ config, onSave, saving, saveResult }) {
  const [form, setForm] = useState(config?.compliance ?? {});
  useEffect(() => setForm(config?.compliance ?? {}), [config]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <SettingsSectionShell
      title="Environment & Compliance"
      description="Audit retention and compliance controls. LIVE/TRAINING/TEST environment rules are system-controlled and cannot be changed here."
      onSave={() => onSave('compliance', config?.compliance ?? {}, form)}
      saving={saving}
      saveResult={saveResult}
      saveLabel="Save Compliance Settings"
    >
      <SettingsField label="Audit Retention (Days)" hint="Number of days AuditLog entries are retained before archival.">
        <TextInput
          value={form.audit_retention_days ?? 365}
          onChange={v => set('audit_retention_days', v)}
          placeholder="365"
          type="number"
        />
      </SettingsField>
      <SettingsField label="Supplier Disclaimer Version" hint="Current locked supplier disclaimer version. Managed by Admin.">
        <div className="flex items-center gap-2 h-9">
          <span className="text-sm font-mono text-foreground">
            {config?.compliance?.locked_supplier_disclaimer_version ?? 'v1.0'}
          </span>
          <span className="text-[10px] border border-slate-200 rounded-full px-2 py-0.5 text-slate-500 font-semibold uppercase tracking-wide">
            Read-only
          </span>
        </div>
      </SettingsField>
      <SettingsField label="LIVE / TRAINING / TEST Behaviour" hint="Environment separation rules are system-controlled. They cannot be changed from Settings.">
        <LockedFeatureBadge label="System Controlled" reason="Environment partition rules are enforced at the platform level and cannot be overridden here." />
      </SettingsField>
      <SettingsField label="Compliance Notices" hint="Regulatory and disclaimer notice management.">
        <LockedFeatureBadge label="Planned" reason="Compliance notice management will be available in a future release." />
      </SettingsField>
    </SettingsSectionShell>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────
function TabNotifications({ config, onSave, saving, saveResult }) {
  const [form, setForm] = useState(config?.notifications ?? {});
  useEffect(() => setForm(config?.notifications ?? {}), [config]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <SettingsSectionShell
      title="Notifications"
      description="Toggle alert channels for key inventory events."
      onSave={() => onSave('notifications', config?.notifications ?? {}, form)}
      saving={saving}
      saveResult={saveResult}
      saveLabel="Save Notification Settings"
    >
      <SettingsField label="Low Stock Alerts" hint="Notify when an item falls below its reorder point.">
        <Toggle checked={!!form.low_stock_enabled} onChange={v => set('low_stock_enabled', v)} />
      </SettingsField>
      <SettingsField label="Wastage Alerts" hint="Notify when a wastage record is posted.">
        <Toggle checked={!!form.wastage_enabled} onChange={v => set('wastage_enabled', v)} />
      </SettingsField>
      <SettingsField label="Discrepancy Alerts" hint="Notify when a receiving discrepancy is flagged.">
        <Toggle checked={!!form.discrepancy_enabled} onChange={v => set('discrepancy_enabled', v)} />
      </SettingsField>
    </SettingsSectionShell>
  );
}

// ─── Tab: Sync & Devices ──────────────────────────────────────────────────────
function TabDevices() {
  return (
    <SettingsSectionShell
      title="Sync & Devices"
      description="Planned: Handheld device pairing, local sync bridge, and device allow-list management."
      hideSave
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 flex flex-col items-center justify-center text-center gap-3">
        <Cpu size={32} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-500">Sync & Devices — Planned Feature</p>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
          Handheld device pairing, local sync bridge endpoints, allowed device lists, and sync inbox policies are roadmap items. This tab will become editable once device infrastructure is ready.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { label: 'Handheld Sync Bridge', reason: 'Requires hardware connector infrastructure.' },
          { label: 'Device Pairing', reason: 'Requires device management service.' },
          { label: 'Local Endpoint Config', reason: 'Requires on-premise sync bridge deployment.' },
          { label: 'Sync Inbox Policy', reason: 'Requires sync queue and conflict resolution engine.' },
        ].map(item => (
          <SettingsField key={item.label} label={item.label}>
            <LockedFeatureBadge label="Planned" reason={item.reason} />
          </SettingsField>
        ))}
      </div>
    </SettingsSectionShell>
  );
}


// ─── Tab: Data Exchange ──────────────────────────────────────────────────────
function TabDataExchange() {
  const capabilityGroups = [
    {
      title: 'Planned exports',
      description: 'Outbound inventory, order, wastage, and reporting surfaces after source workflows are stable.',
      items: [
        { icon: FileSpreadsheet, title: 'Inventory CSV export', body: 'Reserved for controlled item, stock balance, and threshold exports once data ownership rules are finalised.' },
        { icon: FileSpreadsheet, title: 'Order history export', body: 'Reserved for purchase order history exports after Orders and Receiving are stable enough to expose externally.' },
        { icon: FileSpreadsheet, title: 'Wastage / stock-out export', body: 'Reserved for approved stock-out and wastage reporting; operational report exports remain inside their source modules.' },
      ],
    },
    {
      title: 'Planned imports & connectors',
      description: 'Inbound catalogue loading and third-party connectors remain disabled until the core ledger and order flows are locked.',
      items: [
        { icon: FileUp, title: 'Supplier catalogue import', body: 'Planned support for supplier price sheets and item files after templates, mapping rules, and validation are defined.' },
        { icon: PlugZap, title: 'Accounting connectors', body: 'Future connector setup for accounting systems. No live sync, token storage, or connector runtime is active here.' },
        { icon: Share2, title: 'API / webhook exchange', body: 'Future machine-to-machine exchange after admission control, audit, and failure recovery are approved.' },
      ],
    },
  ];

  return (
    <SettingsSectionShell
      title="Data Exchange"
      description="Roadmap-only connector and import/export planning. This tab replaces the old standalone Exports & Integrations sidebar page."
      hideSave
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
            <CircleAlert className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">Planned / roadmap only</p>
            <p className="text-sm leading-relaxed text-amber-800/90">
              No live import, export, connector, webhook, or third-party sync action is activated from Inventory Settings. Operational exports should stay inside Reports or the source workflow until the exchange layer is approved.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {capabilityGroups.map(group => (
          <section key={group.title} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/25">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Planned capabilities</p>
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
            </div>
            <div className="p-4 space-y-3">
              {group.items.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-border bg-background px-4 py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/70 border border-border">
                        <Icon className="h-4 w-4 text-foreground" strokeWidth={1.9} />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                    </div>
                    <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Planned
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-4">
        <p className="text-sm font-semibold text-foreground mb-1">Promotion rule</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Data Exchange should only return as a full sidebar workspace after supplier imports, connector configuration, API tokens, scheduled exports, integration logs, and failed-sync retries become real governed workflows.
        </p>
      </div>
    </SettingsSectionShell>
  );
}

// ─── Page Shell ──────────────────────────────────────────────────────────────
export default function InventorySettings() {
  const [activeTab, setActiveTab] = useState(getInitialSettingsTab);
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      if (!me || !['admin', 'owner'].includes((me.role || '').toLowerCase())) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      setUser(me);
      const cfg = await initConfiguration('LIVE');
      setConfig(cfg);
    } catch {
      // handled via accessDenied state
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // Change tab resets save result
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSaveResult(null);
  };

  const handleSave = async (sectionKey, currentSection, newSection) => {
    setSaving(true);
    setSaveResult(null);
    try {
      const result = await saveConfigurationSection(
        config.id,
        sectionKey,
        currentSection,
        newSection,
        user,
        'LIVE'
      );
      setSaveResult(result);
      // Refresh config after save
      const updated = await getConfiguration('LIVE');
      setConfig(updated);
    } catch (err) {
      setSaveResult({ error: err.message });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Lock size={32} className="mx-auto text-muted-foreground" />
          <p className="text-base font-semibold text-foreground">Access Restricted</p>
          <p className="text-sm text-muted-foreground">Inventory Settings requires Admin or Owner access.</p>
        </div>
      </div>
    );
  }

  const tabProps = { config, onSave: handleSave, saving, saveResult };

  return (
    <div className="p-5 lg:p-6 max-w-4xl space-y-5">
      {/* Page header */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Lock size={13} /> Admin only · Configuration only
            </div>
            <h1 className="text-xl font-semibold text-foreground">Inventory Settings</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              System-wide configuration defaults. Settings control behaviour only — no inventory movements, approvals, or operational actions are performed here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={12} /> Configuration only
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              <Lock size={12} /> Admin / Owner
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isLocked = tab.id === 'devices' || tab.id === 'data-exchange' || tab.id === 'gap-scan';
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 h-8 px-3 text-sm rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
              }`}
            >
              <Icon size={13} />
              {tab.label}
              {isLocked && (
                <span className="ml-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400 border border-slate-200 rounded-full px-1.5 py-px">
                  Planned
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      <div>
        {activeTab === 'general'       && <TabGeneral       {...tabProps} />}
        {activeTab === 'inventory'     && <TabInventory     {...tabProps} />}
        {activeTab === 'reorder'       && <TabReorder       {...tabProps} />}
        {activeTab === 'gap-scan'      && <TabGapScanReplenishment />}
        {activeTab === 'compliance'    && <TabCompliance    {...tabProps} />}
        {activeTab === 'notifications' && <TabNotifications {...tabProps} />}
        {activeTab === 'devices'       && <TabDevices />}
        {activeTab === 'data-exchange' && <TabDataExchange />}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground px-1">
        All configuration changes are audit-logged with old value, new value, changed by, role, environment, and timestamp.
      </p>
    </div>
  );
}