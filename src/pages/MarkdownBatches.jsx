import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, RefreshCw, Tag, ArrowLeft } from 'lucide-react';
import CreateMarkdownBatchModal from '@/components/markdown/CreateMarkdownBatchModal';
import MarkdownBatchCard from '@/components/markdown/MarkdownBatchCard';

const STATUS_FILTER_OPTIONS = ['All', 'Draft', 'Pending_Approval', 'Active', 'Review_Queue', 'Disposition_Complete', 'Recovered', 'Completed', 'Expired', 'Voided'];

const statusStyle = {
  Draft:                'bg-slate-100 text-slate-600 border-slate-200',
  Pending_Approval:     'bg-amber-50 text-amber-700 border-amber-200',
  Active:               'bg-green-50 text-green-700 border-green-200',
  Review_Queue:         'bg-orange-50 text-orange-700 border-orange-200',
  Disposition_Complete: 'bg-blue-50 text-blue-700 border-blue-200',
  Recovered:            'bg-purple-50 text-purple-700 border-purple-200',
  Completed:            'bg-green-50 text-green-700 border-green-200',
  Expired:              'bg-slate-100 text-slate-600 border-slate-200',
  Voided:               'bg-red-50 text-red-700 border-red-200',
};

export default function MarkdownBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.MarkdownBatch.filter({ environment: 'LIVE' }, '-created_date', 100);
    setBatches(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'All' ? batches : batches.filter(b => b.status === statusFilter);

  const counts = STATUS_FILTER_OPTIONS.reduce((acc, s) => {
    acc[s] = s === 'All' ? batches.length : batches.filter(b => b.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6">
      {showCreate && (
        <CreateMarkdownBatchModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Markdown Batches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{batches.length} total batches</p>
        </div>
        <div className="flex gap-2">
          <Link to="/Markdown" className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
            <ArrowLeft size={13} /> Back to Markdown
          </Link>
          <button onClick={load} className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            <Plus size={13} /> Manual Exception
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {STATUS_FILTER_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`h-7 px-3 text-xs rounded-full border font-medium transition-all ${
              statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {s.replace(/_/g, ' ')} {counts[s] > 0 && <span className="ml-1 opacity-60">({counts[s]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Loading batches…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card">
          <Tag size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No batches found</p>
          <p className="text-xs text-muted-foreground mt-1">ScanOps markdown requests and manual exception entries will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(batch => (
            <MarkdownBatchCard key={batch.id} batch={batch} onRefresh={load} statusStyle={statusStyle} />
          ))}
        </div>
      )}
    </div>
  );
}