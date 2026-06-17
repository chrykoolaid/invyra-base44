import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import DispositionModal from './DispositionModal';

export default function ReviewQueueEntry({ entry, batch, slaStatus, slaStyle, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);
  const sl = slaStyle[slaStatus];

  const hoursInQueue = entry.entered_review_at
    ? Math.floor((Date.now() - new Date(entry.entered_review_at).getTime()) / 3600000)
    : 0;

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
            <p className={`font-bold text-sm ${entry.variance_percent > 10 ? 'text-red-700' : entry.variance_percent > 5 ? 'text-amber-700' : 'text-foreground'}`}>
              {entry.variance_percent?.toFixed(1) ?? '0.0'}%
            </p>
            <p>Variance</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-sm">{hoursInQueue}h</p>
            <p>In Queue</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-sm">{entry.status.replace(/_/g, ' ')}</p>
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
              <p className="font-semibold text-foreground mb-1">Investigation Notes</p>
              <p className="text-muted-foreground">{entry.investigation_notes}</p>
            </div>
          )}

          {['Pending_Investigation', 'Supervisor_Ack', 'Manager_Auth', 'Ready_For_Disposition'].includes(entry.status) && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowDisposition(true)}
                className="flex items-center gap-1.5 h-8 px-4 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
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