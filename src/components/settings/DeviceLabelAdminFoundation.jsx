import { Barcode, CircleAlert, Cpu, FileText, Lock, Printer, RefreshCw, Server, ShieldCheck, Smartphone, Tags, Wifi } from 'lucide-react';

const badgeStyles = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
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

function FieldChips({ fields }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Planned columns</p>
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

function DevicesFoundation() {
  const deviceFields = ['Device', 'Type', 'Module', 'Location', 'Environment', 'Status', 'Last Seen', 'Approved By'];

  return (
    <div className="space-y-5">
      <Notice
        icon={ShieldCheck}
        title="Planned admin foundation only"
        body="This tab prepares the scanner/device admin home. It does not pair real hardware, activate local sync, process scanner intake, or write inventory records."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Paired" value="0" icon={Smartphone} tone="text-blue-600" />
        <StatCard label="Online" value="0" icon={Wifi} tone="text-emerald-600" />
        <StatCard label="Needs Review" value="0" icon={CircleAlert} tone="text-amber-600" />
        <StatCard label="Disabled" value="0" icon={Lock} tone="text-slate-500" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Planned infrastructure</p>
            <h3 className="text-sm font-semibold text-foreground">Local Sync Bridge</h3>
            <p className="mt-1 text-sm text-muted-foreground">Reserved for future local scanner bridge configuration.</p>
          </div>
          <Badge label="Planned" tone="amber" />
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-border bg-background px-4 py-4 text-sm">
            {[
              ['Status', 'Planned'],
              ['Network mode', 'Local Wi-Fi / IP'],
              ['Endpoint', 'Not configured'],
              ['Environment aware', 'LIVE / TRAINING / TEST'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-4">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <Server className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
            </div>
            <p className="mb-1 text-sm font-semibold text-foreground">Bridge actions are disabled</p>
            <p className="mb-3 text-sm text-muted-foreground">Configuration and connection testing remain locked until the local bridge contract is built.</p>
            <div className="flex flex-wrap gap-2">
              <PlannedButton>Configure Bridge</PlannedButton>
              <PlannedButton>Test Connection</PlannedButton>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Device trust</p>
            <h3 className="text-sm font-semibold text-foreground">Device Allow-List</h3>
            <p className="mt-1 text-sm text-muted-foreground">Future scanners will appear here with health, environment, assignment, and approval metadata.</p>
          </div>
          <Badge label="Foundation" tone="blue" />
        </div>
        <div className="space-y-4 p-4">
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
            <Cpu className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.8} />
            <p className="text-sm font-semibold text-foreground">No paired devices yet</p>
            <p className="mx-auto mt-1 max-w-2xl text-sm text-muted-foreground">
              Future paired scanners will appear here with device health, assigned module, assigned location, environment tag, last seen, and approval status.
            </p>
            <div className="mt-4 flex justify-center">
              <PlannedButton>Add Device</PlannedButton>
            </div>
          </div>
          <FieldChips fields={deviceFields} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CapabilityCard icon={RefreshCw} title="Sync Inbox Policy" body="Reserved for future sync inbox rules, conflict handling, duplicate event handling, and offline replay policy. No queue processing is active here." />
        <CapabilityCard icon={Cpu} title="Device Pairing" body="Reserved for future Admin/Owner device approval, disable, archive, and environment tagging. No real pairing is active." />
        <CapabilityCard icon={Wifi} title="Device Health" body="Reserved for last seen, online/offline, warning, and needs-review state after a trusted device service exists." />
      </section>

      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-4">
        <p className="mb-1 text-sm font-semibold text-foreground">Device administration guardrail</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sync & Devices is configuration only. This tab does not pair real hardware, activate sync, process scanner intake, post StockMovement records, mutate Item Master, or trigger Wastage, Markdown, Stocktake, Transfer, Receiving, or ScanOps workflows.
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
        <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Print devices</p>
            <h3 className="text-sm font-semibold text-foreground">Printer Profiles</h3>
            <p className="mt-1 text-sm text-muted-foreground">Future portable and desktop printers will appear here with health, location, supported label sizes, and fallback rules.</p>
          </div>
          <Badge label="Planned" tone="amber" />
        </div>
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
        <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Template governance</p>
            <h3 className="text-sm font-semibold text-foreground">Label Templates</h3>
            <p className="mt-1 text-sm text-muted-foreground">Template planning for markdown, shelf, barcode, expiry, and future bin/transfer labels.</p>
          </div>
          <Badge label="Planned Config" tone="blue" />
        </div>
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
