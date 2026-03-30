import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Save, Undo2, X, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const initialRows = [
  {
    id: 'WE-2026-001',
    occurredAt: '29 Mar 2026, 09:20',
    recordedAt: '29 Mar 2026, 09:22',
    location: 'Main Store',
    sku: 'CHM-001',
    itemName: 'Premium Detergent 20L',
    qty: 2,
    reason: 'Spill',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'A. Manager',
    notes: 'Leaked during transfer.',
    currentOnHand: 18,
  },
  {
    id: 'WE-2026-002',
    occurredAt: '29 Mar 2026, 08:05',
    recordedAt: '29 Mar 2026, 08:09',
    location: 'Main Store',
    sku: 'PKG-003',
    itemName: 'Garment Tag Roll',
    qty: 1,
    reason: 'Damaged',
    source: 'ADMIN',
    status: 'APPROVED',
    recordedBy: 'S. Cruz',
    notes: 'Outer wrap torn during unloading.',
    currentOnHand: 57,
  },
  {
    id: 'WE-2026-003',
    occurredAt: '28 Mar 2026, 17:45',
    recordedAt: '28 Mar 2026, 17:52',
    location: 'Branch A',
    sku: 'CHM-005',
    itemName: 'Bleach 5L',
    qty: 4,
    reason: 'Expired',
    source: 'IMPORT',
    status: 'DRAFT',
    recordedBy: 'R. Santos',
    notes: 'Pending supervisor review.',
    currentOnHand: 24,
  },
  {
    id: 'WE-2026-004',
    occurredAt: '28 Mar 2026, 15:10',
    recordedAt: '28 Mar 2026, 15:16',
    location: 'Main Store',
    sku: 'SAFE-021',
    itemName: 'Disposable Gloves',
    qty: 12,
    reason: 'Production Use',
    source: 'POS',
    status: 'REVERSED',
    recordedBy: 'M. Lopez',
    notes: 'Reversed after duplicate count.',
    currentOnHand: 320,
  },
  {
    id: 'WE-2026-005',
    occurredAt: '28 Mar 2026, 11:28',
    recordedAt: '28 Mar 2026, 11:30',
    location: 'Branch A',
    sku: 'CHEM-009',
    itemName: 'Stain Remover 2L',
    qty: 3,
    reason: 'Damage in Handling',
    source: 'SCANNER',
    status: 'REJECTED',
    recordedBy: 'L. David',
    notes: 'Rejected due to incorrect SKU selection.',
    currentOnHand: 41,
  },
  {
    id: 'WE-2026-006',
    occurredAt: '27 Mar 2026, 18:40',
    recordedAt: '27 Mar 2026, 18:46',
    location: 'Main Store',
    sku: 'PKG-011',
    itemName: 'Laundry Bag Large',
    qty: 22,
    reason: 'Sampling/Promos',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'J. Reyes',
    notes: 'Promo bundle drawdown awaiting approval.',
    currentOnHand: 260,
  },
];

const statusStyle = {
  DRAFT: 'bg-muted text-muted-foreground border border-border',
  SUBMITTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  REVERSED: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const sourceOptions = ['ADMIN', 'SCANNER', 'POS', 'IMPORT'];
const reasonOptions = [
  'Damage in Handling',
  'Theft/Shrink',
  'Production Use',
  'Sampling/Promos',
  'Spillage',
  'Expired',
  'Damaged',
];

function SummaryCard({ label, value, tone = 'text-foreground' }) {
  return (
    <div className="border border-border rounded bg-card px-4 py-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function SectionCard({ label, children }) {
  return (
    <div className="border border-border rounded overflow-hidden bg-card">
      <div className="px-5 py-3 border-b border-border bg-muted/30">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, muted = false }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

export default function WastageWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const eventId = searchParams.get('event');

  const [rows, setRows] = useState(initialRows);
  const [actionStatus, setActionStatus] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reverseReason, setReverseReason] = useState('');
  const [formState, setFormState] = useState({
    location: 'Main Store',
    sku: '',
    itemName: '',
    qty: 1,
    reason: 'Damage in Handling',
    occurredAt: '30 Mar 2026, 20:45',
    source: 'ADMIN',
    notes: '',
    currentOnHand: '—',
  });

  const selectedEvent = useMemo(
    () => rows.find((row) => row.id === eventId) || null,
    [eventId, rows]
  );

  const workspaceStatus = selectedEvent?.status || 'CREATE';

  const stockEffectText = useMemo(() => {
    if (!selectedEvent) return 'No stock movement';
    if (selectedEvent.status === 'SUBMITTED') return 'Pending approval';
    if (selectedEvent.status === 'APPROVED') return 'Stock deducted';
    if (selectedEvent.status === 'REVERSED') return 'Stock restored';
    return 'No stock movement';
  }, [selectedEvent]);

  const handleFormChange = (field, value) => {
    setFormState((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'sku') {
        const match = rows.find((row) => row.sku.toLowerCase() === value.trim().toLowerCase());
        if (match) {
          next.itemName = match.itemName;
          next.currentOnHand = match.currentOnHand;
          next.location = match.location;
        }
      }

      return next;
    });
  };

  const updateEventStatus = (nextStatus, extraNotes = '') => {
    if (!selectedEvent) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === selectedEvent.id
          ? {
              ...row,
              status: nextStatus,
              notes: extraNotes ? `${row.notes}${row.notes ? ' ' : ''}${extraNotes}` : row.notes,
            }
          : row
      )
    );
  };

  const handleCreateAction = (nextStatus) => {
    setActionStatus(nextStatus === 'DRAFT' ? 'draft_saved' : 'submitted');
    setTimeout(() => navigate('/Wastage'), 500);
  };

  const handleApprove = () => {
    updateEventStatus('APPROVED');
    setActionStatus('approved');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    updateEventStatus('REJECTED', `Rejection reason: ${rejectReason.trim()}.`);
    setRejectOpen(false);
    setActionStatus('rejected');
    setRejectReason('');
  };

  const handleReverse = () => {
    if (!reverseReason.trim()) return;
    updateEventStatus('REVERSED', `Reversal reason: ${reverseReason.trim()}.`);
    setReverseOpen(false);
    setActionStatus('reversed');
    setReverseReason('');
  };

  const handleDraftUpdate = (nextStatus) => {
    updateEventStatus(nextStatus);
    setActionStatus(nextStatus === 'DRAFT' ? 'draft_saved' : 'submitted');
  };

  if (mode !== 'create' && !selectedEvent) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/Wastage')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} /> Back to Wastage
        </button>
        <p className="text-sm text-muted-foreground">Wastage event not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 p-6 max-w-[900px] pb-28">
          <button
            onClick={() => navigate('/Wastage')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Wastage
          </button>

          {mode === 'create' ? (
            <>
              <div className="mb-5">
                <h1 className="text-lg font-semibold text-foreground mb-1">Record Wastage</h1>
                <p className="text-sm text-muted-foreground">Create a wastage record for review or submission.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <SummaryCard label="Location" value={formState.location || 'Select location'} />
                <SummaryCard label="Selected SKU" value={formState.sku || 'Not selected'} tone={formState.sku ? 'text-foreground' : 'text-muted-foreground'} />
                <SummaryCard label="Current On Hand" value={String(formState.currentOnHand)} tone={formState.currentOnHand === '—' ? 'text-muted-foreground' : 'text-foreground'} />
              </div>

              <SectionCard label="Wastage Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Location</label>
                    <select
                      value={formState.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      className="h-9 w-full border border-border rounded bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option>Main Store</option>
                      <option>Branch A</option>
                      <option>Branch B</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">SKU Search</label>
                    <Input
                      value={formState.sku}
                      onChange={(e) => handleFormChange('sku', e.target.value)}
                      placeholder="Enter SKU code"
                    />
                  </div>
                  <div className="md:col-span-2 border border-border rounded bg-muted/20 px-3 py-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Item Preview</p>
                    <p className="text-sm text-foreground font-medium">{formState.itemName || 'Select or type a matching SKU to preview the item.'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Qty</label>
                    <Input
                      type="number"
                      min={1}
                      value={formState.qty}
                      onChange={(e) => handleFormChange('qty', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason Code</label>
                    <select
                      value={formState.reason}
                      onChange={(e) => handleFormChange('reason', e.target.value)}
                      className="h-9 w-full border border-border rounded bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {reasonOptions.map((reason) => (
                        <option key={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Occurred At</label>
                    <Input
                      value={formState.occurredAt}
                      onChange={(e) => handleFormChange('occurredAt', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Source</label>
                    <select
                      value={formState.source}
                      onChange={(e) => handleFormChange('source', e.target.value)}
                      className="h-9 w-full border border-border rounded bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {sourceOptions.map((source) => (
                        <option key={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Notes</label>
                    <Textarea
                      rows={4}
                      value={formState.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      placeholder="Optional operational notes..."
                    />
                  </div>
                </div>
              </SectionCard>

              <p className="text-xs text-muted-foreground mt-4 px-1">Draft records do not adjust stock until approved.</p>
            </>
          ) : (
            <>
              <div className="mb-5">
                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <h1 className="text-lg font-semibold text-foreground">Event {selectedEvent.id}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[selectedEvent.status]}`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <SummaryCard label="Qty" value={selectedEvent.qty} />
                <SummaryCard label="Location" value={selectedEvent.location} />
                <SummaryCard
                  label="Stock Effect"
                  value={stockEffectText}
                  tone={selectedEvent.status === 'APPROVED' ? 'text-green-700' : selectedEvent.status === 'SUBMITTED' ? 'text-amber-700' : 'text-muted-foreground'}
                />
              </div>

              <div className="space-y-4">
                <SectionCard label="Event Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Event ID" value={selectedEvent.id} />
                    <DetailRow label="Status" value={selectedEvent.status} />
                    <DetailRow label="Occurred At" value={selectedEvent.occurredAt} muted />
                    <DetailRow label="Recorded At" value={selectedEvent.recordedAt} muted />
                    <DetailRow label="Location" value={selectedEvent.location} />
                    <DetailRow label="SKU" value={selectedEvent.sku} muted />
                    <DetailRow label="Item Name" value={selectedEvent.itemName} />
                    <DetailRow label="Qty" value={String(selectedEvent.qty)} />
                    <DetailRow label="Reason Code" value={selectedEvent.reason} />
                    <DetailRow label="Source" value={selectedEvent.source} muted />
                    <div className="md:col-span-2">
                      <DetailRow label="Notes" value={selectedEvent.notes || 'No notes provided.'} muted={!selectedEvent.notes} />
                    </div>
                    <DetailRow label="Recorded By" value={selectedEvent.recordedBy} muted />
                  </div>
                </SectionCard>

                <SectionCard label="Workflow Timeline">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">Created</span>
                      <span className="text-muted-foreground">{selectedEvent.recordedAt}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`font-medium ${['SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED'].includes(selectedEvent.status) ? 'text-foreground' : 'text-muted-foreground'}`}>Submitted</span>
                      <span className="text-muted-foreground">{['SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED'].includes(selectedEvent.status) ? selectedEvent.recordedAt : 'Pending'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`font-medium ${selectedEvent.status === 'APPROVED' ? 'text-green-700' : 'text-muted-foreground'}`}>Approved</span>
                      <span className="text-muted-foreground">{selectedEvent.status === 'APPROVED' ? 'Posted to stock movement' : 'Not approved'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`font-medium ${selectedEvent.status === 'REJECTED' ? 'text-red-700' : 'text-muted-foreground'}`}>Rejected</span>
                      <span className="text-muted-foreground">{selectedEvent.status === 'REJECTED' ? 'Rejected with reason logged' : 'Not rejected'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`font-medium ${selectedEvent.status === 'REVERSED' ? 'text-slate-700' : 'text-muted-foreground'}`}>Reversed</span>
                      <span className="text-muted-foreground">{selectedEvent.status === 'REVERSED' ? 'Opposite movement posted' : 'Not reversed'}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard label="Stock Impact">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailRow label="Current On Hand" value={String(selectedEvent.currentOnHand)} />
                    {selectedEvent.status === 'SUBMITTED' ? (
                      <>
                        <DetailRow label="Adjustment on Approval" value={`-${selectedEvent.qty}`} muted />
                        <DetailRow label="Projected On Hand" value={String(selectedEvent.currentOnHand - selectedEvent.qty)} />
                      </>
                    ) : selectedEvent.status === 'APPROVED' ? (
                      <>
                        <DetailRow label="Stock Deducted" value={`-${selectedEvent.qty}`} muted />
                        <DetailRow label="Resulting On Hand" value={String(selectedEvent.currentOnHand - selectedEvent.qty)} />
                      </>
                    ) : selectedEvent.status === 'REVERSED' ? (
                      <>
                        <DetailRow label="Restored Qty" value={`+${selectedEvent.qty}`} muted />
                        <DetailRow label="Restored On Hand" value={String(selectedEvent.currentOnHand)} />
                      </>
                    ) : (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">This event has not adjusted stock yet.</p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>

        <div className="fixed bottom-0 left-56 right-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3 z-10">
          {actionStatus === 'draft_saved' && (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1.5">
              <Save size={13} /> Draft saved
            </span>
          )}
          {actionStatus === 'submitted' && (
            <span className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
              <AlertTriangle size={13} /> Event submitted for approval
            </span>
          )}
          {actionStatus === 'approved' && (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Wastage approved — stock adjustment posted
            </span>
          )}
          {actionStatus === 'rejected' && (
            <span className="text-xs text-red-700 font-medium flex items-center gap-1.5">
              <X size={13} /> Wastage rejected
            </span>
          )}
          {actionStatus === 'reversed' && (
            <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
              <Undo2 size={13} /> Wastage reversed
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <button
                  onClick={() => navigate('/Wastage')}
                  className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={() => handleCreateAction('DRAFT')}
                  className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  onClick={() => handleCreateAction('SUBMITTED')}
                  className="flex items-center gap-2 h-10 px-6 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  <CheckCircle2 size={14} /> Save &amp; Submit
                </button>
              </>
            ) : workspaceStatus === 'DRAFT' ? (
              <>
                <button
                  onClick={() => navigate('/Wastage')}
                  className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={() => handleDraftUpdate('DRAFT')}
                  className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  onClick={() => handleDraftUpdate('SUBMITTED')}
                  className="flex items-center gap-2 h-10 px-6 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  <CheckCircle2 size={14} /> Submit
                </button>
              </>
            ) : workspaceStatus === 'SUBMITTED' ? (
              <>
                <button
                  onClick={() => setRejectOpen(true)}
                  className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <X size={14} /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 h-10 px-6 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
              </>
            ) : workspaceStatus === 'APPROVED' ? (
              <button
                onClick={() => setReverseOpen(true)}
                className="flex items-center gap-2 h-10 px-6 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                <Undo2 size={14} /> Reverse
              </button>
            ) : (
              <button
                onClick={() => navigate('/Wastage')}
                className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
              >
                <ArrowLeft size={14} /> Back to Wastage
              </button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Wastage Event</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting this submitted wastage event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reverseOpen} onOpenChange={setReverseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse Approved Wastage</AlertDialogTitle>
            <AlertDialogDescription>
              Reversing this event will restore on-hand quantity through an opposite stock movement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
            placeholder="Reversal reason"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReverseReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReverse();
              }}
            >
              Confirm Reversal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
