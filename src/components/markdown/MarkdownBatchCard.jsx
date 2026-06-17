import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, CheckCircle, Tag } from 'lucide-react';

export default function MarkdownBatchCard({ batch, onRefresh, statusStyle }) {
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);

  const st = statusStyle[batch.status] || 'bg-slate-100 text-slate-600 border-slate-200';
  const sellPct = batch.sell_through_pct || 0;

  const handleApprove = async () => {
    setApproving(true);
    await base44.functions.invoke('approveMarkdownBatch', { batch_id: batch.id });
    setApproving(false);
    onRefresh();
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <Tag size={15} className="text-primary flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">{batch.batch_ref || batch.id.slice(-8)}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${st}`}>
              {batch.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-foreground mt-0.5 truncate">{batch.item_name}</p>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
          <div className="text-center">
            <p className="font-bold text-foreground text-sm">{batch.current_remaining_qty ?? 0}</p>
            <p>Remaining</p>
          </div>
          <div className="text-center">
            <p className={`font-bold text-sm ${sellPct >= 80 ? 'text-green-700' : sellPct >= 50 ? 'text-amber-700' : 'text-red-700'}`}>{sellPct.toFixed(1)}%</p>
            <p>Sell-Through</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-sm">R{batch.current_round_number || 1}</p>
            <p>Round</p>
          </div>
        </div>

        {expanded ? <ChevronUp size={15} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={15} className="text-muted-foreground flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'SKU', val: batch.sku },
              { label: 'Allocated', val: batch.allocated_qty },
              { label: 'Sold', val: batch.sold_qty || 0 },
              { label: 'Disposed', val: batch.disposed_qty || 0 },
              { label: 'Recovered', val: batch.recovered_qty || 0 },
              { label: 'Removed from Floor', val: batch.removed_from_floor_qty || 0 },
              { label: 'Initiated By', val: batch.initiated_by || '—' },
              { label: 'Approved By', val: batch.approved_by || 'Pending' },
            ].map(({ label, val }) => (
              <div key={label} className="bg-muted/40 rounded p-2">
                <p className="text-muted-foreground mb-0.5">{label}</p>
                <p className="font-semibold text-foreground">{val}</p>
              </div>
            ))}
          </div>

          {batch.status === 'Pending_Approval' && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
              <p className="text-xs text-amber-700">Awaiting Supervisor/Manager approval before labels can be printed.</p>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-1.5 h-7 px-3 text-xs bg-green-600 text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle size={12} /> {approving ? 'Approving…' : 'Approve'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}