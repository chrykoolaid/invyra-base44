import { useState } from 'react';
import { X } from 'lucide-react';

const SUPPLIERS = [
  'ChemSupply Co', 'CleanTex Distributors', 'PackPro Solutions',
  'LaundryChem Direct', 'SafetyFirst Supplies', 'HangerCo Wholesale', 'ProWash Ingredients',
];

// Workflow steps for a draft order
const flowSteps = ['Draft', 'Approved', 'Submitted'];

const urgencyStyle = {
  low:      'bg-green-50 text-green-700 border border-green-200',
  medium:   'bg-amber-50 text-amber-700 border border-amber-200',
  high:     'bg-red-50 text-red-700 border border-red-200',
  critical: 'bg-red-100 text-red-800 border border-red-300',
};

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

export default function OrderWorkspaceModal({ order, onClose }) {
  const [form, setForm] = useState({
    supplier:     order.supplier,
    expectedDate: order.expectedDate,
    notes:        order.notes,
  });

  const [approved,  setApproved]  = useState(false);
  const [rejected,  setRejected]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleApprove = () => { setApproved(true);  setRejected(false); };
  const handleReject  = () => { setRejected(true);  setApproved(false); };
  const handleSubmit  = () => { if (approved && !submitted) setSubmitted(true); };

  // Active step: Draft by default, Approved after approval, Submitted after submit
  const currentStep = submitted ? 'Submitted' : approved ? 'Approved' : 'Draft';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal window */}
      <div
        className="relative z-10 bg-background border border-border rounded-lg shadow-2xl flex flex-col"
        style={{ width: 'min(1060px, calc(100vw - 48px))', height: 'min(820px, calc(100vh - 48px))' }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold text-foreground">Draft Order Workspace</h2>
            <span className="text-sm font-mono text-muted-foreground">{order.orderNumber}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Workflow status strip ── */}
        <div className="flex items-center gap-0 px-8 py-2.5 border-b border-border bg-muted/20 flex-shrink-0">
          {flowSteps.map((step, i) => {
            const isActive = step === currentStep;
            const isDone   = flowSteps.indexOf(currentStep) > i;
            return (
              <div key={step} className="flex items-center">
                <span className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary border border-primary/20' :
                  isDone   ? 'text-muted-foreground/60 line-through' :
                             'text-muted-foreground/50'
                }`}>
                  {step}
                </span>
                {i < flowSteps.length - 1 && (
                  <span className="mx-2 text-muted-foreground/30 text-xs select-none">›</span>
                )}
              </div>
            );
          })}
          {/* Source context — right-aligned, subdued */}
          <span className="ml-auto text-xs text-muted-foreground/60">
            Source: <span className="font-medium">{order.sourceModule}</span>
          </span>
        </div>

        {/* ── Trigger / reason strip ── */}
        <div className="px-8 py-2.5 border-b border-border bg-amber-50/60 flex-shrink-0">
          <p className="text-xs text-amber-700">
            <span className="font-medium">Trigger:</span> {order.triggerReason}
            <span className="mx-2 opacity-40">·</span>
            <span className="font-medium">Urgency:</span>{' '}
            <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium ${urgencyStyle[order.urgency]}`}>
              {order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1)}
            </span>
          </p>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin">

          {/* Order Details */}
          <section>
            <SectionHeading>Order Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Supplier</label>
                <select
                  value={form.supplier}
                  onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                  className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Expected Date</label>
                <input
                  type="date"
                  value={form.expectedDate}
                  onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}
                  className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Created By</label>
                <div className="h-8 flex items-center text-sm text-foreground">{order.createdBy}</div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Created On</label>
                <div className="h-8 flex items-center text-sm text-foreground">{order.createdOn}</div>
              </div>
              {/* Notes — full width, clearly part of Order Details */}
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Add any notes for this order…"
                  className="w-full border border-border rounded px-2 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </section>

          {/* Why This Draft Exists */}
          <section>
            <SectionHeading>Why This Draft Exists</SectionHeading>
            <div className="grid grid-cols-3 gap-x-10 gap-y-4">
              {[
                { label: 'Source Module',       value: order.sourceModule },
                { label: 'Coverage Days',        value: order.coverageDays },
                { label: 'On Hand at Creation',  value: order.onHandAtCreation },
                { label: 'Trigger Reason',       value: order.triggerReason },
                { label: 'Urgency',              value: order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1) },
                { label: 'Suggested Qty',        value: order.suggestedQty },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-sm text-foreground font-medium">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {submitted && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-medium">
              Order submitted successfully.
            </div>
          )}
        </div>

        {/* ── Sticky footer command bar ── */}
        <div className="flex items-center px-8 py-3.5 border-t border-border bg-muted/10 flex-shrink-0 gap-2">
          <button
            onClick={handleReject}
            disabled={submitted}
            className={`h-8 px-4 text-sm rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              rejected
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-card border-border text-foreground hover:bg-muted'
            }`}
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={submitted}
            className={`h-8 px-4 text-sm rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              approved
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-card border-border text-foreground hover:bg-muted'
            }`}
          >
            Approve
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-border mx-2" />

          <span className="text-xs text-muted-foreground">
            {submitted ? 'Submitted' : approved ? 'Ready to submit' : rejected ? 'Marked for rejection' : 'Awaiting review decision'}
          </span>

          <button
            onClick={handleSubmit}
            disabled={!approved || submitted}
            className="h-8 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed ml-auto"
          >
            {submitted ? 'Submitted ✓' : 'Submit Order'}
          </button>
        </div>

      </div>
    </div>
  );
}