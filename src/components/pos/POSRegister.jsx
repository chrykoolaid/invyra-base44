import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Minus, Trash2, ShoppingBag, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

const CATEGORY_COLORS = {
  'Wash & Dry':  'bg-blue-50 text-blue-700 border-blue-200',
  'Dry Clean':   'bg-violet-50 text-violet-700 border-violet-200',
  'Pressing':    'bg-amber-50 text-amber-700 border-amber-200',
  'Specialty':   'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function POSRegister({ services, inventoryItems }) {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [cart, setCart] = useState([]); // [{ service, qty }]
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { success, results } or { error }
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    base44.entities.Site.filter({ is_active: true }, 'name', 50).then(rows => {
      setSites(rows || []);
      if (rows?.length > 0) setSelectedSiteId(rows[0].id);
    });
  }, []);

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))];

  const filteredServices = filterCategory === 'All'
    ? services
    : services.filter(s => s.category === filterCategory);

  const addToCart = (svc) => {
    setCart(prev => {
      const existing = prev.find(c => c.service.id === svc.id);
      if (existing) return prev.map(c => c.service.id === svc.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { service: svc, qty: 1 }];
    });
  };

  const updateQty = (serviceId, delta) => {
    setCart(prev => prev
      .map(c => c.service.id === serviceId ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
      .filter(c => c.qty > 0)
    );
  };

  const removeFromCart = (serviceId) => {
    setCart(prev => prev.filter(c => c.service.id !== serviceId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.service.base_price || 0) * c.qty, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setResult(null);

    const sales = cart.map(c => ({
      service_id: c.service.id,
      qty_sold: c.qty,
      site_id: selectedSiteId,
    }));

    const res = await base44.functions.invoke('deductServiceInventory', { sales });
    setResult(res.data);
    setSubmitting(false);

    if (res.data?.success) {
      setCart([]);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCart([]);
  };

  if (result?.success) {
    const deducted = result.results?.flatMap(r => r.deductions || []) || [];
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">Sale Recorded</p>
          <p className="text-sm text-muted-foreground mt-1">₱{cartTotal > 0 ? cartTotal.toFixed(2) : '—'} · Stock deducted and posted to ledger</p>
        </div>
        {deducted.length > 0 && (
          <div className="w-full max-w-sm rounded-xl border border-border bg-muted/30 divide-y divide-border">
            {deducted.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-foreground font-medium">{d.item_name}</span>
                <span className="text-muted-foreground font-mono">−{d.deducted} → {d.balance_after} left</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          <RotateCcw size={15} /> New Sale
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_300px] h-full divide-x divide-border">
      {/* Left: Service catalogue */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Site selector + category filter */}
        <div className="px-4 py-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium shrink-0">Site:</label>
            <select
              value={selectedSiteId}
              onChange={e => setSelectedSiteId(e.target.value)}
              className="h-8 flex-1 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {sites.length === 0 && <option value="">No sites configured</option>}
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`shrink-0 h-7 px-3 rounded-full text-xs font-medium border transition-colors ${
                  filterCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Service grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredServices.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No services available.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredServices.map(svc => {
                const colorClass = CATEGORY_COLORS[svc.category] || 'bg-muted text-muted-foreground border-border';
                const inCart = cart.find(c => c.service.id === svc.id);
                return (
                  <button
                    key={svc.id}
                    onClick={() => addToCart(svc)}
                    className={`text-left rounded-xl border p-3 transition-all hover:shadow-sm active:scale-[0.98] ${
                      inCart ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${colorClass}`}>
                        {svc.category}
                      </span>
                      {inCart && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
                          ×{inCart.qty}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{svc.name}</p>
                    <p className="text-base font-bold text-primary mt-1">₱{(svc.base_price || 0).toFixed(2)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart / order summary */}
      <div className="flex flex-col h-full bg-muted/20">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShoppingBag size={15} /> Order Summary
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tap a service to add it to the order
            </div>
          ) : (
            cart.map(({ service: svc, qty }) => (
              <div key={svc.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold text-foreground leading-snug">{svc.name}</p>
                  <button
                    onClick={() => removeFromCart(svc.id)}
                    className="text-muted-foreground hover:text-destructive p-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(svc.id, -1)}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{qty}</span>
                    <button
                      onClick={() => updateQty(svc.id, 1)}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-foreground">₱{((svc.base_price || 0) * qty).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border space-y-3">
          {result?.error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle size={13} /> {result.error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">₱{cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={cart.length === 0 || submitting || !selectedSiteId}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {submitting ? 'Processing…' : 'Complete Sale & Deduct Stock'}
          </button>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="w-full h-8 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted"
            >
              Clear Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}