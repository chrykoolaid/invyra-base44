import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tag, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

/**
 * MarkdownSalePanel
 * Allows staff to scan/select a markdown barcode, validate it, and post the sale.
 * Wires validateMarkdownPOSSale → postMarkdownSale.
 */
export default function MarkdownSalePanel({ siteId }) {
  const [batches, setBatches] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [qty, setQty] = useState(1);
  const [validation, setValidation] = useState(null); // null | { sale_allowed, checks, ... }
  const [validating, setValidating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.MarkdownBatch.filter({ status: 'Active', environment: 'LIVE' }, '-created_date', 50)
      .then(data => setBatches(data || []));
  }, []);

  const handleBatchSelect = async (batchId) => {
    const batch = batches.find(b => b.id === batchId) || null;
    setSelectedBatch(batch);
    setSelectedRound(null);
    setValidation(null);
    setBarcodeInput('');
    if (!batchId) { setRounds([]); return; }
    const data = await base44.entities.MarkdownRound.filter({ batch_id: batchId, status: 'Active' }, 'round_number', 10);
    setRounds(data || []);
    if (data?.length === 1) setSelectedRound(data[0]);
  };

  const handleValidate = async () => {
    if (!selectedBatch || !selectedRound) { setError('Select a batch and round first.'); return; }
    setValidating(true);
    setError('');
    setValidation(null);
    const res = await base44.functions.invoke('validateMarkdownPOSSale', {
      markdown_batch_id: selectedBatch.id,
      markdown_round_id: selectedRound.id,
      markdown_barcode_scanned: barcodeInput || selectedRound.markdown_barcode,
      markdown_price_offered: selectedRound.markdown_unit_price,
      qty_requested: qty,
      environment: 'LIVE',
    });
    setValidating(false);
    if (res.data) {
      setValidation(res.data);
    } else {
      setError('Validation call failed.');
    }
  };

  const handlePostSale = async () => {
    if (!validation?.sale_allowed) return;
    setPosting(true);
    setError('');
    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    const res = await base44.functions.invoke('postMarkdownSale', {
      markdown_batch_id: selectedBatch.id,
      markdown_round_id: selectedRound.id,
      markdown_barcode_scanned: barcodeInput || selectedRound.markdown_barcode,
      qty,
      unit_price: selectedRound.markdown_unit_price,
      pos_transaction_id: txId,
      site_id: siteId || '',
      environment: 'LIVE',
    });
    setPosting(false);
    if (res.data?.success) {
      setResult({ ...res.data, batch: selectedBatch, round: selectedRound, qty, txId });
    } else {
      setError(res.data?.error || 'Sale posting failed.');
    }
  };

  const handleReset = () => {
    setSelectedBatch(null);
    setSelectedRound(null);
    setRounds([]);
    setBarcodeInput('');
    setQty(1);
    setValidation(null);
    setResult(null);
    setError('');
  };

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">Markdown Sale Posted</p>
          <p className="text-sm text-muted-foreground mt-1">
            {result.batch.item_name} · R{result.round.round_number} · ₱{result.round.markdown_unit_price?.toFixed(2)} × {result.qty}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Remaining: {result.new_remaining_qty} | Sell-through: {result.sell_through_pct?.toFixed(1)}%</p>
        </div>
        <button onClick={handleReset} className="flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
          <RotateCcw size={15} /> New Markdown Sale
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Tag size={15} className="text-primary" /> Markdown Sale
      </div>

      {/* Batch selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Markdown Batch</label>
        <select
          value={selectedBatch?.id || ''}
          onChange={e => handleBatchSelect(e.target.value)}
          className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select batch…</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>
              {b.batch_ref} — {b.item_name} ({b.current_remaining_qty} remaining)
            </option>
          ))}
        </select>
      </div>

      {/* Round selector */}
      {rounds.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Round</label>
          <select
            value={selectedRound?.id || ''}
            onChange={e => setSelectedRound(rounds.find(r => r.id === e.target.value) || null)}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select round…</option>
            {rounds.map(r => (
              <option key={r.id} value={r.id}>
                Round {r.round_number} — ₱{r.markdown_unit_price?.toFixed(2)} (exp: {r.expiry_date})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Active round info */}
      {selectedRound && (
        <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-xs text-green-800 grid grid-cols-2 gap-2">
          <div><span className="block font-semibold">Price</span>₱{selectedRound.markdown_unit_price?.toFixed(2)}</div>
          <div><span className="block font-semibold">Discount</span>{selectedRound.discount_percent?.toFixed(0)}%</div>
          <div><span className="block font-semibold">Expiry</span>{selectedRound.expiry_date}</div>
          <div><span className="block font-semibold">Barcode</span><span className="font-mono">{selectedRound.markdown_barcode}</span></div>
        </div>
      )}

      {/* Barcode input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scanned Barcode</label>
        <input
          value={barcodeInput}
          onChange={e => { setBarcodeInput(e.target.value); setValidation(null); }}
          placeholder={selectedRound?.markdown_barcode || 'Scan or enter barcode'}
          className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
        />
        <p className="text-[11px] text-muted-foreground">Leave blank to use round's barcode.</p>
      </div>

      {/* Qty */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity</label>
        <div className="flex items-center gap-2">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center text-lg font-bold">−</button>
          <span className="w-12 text-center text-lg font-bold text-foreground">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center text-lg font-bold">+</button>
        </div>
      </div>

      {/* Validation result */}
      {validation && (
        <div className={`p-3 rounded-lg border text-xs space-y-1 ${validation.sale_allowed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`font-semibold ${validation.sale_allowed ? 'text-green-800' : 'text-red-700'}`}>
            {validation.sale_allowed ? '✓ Sale Allowed' : '✗ Sale Blocked'}
          </p>
          {validation.checks?.filter(c => !c.passed).map((c, i) => (
            <p key={i} className="text-red-600">✗ {c.check}: {c.reason}</p>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <button
          onClick={handleValidate}
          disabled={!selectedBatch || !selectedRound || validating}
          className="w-full h-10 rounded-xl border border-primary text-primary text-sm font-semibold disabled:opacity-40 hover:bg-primary/5"
        >
          {validating ? 'Validating…' : '① Validate Sale'}
        </button>
        <button
          onClick={handlePostSale}
          disabled={!validation?.sale_allowed || posting}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:opacity-90"
        >
          {posting ? 'Posting…' : '② Post Markdown Sale'}
        </button>
      </div>
    </div>
  );
}