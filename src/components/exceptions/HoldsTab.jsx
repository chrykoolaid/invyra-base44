import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { Lock, Plus, RefreshCw, CheckCircle2, ArrowUpRight, Package } from 'lucide-react';
import PlaceHoldModal from './PlaceHoldModal';
import EscalateToWastageModal from './EscalateToWastageModal';

const statusStyle = {
  ACTIVE:    'bg-red-50 text-red-700 border-red-200',
  RELEASED:  'bg-green-50 text-green-700 border-green-200',
  ESCALATED: 'bg-purple-50 text-purple-700 border-purple-200',
};

const reasonStyle = {
  'Supplier Recall':               'bg-red-50 text-red-700 border-red-200',
  'Contamination Concern':         'bg-orange-50 text-orange-700 border-orange-200',
  'Damaged — Awaiting Decision':   'bg-amber-50 text-amber-700 border-amber-200',
  'Expired — Blocked from Sale':   'bg-amber-50 text-amber-700 border-amber-200',
  'Batch Under Investigation':     'bg-blue-50 text-blue-700 border-blue-200',
  'Do-Not-Sell Manager Hold':      'bg-red-50 text-red-700 border-red-200',
  'Other':                         'bg-slate-100 text-slate-600 border-slate-200',
};

function fmt(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function HoldsTab() {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');
  const [showModal, setShowModal] = useState(false);
  const [escalateHold, setEscalateHold] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [releaseNotes, setReleaseNotes] = useState({});

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.ItemHold.filter(envFilter(), '-created_date', 300);
    setHolds(rows || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRelease = async (hold) => {
    setActioning(hold.id);
    const user = await base44.auth.me();
    await base44.entities.ItemHold.update(hold.id, {
      status: 'RELEASED',
      reviewed_by: user?.email || '',
      reviewed_at: new Date().toISOString(),
      release_notes: releaseNotes[hold.id] || '',
    });
    await load();
    setActioning(null);
  };

  const filtered = filter === 'ALL' ? holds : holds.filter(h => h.status === filter);

  const counts = {
    ACTIVE:    holds.filter(h => h.status === 'ACTIVE').length,
    RELEASED:  holds.filter(h => h.status === 'RELEASED').length,
    ESCALATED: holds.filter(h => h.status === 'ESCALATED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Holds / Quarantine</h2>
            <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
              Phase 3 — Escalation Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Block unsafe or disputed stock from visibility without writing it off. No stock movement is posted until a governed decision is made.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded border border-border hover:bg-muted transition-colors text-muted-foreground">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
            <Plus size={13} /> Place Hold
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Holds', value: counts.ACTIVE, tone: 'text-red-600' },
          { label: 'Released', value: counts.RELEASED, tone: 'text-green-600' },
          { label: 'Escalated', value: counts.ESCALATED, tone: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {['ACTIVE', 'RELEASED', 'ESCALATED', 'ALL'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`h-8 px-3 text-xs font-medium border-b-2 transition-colors ${
              filter === f ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Hold list */}
      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading holds…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center space-y-2">
          <Package size={24} className="mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No {filter !== 'ALL' ? filter.toLowerCase() : ''} holds.</p>
          <p className="text-xs text-muted-foreground">Use "Place Hold" to quarantine stock under investigation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(hold => (
            <div key={hold.id}
              className={`rounded-xl border bg-card px-4 py-3 space-y-2.5 ${hold.status !== 'ACTIVE' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{hold.item_name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{hold.sku}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyle[hold.status]}`}>
                      {hold.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${reasonStyle[hold.hold_reason] || reasonStyle['Other']}`}>
                      {hold.hold_reason}
                    </span>
                    {hold.batch_number && (
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        Batch: {hold.batch_number}
                      </span>
                    )}
                    {hold.location_name && (
                      <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {hold.location_name}
                      </span>
                    )}
                    {hold.qty_on_hold && (
                      <span className="text-xs text-muted-foreground">Qty: <strong className="text-foreground">{hold.qty_on_hold}</strong></span>
                    )}
                  </div>
                  {hold.hold_notes && <p className="text-xs text-muted-foreground italic">{hold.hold_notes}</p>}
                  <p className="text-[11px] text-muted-foreground">
                    Placed by {hold.placed_by_name || hold.placed_by || '—'} · {fmt(hold.placed_at)}
                    {hold.reviewed_at && ` · Reviewed ${fmt(hold.reviewed_at)}`}
                  </p>
                </div>

                {hold.status === 'ACTIVE' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRelease(hold)}
                      disabled={actioning === hold.id}
                      className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                      <CheckCircle2 size={11} /> Release
                    </button>
                    <button
                      onClick={() => setEscalateHold(hold)}
                      disabled={actioning === hold.id}
                      className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50">
                      <ArrowUpRight size={11} /> Escalate
                    </button>
                  </div>
                )}
              </div>

              {/* Inline release notes input for active holds */}
              {hold.status === 'ACTIVE' && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={releaseNotes[hold.id] || ''}
                    onChange={e => setReleaseNotes(p => ({ ...p, [hold.id]: e.target.value }))}
                    placeholder="Release notes (optional)…"
                    className="flex-1 h-7 border border-border rounded px-2.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-800">
        <strong>Phase 3 — Escalation:</strong> Use <strong>Escalate</strong> to send a held item directly to a Wastage Draft. The hold is marked ESCALATED and the wastage record enters the normal supervisor approval workflow before any stock is deducted.
      </div>

      {showModal && (
        <PlaceHoldModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}

      {escalateHold && (
        <EscalateToWastageModal
          hold={escalateHold}
          onClose={() => setEscalateHold(null)}
          onEscalated={() => { setEscalateHold(null); load(); }}
        />
      )}
    </div>
  );
}