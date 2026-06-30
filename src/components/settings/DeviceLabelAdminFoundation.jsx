import { Barcode, CircleAlert, Cpu, FileText, Lock, Printer, RefreshCw, Server, ShieldCheck, Smartphone, Tags, Wifi } from 'lucide-react';
import { getInventoryDesktopLocalBridgeServiceStatus } from '@/inventory-bridge/localBridgeService';

const badgeStyles = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
};

const disabledBridgeConfig = {
  bridge_status: 'disabled_contract_phase',
  bridge_runtime_enabled: false,
  bridge_mode: 'local_wifi_ip',
  endpoint_host: null,
  endpoint_port: null,
  last_heartbeat_at: null,
  device_registration_enabled: false,
  trusted_device_count: 0,
  pending_device_count: 0,
  diagnostics_enabled: false,
};

function Badge({ label = 'Planned', tone = 'slate' }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeStyles[tone] || badgeStyles.slate}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${tone}`} strokeWidth={1.8} />}
      </div>
      <p className={`text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function PlannedButton({ children }) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-xs font-medium text-muted-foreground opacity-70"
    >
      <Lock size={12} /> {children}
    </button>
  );
}

function Notice({ icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
          <Icon className="h-4 w-4 text-amber-700" strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900">{title}</p>
          <p className="text-sm leading-relaxed text-amber-800/90">{body}</p>
        </div>
      </div>
    </div>
  );
}

function CapabilityCard({ icon: Icon, title, body, badge = 'Planned' }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/70">
            <Icon className="h-4 w-4 text-foreground" strokeWidth={1.9} />
          </div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        <Badge label={badge} />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function TemplateRow({ name, status = 'Planned', note }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </div>
      <Badge label={status} tone={status === 'Future' ? 'slate' : 'amber'} />
    </div>
  );
}

function FieldChips({ fields, label = 'Planned columns' }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {fields.map(field => (
          <span key={field} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            {field}
          </span>
        ))}
      </div>
    </div>
  );
}

function KeyValueList({ rows }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-background px-4 py-4 text-sm">
      {rows.map(([label, value, tone]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{label}</span>
          <span className={`text-right font-semibold ${tone || 'text-foreground'}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, badge, badgeTone = 'slate' }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3">
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge label={badge} tone={badgeTone} />
    </div>
  );
}

function ContractRow({ label, state = 'done' }) {
  const done = state === 'done';
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
          {done ? '✓' : '○'}
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <Badge label={done ? 'Ready' : 'Future'} tone={done ? 'emerald' : 'slate'} />
    </div>
  );
}

function DevicesFoundation() {
  const deviceFields = ['Device', 'Type', 'Module', 'Location', 'Environment', 'Status', 'Last Seen', 'Approved By'];
  const bridge = disabledBridgeConfig;
  const localBridgeStatus = getInventoryDesktopLocalBridgeServiceStatus();
  const listener = localBridgeStatus.listener || {};
  const metrics = localBridgeStatus.metrics || {};

  return (
    <div className="space-y-5">
      <Notice
        icon={ShieldCheck}
        title="Bridge Phase 5 service foundation"
        body="Sync & Devices now surfaces the Inventory Desktop local bridge service foundation. It can model health, handoff validation, receipts, duplicate protection, and bridge evidence logs, but it still performs no inventory, ledger, stock, pricing, approval, scanner, or network mutation."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Scanner Fleet" value="0" icon={Smartphone} tone="text-blue-600" />
        <StatCard label="Trusted" value={String(bridge.trusted_device_count)} icon={ShieldCheck} tone="text-emerald-600" />
        <StatCard label="Needs Review" value={String(bridge.pending_device_count)} icon={CircleAlert} tone="text-amber-600" />
        <StatCard label="Bridge" value={localBridgeStatus.enabled ? 'On' : 'Off'} icon={localBridgeStatus.enabled ? Server : Lock} tone={localBridgeStatus.enabled ? 'text-emerald-600' : 'text-slate-500'} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          eyebrow="Bridge runtime"
          title="Local Sync Bridge Control Center"
          description="Read-only status surface for the Inventory Desktop-side local bridge service foundation. The adapter is present, but no socket listener, HTTP server, WebSocket server, or inventory mutation is active from this UI."
          badge="Phase 5 Foundation"
          badgeTone="blue"
        />
        <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-3">
          <KeyValueList rows={[
            ['Service status', localBridgeStatus.status || 'DISABLED', localBridgeStatus.enabled ? 'text-emerald-700' : 'text-amber-700'],
            ['Desktop identity', localBridgeStatus.desktopId || 'Not configured'],
            ['Runtime enabled', bridge.bridge_runtime_enabled ? 'Yes' : 'No'],
            ['Accepts handoff', localBridgeStatus.acceptsHandoff ? 'Yes' : 'No'],
            ['Environment', localBridgeStatus.environment || 'LIVE'],
            ['Bridge version', localBridgeStatus.bridgeVersion || 'inventory-desktop-local-bridge.v0.5.0'],
          ]} />

          <div className="rounded-2xl border border-border bg-background px-4 py-4">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <Server className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
            </div>
            <p className="mb-1 text-sm font-semibold text-foreground">Listener foundation is adapter-only</p>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              Phase 5 exposes governed health and handoff handlers for future desktop service wiring. Network activation remains a later bridge phase after service validation and pilot readiness.
            </p>
            <div className="flex flex-wrap gap-2">
              <PlannedButton>Configure Bridge</PlannedButton>
              <PlannedButton>Test Connection</PlannedButton>
              <PlannedButton>Start Bridge</PlannedButton>
              <PlannedButton>Enable Sync</PlannedButton>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Diagnostics</p>
            <div className="space-y-2 text-sm">
              {[
                ['Local only', listener.localOnly ? 'Yes' : 'No'],
                ['HTTP server', listener.httpServerStarted ? 'Started' : 'Not started'],
                ['WebSocket server', listener.websocketServerStarted ? 'Started' : 'Not started'],
                ['Accepted', String(metrics.acceptedCount ?? 0)],
                ['Rejected', String(metrics.rejectedCount ?? 0)],
                ['Duplicates', String(metrics.duplicateCount ?? 0)],
                ['Unsupported', String(metrics.unsupportedCount ?? 0)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <SectionHeader
            eyebrow="Scanner devices"
            title="Device Allow-List"
            description="Future trusted scanners will appear here with health, environment, assignment, and approval metadata."
            badge="Foundation"
            badgeTone="blue"
          />
          <div className="space-y-4 p-4">
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
              <Cpu className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.8} />
              <p className="text-sm font-semibold text-foreground">No scanner devices registered yet</p>
              <p className="mx-auto mt-1 max-w-2xl text-sm text-muted-foreground">
                Device registration is disabled. Future paired scanners will be environment tagged and Admin/Owner approved before any bridge handshake is allowed.
              </p>
              <div className="mt-4 flex justify-center">
                <PlannedButton>Register Device</PlannedButton>
              </div>
            </div>
            <FieldChips fields={deviceFields} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <SectionHeader
            eyebrow="Bridge contracts"
            title="Readiness Checklist"
            description="Contract progress is visible for developers and future support without enabling transport."
            badge="Read-only"
            badgeTone="slate"
          />
          <div className="space-y-2 p-4">
            <ContractRow label="Runtime Contract" />
            <ContractRow label="Envelope Queue Contract" />
            <ContractRow label="Receipt Policy Contract" />
            <ContractRow label="Inbox Contract" />
            <ContractRow label="Local Service Health Handler" />
            <ContractRow label="Local Service Handoff Handler" />
            <ContractRow label="Duplicate Receipt Guard" />
            <ContractRow label="Network Transport Layer" state="future" />
            <ContractRow label="Device Handshake" state="future" />
            <ContractRow label="Activation" state="future" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CapabilityCard icon={RefreshCw} title="Queue Visibility" body="Reserved for future outbound envelopes, inbound receipts, retries, and failures. Phase 5 only stages validated handoff receipts in memory." badge="Foundation" />
        <CapabilityCard icon={ShieldCheck} title="Security / Device Trust" body="Trusted device, desktop identity, and environment checks are modeled for local service validation. No tokens are issued." badge="Foundation" />
        <CapabilityCard icon={Wifi} title="Transport Diagnostics" body="Reserved for ping, latency, bridge version, packet loss, and connection logs after local transport exists. No network listener is opened here." badge="Planned" />
      </section>

      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-4">
        <p className="mb-1 text-sm font-semibold text-foreground">Bridge guardrail</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sync & Devices is readiness-first. This tab does not pair hardware, open a network listener, call a scanner, test a connection, post StockMovement records, mutate Item Master, change prices, approve actions, or trigger Wastage, Markdown, Stocktake, Transfer, Receiving, POS, or ScanOps workflows.
        </p>
      </div>
    </div>
  );
}

function LabelsFoundation() {
  const printerFields = ['Printer', 'Type', 'Connection', 'Location', 'Label Sizes', 'Status', 'Last Seen', 'Fallback'];
  const templateRows = [
    { name: 'Markdown Price Label', note: 'Future markdown price and barcode label template.' },
    { name: 'Markdown Monitor Sheet', note: 'Future printable review/take-off sheet template.' },
    { name: 'Shelf Label', note: 'Future shelf-edge or bin label template.' },
    { name: 'Barcode Label', note: 'Future item barcode label template.' },
    { name: 'Expiry / Batch Label', note: 'Future expiry and batch support label template.' },
    { name: 'Transfer / Bin Label', status: 'Future', note: 'Later label support after transfer/bin workflows are stable.' },
  ];

  return (
    <div className="space-y-5">
      <Notice
        icon={Printer}
        title="Planned label and print administration only"
        body="This tab prepares printer and template governance. It does not print live labels, create barcode values, activate markdown label printing, or create printer jobs."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Printers" value="0" icon={Printer} tone="text-blue-600" />
        <StatCard label="Templates" value="0" icon={Tags} tone="text-violet-600" />
        <StatCard label="Warnings" value="0" icon={CircleAlert} tone="text-amber-600" />
        <StatCard label="Fallbacks" value="0" icon={ShieldCheck} tone="text-emerald-600" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          eyebrow="Print devices"
          title="Printer Profiles"
          description="Future portable and desktop printers will appear here with health, location, supported label sizes, and fallback rules."
          badge="Planned"
          badgeTone="amber"
        />
        <div className="space-y-4 p-4">
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
            <Printer className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.8} />
            <p className="text-sm font-semibold text-foreground">No printer profiles configured yet</p>
            <p className="mx-auto mt-1 max-w-2xl text-sm text-muted-foreground">
              Portable and desktop printers will be registered here later. Test print and printer discovery remain disabled until printer infrastructure is ready.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <PlannedButton>Add Printer</PlannedButton>
              <PlannedButton>Test Print</PlannedButton>
            </div>
          </div>
          <FieldChips fields={printerFields} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          eyebrow="Template governance"
          title="Label Templates"
          description="Template planning for markdown, shelf, barcode, expiry, and future bin/transfer labels."
          badge="Planned Config"
          badgeTone="blue"
        />
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
          {templateRows.map(row => <TemplateRow key={row.name} {...row} />)}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CapabilityCard icon={Barcode} title="Barcode Rules" body="Reserved for future barcode format rules, markdown prefixes, and uniqueness checks. No barcode creation is active." />
        <CapabilityCard icon={FileText} title="Reprint Policy" body="Reserved for future reprint approvals, audit notes, and controlled staff retry rules for labels." />
        <CapabilityCard icon={ShieldCheck} title="Print Fallbacks" body="Reserved for fallback printer selection, low-paper routing, offline queues, and failure handling after printer services exist." />
      </section>

      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-4">
        <p className="mb-1 text-sm font-semibold text-foreground">Label administration guardrail</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Labels & Printers is configuration only. This tab does not print live labels, create barcode values, mutate Markdown batches, change prices, create POS barcode rules, post StockMovement records, or activate scanner/printer hardware.
        </p>
      </div>
    </div>
  );
}

export default function DeviceLabelAdminFoundation({ mode }) {
  if (mode === 'labels') return <LabelsFoundation />;
  return <DevicesFoundation />;
}
