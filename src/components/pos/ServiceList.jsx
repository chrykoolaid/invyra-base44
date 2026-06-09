import { Plus } from 'lucide-react';

const CATEGORY_COLORS = {
  'Wash & Dry':  'bg-blue-50 text-blue-700 border-blue-200',
  'Dry Clean':   'bg-violet-50 text-violet-700 border-violet-200',
  'Pressing':    'bg-amber-50 text-amber-700 border-amber-200',
  'Specialty':   'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function ServiceList({ services, selectedId, onSelect, onAdd }) {
  const grouped = services.reduce((acc, s) => {
    const cat = s.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">Services</p>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-medium"
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.keys(grouped).length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No services yet. Add your first service.
          </div>
        )}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">{cat}</p>
            <div className="space-y-1">
              {items.map(svc => {
                const colorClass = CATEGORY_COLORS[svc.category] || 'bg-muted text-muted-foreground border-border';
                return (
                  <button
                    key={svc.id}
                    onClick={() => onSelect(svc)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                      selectedId === svc.id
                        ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30'
                        : 'bg-card border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{svc.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">₱{(svc.base_price || 0).toFixed(2)}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${colorClass}`}>
                        {svc.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}