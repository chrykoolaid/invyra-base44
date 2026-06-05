import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function ErrorRecoveryManager() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedError, setSelectedError] = useState(null);

  const loadErrors = async () => {
    setLoading(true);
    const data = await base44.entities.IntegrationErrorQueue.list('-created_date', 100);
    setErrors(data || []);
    setLoading(false);
  };

  useEffect(() => { loadErrors(); }, []);

  const retryError = async (error) => {
    await base44.entities.IntegrationErrorQueue.update(error.id, {
      status: 'retry_queued',
      retry_count: (error.retry_count || 0) + 1,
      next_retry_at: new Date(Date.now() + 60000).toISOString(),
    });
    loadErrors();
  };

  const resolveError = async (error, notes) => {
    await base44.entities.IntegrationErrorQueue.update(error.id, {
      status: 'resolved',
      resolution_notes: notes,
      resolved_by: 'admin',
      resolved_at: new Date().toISOString(),
    });
    setSelectedError(null);
    loadErrors();
  };

  const filtered = errors.filter(e => filter === 'all' ? true : e.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Error Recovery Queue</h2>
          <p className="text-xs text-muted-foreground mt-1">Failed syncs awaiting retry or manual intervention</p>
        </div>
        <button onClick={loadErrors} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-border hover:bg-muted disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['pending', 'retry_queued', 'manual_review', 'resolved'].map(st => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
              filter === st
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading errors…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-green-600 text-sm">✓ No errors in this queue</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((err) => (
            <div key={err.id} className="rounded-xl border border-border bg-card p-3 cursor-pointer hover:bg-accent/30" onClick={() => setSelectedError(selectedError?.id === err.id ? null : err)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-foreground">{err.sync_type}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">{err.error_type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{err.error_message}</p>
                  <p className="text-xs text-muted-foreground mt-1">Retries: {err.retry_count} • Created {new Date(err.created_date).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {err.status === 'retry_queued' && <Clock size={14} className="text-amber-600" />}
                  {err.status === 'resolved' && <CheckCircle2 size={14} className="text-green-600" />}
                </div>
              </div>

              {selectedError?.id === err.id && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <textarea
                    placeholder="Resolution notes…"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    defaultValue={err.resolution_notes || ''}
                    onChange={(e) => setSelectedError({...selectedError, resolution_notes: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => retryError(err)} className="flex-1 text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium">
                      Retry Now
                    </button>
                    <button onClick={() => resolveError(err, selectedError.resolution_notes)} className="flex-1 text-xs px-3 py-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-medium">
                      Mark Resolved
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}