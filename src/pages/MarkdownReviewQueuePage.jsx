import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ClipboardList, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import ReviewQueueEntry from '@/components/markdown/ReviewQueueEntry';

const SLA_STATUS = (entry) => {
  const now = new Date();
  if (!entry.deadline_warning_at) return 'ok';
  if (now >= new Date(entry.deadline_critical_at)) return 'critical';
  if (now >= new Date(entry.deadline_escalation_at)) return 'escalation';
  if (now >= new Date(entry.deadline_warning_at)) return 'warning';
  return 'ok';
};

const slaStyle = {
  ok:         { label: 'On Time',    bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  warning:    { label: 'Warning',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  escalation: { label: 'Escalation', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  critical:   { label: 'CRITICAL',   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
};

export default function MarkdownReviewQueuePage() {
  const [entries, setEntries] = useState([]);
  const [batches, setBatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    const [queueData, batchData] = await Promise.all([
      base44.entities.MarkdownReviewQueue.filter({ environment: 'LIVE' }, '-entered_review_at', 100),
      base44.entities.MarkdownBatch.filter({ environment: 'LIVE' }, '-created_date', 200),
    ]);
    const batchMap = {};
    (batchData || []).forEach(b => { batchMap[b.id] = b; });
    setBatches(batchMap);
    setEntries(queueData || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const open = entries.filter(e => !['Disposition_Complete', 'Recovered'].includes(e.status));
  const criticalCount = open.filter(e => SLA_STATUS(e) === 'critical').length;

  const filtered = statusFilter === 'All' ? open : open.filter(e => e.status === statusFilter);

  const statusOptions = ['All', 'Pending_Investigation', 'Supervisor_Ack', 'Manager_Auth', 'Ready_For_Disposition'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Review Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{open.length} open entries</p>
        </div>
        <div className="flex gap-2">
          <Link to="/Markdown" className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
            <ArrowLeft size={13} /> Back to Markdown
          </Link>
          <button onClick={load} className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {criticalCount > 0 && (
        <div className="mb-5 p-4 rounded-lg border border-red-200 bg-red-50 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{criticalCount} CRITICAL review entries overdue</p>
            <p className="text-xs text-red-600 mt-0.5">These batches have exceeded the 96-hour critical threshold. No automatic action will occur — Manager confirmation required.</p>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap mb-5">
        {statusOptions.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`h-7 px-3 text-xs rounded-full border font-medium transition-all ${
              statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Loading review queue…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card">
          <ClipboardList size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No entries in Review Queue</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(entry => (
            <ReviewQueueEntry
              key={entry.id}
              entry={entry}
              batch={batches[entry.batch_id]}
              slaStatus={SLA_STATUS(entry)}
              slaStyle={slaStyle}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}