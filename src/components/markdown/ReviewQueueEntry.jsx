import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import DispositionModal from './DispositionModal';

/**
 * Explicit workflow buttons for the Review Queue governance chain:
 *   Pending_Investigation → [Supervisor Ack] → Supervisor_Ack
 *   Supervisor_Ack        → [Manager Auth]   → Manager_Auth     (if high variance)
 *   Supervisor_Ack /
 *   Manager_Auth          → [Mark Ready]     → Ready_For_Disposition
 *   Ready_For_Disposition → [Disposition]    → opens DispositionModal
 */

const WORKFLOW = {
  Pending_Investigation: {
    label: 'Acknowledge Variance',
    icon: CheckCircle,
    color: 'bg-amber-600 text-white hover:opacity-90',
    fn: 'acknowledgeReviewVariance',
    payloadKey: 'investigation_notes',
    noteLabel: 'Investigation notes (optional)',
  },
  Supervisor_Ack: {
    label: 'Manager Authorize',
    icon: ShieldCheck,
    color: 'bg-orange-600 text-white hover:opacity-90',
    fn: 'authorizeReviewQueue',
    payloadKey: 'authorization_notes',
    noteLabel: 'Authorization notes (optional)',
  },
  Manager_Auth: {
    label: 'Mark Ready for Disposition',
    icon: ArrowRight,
    color: 'bg-primary text-primary-foreground hover:opacity-90',
    fn: 'markReadyForDisposition',
    payloadKey: 'ready_notes',
    noteLabel: 'Ready notes (optional)',
  },
};

// Supervisor_Ack can go directly to Ready when variance is low (fn allows it)
const SUPERVISOR_CAN_MARK_READY_DIRECTLY = true;

export default function ReviewQueueEntry({ entry, batch, slaStatus, slaStyle, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const sl = slaStyle[slaStatus];

  const hoursInQueue = entry.entered_review_at
    ? Math.floor((Date.now() - new Date(entry.entered_review_at).getTime()) / 3600000)
    : 0;

  const handleWorkflowAction = async (fnName, notesKey) => {
    setWorking(true);
    setError('');
    const res = await base44.functions.invoke(fnName, {
      review_queue_id: entry.id,
      [notesKey]: notes,
    });
    setWorking(false);
    if (res.data?.success) {
      setNotes('');
      onRefresh();
    } else {
      setError(res.data?.error || 'Action failed.');
    }
  };

  // Determine which workflow step applies
  const workflowStep = WORKFLOW[entry.status];
  const canDispose = entry.status === 'Ready_For_Disposition';

  // For Supervisor_Ack: also show "Mark Ready" directly if variance is low
  const showMarkReadyFromSupervisorAck =
    entry.status === 'Supervisor_Ack' && SUPERVISOR_CAN_MARK_READY_DIRECTLY;

  return (
    <div className={`border rounded-lg overflow-hidden ${sl.border} ${sl.bg}`}>
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setExpanded(e => !e)}
      >
        <AlertTriangle size={15} className={`flex-shrink-0 ${sl.text}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sl.border} ${sl.text} bg-white/60`}>
              {sl.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{batch?.batch_ref || entry.batch_id?.slice(-8)}</span>
          </div>
          <p className="text-sm font-medium text-foreground mt-0.5">{batch?.item_name || 'Unknown item'}</p>
        </div>

        <div className="hidden md:flex items-center gap-5 text-xs text-muted-foreground">
          <div className="text-center">
            <p className={`font-bold text-sm ${(entry.variance_percent || 0) > 10 ? 'text-red-700' : (entry.variance_percent || 0) > 5 ? 'text-amber-700' : 'text-foreground'}`}>
              {entry.variance_percent?.toFixed(1) ?? '0.0'}%
            </p>
            <p>Variance</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-sm">{hoursInQueue}h</p>
            <p>In Queue</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-sm truncate max-w-[90px]">{entry.status.replace(/_/g, ' ')}</p>
            <p>Status</p>
          </div>
        </div>

        {expanded ? <ChevronUp size={15} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={15} className="text-muted-foreground flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-current/20 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Expected Qty', val: entry.expected_remaining_qty },
              { label: 'Actual Count', val: entry.actual_floor_count ?? '—' },
              { label: 'Variance Qty', val: entry.variance_qty ?? '—' },
              { label: 'Variance %', val: `${entry.variance_percent?.toFixed(2) ?? '0'}%` },
              { label: 'Entered Queue', val: entry.entered_review_at ? new Date(entry.entered_review_at).toLocaleString() : '—' },
              { label: 'Warning At', val: entry.deadline_warning_at ? new Date(entry.deadline_warning_at).toLocaleString() : '—' },
              { label: 'Escalation At', val: entry.deadline_escalation_at ? new Date(entry.deadline_escalation_at).toLocaleString() : '—' },
              { label: 'Critical At', val: entry.deadline_critical_at ? new Date(entry.deadline_critical_at).toLocaleString() : '—' },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/50 rounded p-2">
                <p className="text-muted-foreground mb-0.5">{label}</p>
                <p className="font-semibold text-foreground">{val}</p>
              </div>
            ))}
          </div>

          {entry.investigation_notes && (
            <div className="p-3 rounded bg-white/50 text-xs">
              <p className="font-semibold text-foreground mb-1">Notes</p>
              <p className="text-muted-foreground whitespace-pre-line">{entry.investigation_notes}</p>
            </div>
          )}

          {/* Governance workflow action */}
          {workflowStep && !canDispose && (
            <div className="space-y-2 border border-current/20 rounded-lg p-3 bg-white/40">
              <p className="text-xs font-semibold text-foreground">Next Step: {workflowStep.label}</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={workflowStep.noteLabel}
                rows={2}
                className="w-full border border-border rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              {error && <p className="text-xs text-red-700">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => handleWorkflowAction(workflowStep.fn, workflowStep.payloadKey)}
                  disabled={working}
                  className={`flex items-center gap-1.5 h-7 px-3 text-xs rounded font-medium disabled:opacity-50 ${workflowStep.color}`}
                >
                  <workflowStep.icon size={12} />
                  {working ? 'Processing…' : workflowStep.label}
                </button>

                {/* Supervisor_Ack: also offer Mark Ready directly (for low-variance batches) */}
                {showMarkReadyFromSupervisorAck && (
                  <button
                    onClick={() => handleWorkflowAction('markReadyForDisposition', 'ready_notes')}
                    disabled={working}
                    className="flex items-center gap-1.5 h-7 px-3 text-xs rounded font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    <ArrowRight size={12} /> Mark Ready
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Disposition trigger */}
          {canDispose && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowDisposition(true)}
                className="flex items-center gap-1.5 h-8 px-4 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 font-medium"
              >
                <CheckCircle size={12} /> Confirm Disposition
              </button>
            </div>
          )}
        </div>
      )}

      {showDisposition && (
        <DispositionModal
          reviewEntry={entry}
          batch={batch}
          onClose={() => setShowDisposition(false)}
          onConfirmed={() => { setShowDisposition(false); onRefresh(); }}
        />
      )}
    </div>
  );
}