import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, CheckCircle, Tag, Printer, SkipForward, ArrowDownToLine } from 'lucide-react';
import ApproveBatchModal from './ApproveBatchModal';
import ProgressRoundModal from './ProgressRoundModal';
import PrintLabelModal from './PrintLabelModal';
import ReprintModal from './ReprintModal';
import RemoveFromFloorModal from './RemoveFromFloorModal';

export default function MarkdownBatchCard({ batch, onRefresh, statusStyle }) {
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState(null); // 'approve' | 'progress' | 'print' | 'reprint' | 'floor'
  const [rounds, setRounds] = useState(null);
  const [loadingRounds, setLoadingRounds] = useState(false);

  const st = statusStyle[batch.status] || 'bg-slate-100 text-slate-600 border-slate-200';
  const sellPct = batch.sell_through_pct || 0;
  const requestMetadata = batch.settings_snapshot?.request_metadata || {};
  const isManagerExceptionOverlay = Boolean(
    requestMetadata.exception_requires_manager ||
    requestMetadata.threshold_exceeded ||
    requestMetadata.manual_price_override ||
    batch.price_overlay_scope === 'CUSTOM_MANAGER_OVERLAY'
  );

  const loadRounds = async () => {
    if (rounds) return rounds;
    setLoadingRounds(true);
    const data = await base44.entities.MarkdownRound.filter({ batch_id: batch.id }, 'round_number', 10);
    setRounds(data || []);
    setLoadingRounds(false);
    return data || [];
  };

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadRounds();
  };

  const openModal = async (type) => {
    await loadRounds();
    setModal(type);
  };

  const activeRound = rounds?.find(r => r.status === 'Active');

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={handleExpand}
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
            <p className={`font-bold text-sm ${sellPct >= 80 ? 'text-green-700' : sellPct >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
              {sellPct.toFixed(1)}%
            </p>
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
          {/* Details grid */}
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
              { label: 'Price Scope', val: batch.price_overlay_scope ? String(batch.price_overlay_scope).replace(/_/g, ' ') : 'Expiry/date qty' },
              { label: 'Item Master Price', val: batch.item_master_price_mutated ? 'Changed' : 'Unchanged' },
            ].map(({ label, val }) => (
              <div key={label} className="bg-muted/40 rounded p-2">
                <p className="text-muted-foreground mb-0.5">{label}</p>
                <p className="font-semibold text-foreground">{val}</p>
              </div>
            ))}
          </div>

          {/* Active round info */}
          {loadingRounds && <p className="text-xs text-muted-foreground">Loading rounds…</p>}
          {activeRound && (
            <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-xs">
              <p className="font-semibold text-green-800 mb-1">Active Round {activeRound.round_number}</p>
              <div className="flex gap-4 text-green-700">
                <span>Price: ₱{activeRound.markdown_unit_price?.toFixed(2)}</span>
                <span>Discount: {activeRound.discount_percent?.toFixed(0)}%</span>
                <span>Expiry: {activeRound.expiry_date}</span>
                <span>Barcode: <span className="font-mono">{activeRound.markdown_barcode}</span></span>
                <span>Prints: {activeRound.print_count || 0}</span>
              </div>
            </div>
          )}
          {!loadingRounds && !activeRound && batch.status === 'Active' && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              No active round found. Round 1 is created during batch approval.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {batch.status === 'Pending_Approval' && (
              <button
                onClick={() => openModal('approve')}
                className="flex items-center gap-1.5 h-7 px-3 text-xs bg-green-600 text-white rounded hover:opacity-90"
              >
                <CheckCircle size={12} /> Approve Overlay
              </button>
            )}

            {batch.status === 'Active' && activeRound && (
              <>
                {isManagerExceptionOverlay ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-green-200 bg-green-50 text-green-700">
                    <CheckCircle size={12} /> Temporary price overlay active — closes on sold-out or expiry
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => openModal('print')}
                      disabled={activeRound.print_count > 0}
                      className="flex items-center gap-1.5 h-7 px-3 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-40"
                      title={activeRound.print_count > 0 ? 'Initial print done — use Reprint' : 'Print fallback label'}
                    >
                      <Printer size={12} /> Print Label
                    </button>
                    <button
                      onClick={() => openModal('reprint')}
                      className="flex items-center gap-1.5 h-7 px-3 text-xs border border-border rounded bg-card hover:bg-muted text-foreground"
                    >
                      <Printer size={12} /> Reprint
                    </button>
                  </>
                )}
                <button
                  onClick={() => openModal('progress')}
                  className="flex items-center gap-1.5 h-7 px-3 text-xs border border-border rounded bg-card hover:bg-muted text-foreground"
                >
                  <SkipForward size={12} /> Progress Round
                </button>
                <button
                  onClick={() => openModal('floor')}
                  className="flex items-center gap-1.5 h-7 px-3 text-xs border border-orange-200 rounded bg-orange-50 text-orange-700 hover:opacity-90"
                >
                  <ArrowDownToLine size={12} /> Remove from Floor
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === 'approve' && (
        <ApproveBatchModal batch={batch} onClose={() => setModal(null)} onDone={() => { setModal(null); setRounds(null); onRefresh(); }} />
      )}
      {modal === 'print' && activeRound && (
        <PrintLabelModal batch={batch} round={activeRound} onClose={() => setModal(null)} onDone={() => { setModal(null); setRounds(null); onRefresh(); }} />
      )}
      {modal === 'reprint' && activeRound && (
        <ReprintModal batch={batch} round={activeRound} onClose={() => setModal(null)} onDone={() => { setModal(null); setRounds(null); onRefresh(); }} />
      )}
      {modal === 'progress' && activeRound && (
        <ProgressRoundModal batch={batch} currentRound={activeRound} onClose={() => setModal(null)} onDone={() => { setModal(null); setRounds(null); onRefresh(); }} />
      )}
      {modal === 'floor' && (
        <RemoveFromFloorModal batch={batch} onClose={() => setModal(null)} onDone={() => { setModal(null); onRefresh(); }} />
      )}
    </div>
  );
}