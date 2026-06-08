import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, CheckCircle2, RotateCcw, Send, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const FLAG_CONFIG = {
  ok:       { label: 'OK',       bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300' },
  low:      { label: 'Low',      bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300' },
  critical: { label: 'Critical', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300' },
};

function getFlag(item) {
  const stock = item.count ?? item.stock ?? 0;
  if (!item.reorder_point) return 'ok';
  if (stock <= 0) return 'critical';
  if (stock <= item.reorder_point) return 'critical';
  if (stock <= item.reorder_point * 1.5) return 'low';
  return 'ok';
}

export default function GapScanFloor() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [activeInput, setActiveInput] = useState(null);
  const searchRef = useRef(null);

  const loadItems = async () => {
    setLoading(true);
    const data = await base44.entities.InventoryItem.filter({ is_active: true }, 'name', 200);
    setItems((data || []).map(item => ({ ...item, count: null, dirty: false })));
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const updateCount = (id, val) => {
    setItems(prev => prev.map(it =>
      it.id === id ? { ...it, count: val === '' ? null : Math.max(0, Number(val)), dirty: true } : it
    ));
  };

  const increment = (id) => {
    setItems(prev => prev.map(it =>
      it.id === id ? { ...it, count: Math.max(0, (it.count ?? it.stock ?? 0) + 1), dirty: true } : it
    ));
  };

  const decrement = (id) => {
    setItems(prev => prev.map(it =>
      it.id === id ? { ...it, count: Math.max(0, (it.count ?? it.stock ?? 0) - 1), dirty: true } : it
    ));
  };

  const resetItem = (id) => {
    setItems(prev => prev.map(it =>
      it.id === id ? { ...it, count: null, dirty: false } : it
    ));
  };

  const dirtyItems = items.filter(i => i.dirty && i.count !== null);

  const handleSubmit = async () => {
    if (dirtyItems.length === 0) return;
    setSubmitting(true);

    const user = await base44.auth.me();
    const postedBy = user?.email || user?.full_name || 'Staff';

    for (const item of dirtyItems) {
      const systemStock = item.stock ?? 0;
      const newCount = item.count;
      const diff = newCount - systemStock;

      if (diff === 0) continue;

      const ref = `GS-${Date.now().toString(36).toUpperCase()}`;
      const direction = diff > 0 ? 'IN' : 'OUT';

      await base44.entities.InventoryItem.update(item.id, { stock: newCount });
      await base44.entities.StockMovement.create({
        site_id: item.site_id || '',
        item_id: item.id,
        sku: item.sku,
        item_name: item.name,
        movement_type: 'ADJUST',
        direction,
        qty: Math.abs(diff),
        balance_after: newCount,
        source_ref: ref,
        source_type: 'MANUAL',
        notes: `Gap scan floor count`,
        status: 'POSTED',
        posted_by: postedBy,
      });
    }

    setSavedCount(dirtyItems.length);
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setSavedCount(0);
    loadItems();
  };

  const filtered = items.filter(it => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q);
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Scan Complete</h2>
        <p className="text-muted-foreground mb-1">{savedCount} item count{savedCount !== 1 ? 's' : ''} submitted</p>
        <p className="text-sm text-muted-foreground mb-8">Stock levels and inventory ledger updated.</p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 h-14 px-8 text-base rounded-2xl bg-primary text-primary-foreground font-semibold"
        >
          <RotateCcw size={18} /> Start New Scan
        </button>
        <Link to="/GapScan" className="mt-4 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Gap Scan
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/GapScan" className="flex items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Floor Scan</p>
          <p className="text-xs text-muted-foreground">
            {dirtyItems.length > 0 ? `${dirtyItems.length} item${dirtyItems.length !== 1 ? 's' : ''} counted` : 'Tap an item to enter count'}
          </p>
        </div>
        {dirtyItems.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 h-10 px-5 text-sm rounded-xl bg-primary text-primary-foreground font-semibold shrink-0 disabled:opacity-50"
          >
            <Send size={14} />
            {submitting ? 'Saving…' : `Submit (${dirtyItems.length})`}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 sticky top-[61px] z-10 bg-background border-b border-border">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search item or SKU…"
            className="w-full h-11 pl-9 pr-9 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 px-3 pt-2 pb-24 space-y-2">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading items…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No items found</div>
        ) : (
          filtered.map(item => {
            const systemStock = item.stock ?? 0;
            const displayCount = item.count ?? systemStock;
            const isDirty = item.dirty;
            const flag = getFlag({ ...item });
            const cfg = FLAG_CONFIG[flag];
            const diff = isDirty ? (item.count ?? 0) - systemStock : null;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  isDirty ? `${cfg.border} ${cfg.bg}` : 'border-border bg-card'
                }`}
              >
                {/* Item header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-base leading-tight">{item.name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isDirty && (
                      <button onClick={() => resetItem(item.id)} className="text-muted-foreground hover:text-foreground p-1">
                        <RotateCcw size={14} />
                      </button>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* System stock reference */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-xs text-muted-foreground">
                    System: <span className="font-mono font-semibold text-foreground">{systemStock} {item.unit || 'units'}</span>
                  </div>
                  {item.reorder_point && (
                    <div className="text-xs text-muted-foreground">
                      Reorder at: <span className="font-mono font-semibold text-foreground">{item.reorder_point}</span>
                    </div>
                  )}
                  {isDirty && diff !== null && diff !== 0 && (
                    <div className={`text-xs font-bold ml-auto ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </div>
                  )}
                </div>

                {/* Count controls */}
                <div className="flex items-center gap-3">
                  <button
                    onPointerDown={() => decrement(item.id)}
                    className="w-14 h-14 rounded-xl bg-muted hover:bg-muted/70 active:scale-95 transition-all flex items-center justify-center text-2xl font-bold text-foreground select-none"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={0}
                    value={activeInput === item.id ? (item.count ?? '') : displayCount}
                    onFocus={() => setActiveInput(item.id)}
                    onBlur={() => setActiveInput(null)}
                    onChange={e => updateCount(item.id, e.target.value)}
                    className={`flex-1 h-14 rounded-xl border-2 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                      isDirty ? `${cfg.border} ${cfg.bg} ${cfg.text}` : 'border-border bg-background text-foreground'
                    }`}
                  />

                  <button
                    onPointerDown={() => increment(item.id)}
                    className="w-14 h-14 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all flex items-center justify-center text-2xl font-bold select-none"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky footer submit */}
      {dirtyItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 safe-area-bottom">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={18} />
            {submitting ? 'Saving counts…' : `Submit ${dirtyItems.length} count${dirtyItems.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}