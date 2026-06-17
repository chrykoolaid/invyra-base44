import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Printer, RefreshCw, Download } from 'lucide-react';

const statusStyle = {
  Active:               { dot: 'bg-green-500',  label: 'Active' },
  Pending_Approval:     { dot: 'bg-amber-400',  label: 'Pending Approval' },
  Review_Queue:         { dot: 'bg-orange-500', label: 'Review Queue' },
  Disposition_Complete: { dot: 'bg-blue-500',   label: 'Disposed' },
  Recovered:            { dot: 'bg-purple-500', label: 'Recovered' },
  Voided:               { dot: 'bg-red-500',    label: 'Voided' },
};

export default function MarkdownMonitor() {
  const [batches, setBatches] = useState([]);
  const [rounds, setRounds] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState(null);
  const printRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const [batchData, roundData] = await Promise.all([
      base44.entities.MarkdownBatch.filter({ environment: 'LIVE' }, '-created_date', 200),
      base44.entities.MarkdownRound.filter({ environment: 'LIVE' }, '-created_date', 500),
    ]);
    const roundMap = {};
    (roundData || []).forEach(r => {
      if (!roundMap[r.batch_id]) roundMap[r.batch_id] = [];
      roundMap[r.batch_id].push(r);
    });
    setBatches(batchData || []);
    setRounds(roundMap);
    setGeneratedAt(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeBatches = batches.filter(b => ['Active', 'Review_Queue', 'Pending_Approval'].includes(b.status));

  const handlePrint = () => {
    window.print();
  };

  const sellThroughColor = (pct) => {
    if (pct >= 80) return 'text-green-700';
    if (pct >= 50) return 'text-amber-700';
    return 'text-red-700';
  };

  const expiryColor = (dateStr) => {
    if (!dateStr) return 'text-muted-foreground';
    const today = new Date().toISOString().slice(0, 10);
    const diff = Math.ceil((new Date(dateStr) - new Date(today)) / 86400000);
    if (diff < 0) return 'text-red-700 font-bold';
    if (diff <= 1) return 'text-red-600 font-semibold';
    if (diff <= 3) return 'text-amber-600 font-medium';
    return 'text-foreground';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Printable Monitor Sheet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeBatches.length} active batches
            {generatedAt && ` — generated ${generatedAt.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            <Printer size={13} /> Print / Export
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="print:p-0">
        {/* Print header */}
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-foreground">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Markdown Monitor Sheet</h1>
              <p className="text-sm text-muted-foreground">Invyra Laundry Operations</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Generated: {generatedAt ? generatedAt.toLocaleString() : '—'}</p>
              <p>Active Batches: {activeBatches.length}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading monitor data…</div>
        ) : activeBatches.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card print:border-solid">
            <p className="text-sm text-muted-foreground">No active markdown batches</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden print:rounded-none print:border-black">
            <table className="w-full text-sm">
              <thead className="bg-muted print:bg-slate-100">
                <tr className="text-xs uppercase tracking-wide text-muted-foreground print:text-black">
                  <th className="text-left px-4 py-3 font-semibold">Batch Ref</th>
                  <th className="text-left px-4 py-3 font-semibold">Item</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Round</th>
                  <th className="text-right px-4 py-3 font-semibold">Allocated</th>
                  <th className="text-right px-4 py-3 font-semibold">Remaining</th>
                  <th className="text-right px-4 py-3 font-semibold">Sold</th>
                  <th className="text-right px-4 py-3 font-semibold">Sell-Through</th>
                  <th className="text-right px-4 py-3 font-semibold">Price</th>
                  <th className="text-right px-4 py-3 font-semibold">Expiry</th>
                  <th className="text-left px-4 py-3 font-semibold">Barcode</th>
                </tr>
              </thead>
              <tbody>
                {activeBatches.map((batch, i) => {
                  const batchRounds = rounds[batch.id] || [];
                  const activeRound = batchRounds.find(r => r.status === 'Active') || batchRounds[batchRounds.length - 1];
                  const st = statusStyle[batch.status] || { dot: 'bg-slate-400', label: batch.status };
                  const sellPct = batch.sell_through_pct || 0;

                  return (
                    <tr key={batch.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'} print:bg-white`}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{batch.batch_ref || batch.id.slice(-8)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{batch.item_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{batch.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot} print:hidden`} />
                          <span className="text-xs font-medium text-foreground print:text-black">{st.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">R{batch.current_round_number || 1}</td>
                      <td className="px-4 py-3 text-right text-foreground">{(batch.allocated_qty || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{(batch.current_remaining_qty || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-foreground">{(batch.sold_qty || 0).toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-bold ${sellThroughColor(sellPct)} print:text-black`}>
                        {sellPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {activeRound ? `₱${activeRound.markdown_unit_price?.toFixed(2)}` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm ${expiryColor(activeRound?.expiry_date)} print:text-black`}>
                        {activeRound?.expiry_date || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground print:text-black">
                        {activeRound?.markdown_barcode || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted print:bg-slate-100">
                <tr className="text-xs text-muted-foreground print:text-black">
                  <td colSpan={4} className="px-4 py-3 font-semibold">TOTALS</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground print:text-black">
                    {activeBatches.reduce((s, b) => s + (b.allocated_qty || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground print:text-black">
                    {activeBatches.reduce((s, b) => s + (b.current_remaining_qty || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground print:text-black">
                    {activeBatches.reduce((s, b) => s + (b.sold_qty || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan={4} className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block *, [ref] * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          body { margin: 0; padding: 16px; }
        }
      `}</style>
    </div>
  );
}