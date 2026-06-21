import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, X, Copy, ChevronDown } from 'lucide-react';

export default function AlertLifecycleActions({ alert, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const doAction = async (action) => {
    setLoading(true);
    setOpen(false);
    try {
      const user = await base44.auth.me();
      const actor = user?.email || user?.full_name || 'unknown';
      const now = new Date().toISOString();

      if (action === 'acknowledge') {
        await base44.functions.invoke('acknowledgeStockOutAlert', { alert_id: alert.id, acknowledged_by: actor });
      } else if (action === 'resolve') {
        await base44.functions.invoke('resolveStockOutAlert', { alert_id: alert.id, resolved_by: actor });
      } else if (action === 'dedupe') {
        await base44.functions.invoke('dedupeStockOutAlert', { alert_id: alert.id, deduped_by: actor });
      }
      onUpdated();
    } catch (err) {
      console.error('Alert action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const status = alert.status;

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="h-8 px-3 text-xs font-medium rounded-lg bg-white border border-border hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-40"
      >
        {loading ? 'Working…' : 'Actions'} <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
            {status === 'OPEN' && (
              <button
                onClick={() => doAction('acknowledge')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 text-amber-700"
              >
                <CheckCircle2 size={12} /> Acknowledge
              </button>
            )}
            {(status === 'OPEN' || status === 'ACKNOWLEDGED') && (
              <button
                onClick={() => doAction('resolve')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 text-emerald-700"
              >
                <CheckCircle2 size={12} /> Mark Resolved
              </button>
            )}
            {status === 'OPEN' && (
              <button
                onClick={() => doAction('dedupe')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 text-muted-foreground"
              >
                <Copy size={12} /> Mark Duplicate
              </button>
            )}
            {!['OPEN', 'ACKNOWLEDGED'].includes(status) && (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">No actions available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}