import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Minus } from 'lucide-react';

function getStockTier(item) {
  const stock = item.stock ?? 0;
  const rp = item.reorder_point;
  if (rp == null) return 'no-rp';
  if (stock <= 0) return 'out';
  if (stock <= rp) return 'critical';
  if (stock <= rp * 1.5) return 'low';
  return 'ok';
}

const TIER_CONFIG = {
  out:      { label: 'Out of Stock',   color: 'bg-red-500',    text: 'text-white',           border: 'border-red-600',     badgeBg: 'bg-red-50 border-red-200 text-red-700'    },
  critical: { label: 'At Reorder',     color: 'bg-orange-400', text: 'text-white',           border: 'border-orange-500',  badgeBg: 'bg-orange-50 border-orange-200 text-orange-700' },
  low:      { label: 'Near Reorder',   color: 'bg-amber-300',  text: 'text-amber-900',       border: 'border-amber-400',   badgeBg: 'bg-amber-50 border-amber-200 text-amber-700'  },
  ok:       { label: 'Healthy',        color: 'bg-emerald-400',text: 'text-emerald-950',     border: 'border-emerald-500', badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  'no-rp':  { label: 'No Reorder Set', color: 'bg-slate-200',  text: 'text-slate-600',       border: 'border-slate-300',   badgeBg: 'bg-slate-50 border-slate-200 text-slate-600'  },
};

export default function ReorderHeatmap({ items }) {
  const { tiers, hotItems } = useMemo(() => {
    const buckets = { out: [], critical: [], low: [], ok: [], 'no-rp': [] };
    items.forEach(item => buckets[getStockTier(item)].push(item));
    const hotItems = [...buckets.out, ...buckets.critical, ...buckets.low].slice(0, 12);
    return { tiers: buckets, hotItems };
  }, [items]);

  const urgentCount = tiers.out.length + tiers.critical.length + tiers.low.length;
  if (urgentCount === 0 && tiers['no-rp'].length === items.length) return null;

  return (
    <div className="mb-4 border border-border rounded-xl bg-card overflow-hidden">
      {/* Header summary bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/20 flex-wrap">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Stock Health</span>
        <div className="flex items-center gap-1 flex-wrap">
          {Object.entries(TIER_CONFIG)
            .filter(([key]) => key !== 'no-rp' || tiers['no-rp'].length > 0)
            .map(([key, cfg]) => tiers[key].length > 0 && (
              <span key={key} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeBg}`}>
                {tiers[key].length} {cfg.label}
              </span>
            ))}
        </div>
        {urgentCount > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-red-600 font-medium">
            <AlertTriangle size={12} /> {urgentCount} item{urgentCount !== 1 ? 's' : ''} need attention
          </span>
        )}
      </div>

      {/* Proportional heatmap bar */}
      <div className="flex h-2.5 w-full">
        {Object.entries(tiers).map(([key, group]) => {
          if (!group.length) return null;
          const pct = (group.length / items.length) * 100;
          return (
            <div
              key={key}
              className={`${TIER_CONFIG[key].color} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${group.length} ${TIER_CONFIG[key].label}`}
            />
          );
        })}
      </div>

      {/* Hot items grid — only shown when urgent items exist */}
      {hotItems.length > 0 && (
        <div className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">Needs Attention</p>
          <div className="flex flex-wrap gap-1.5">
            {hotItems.map(item => {
              const tier = getStockTier(item);
              const cfg = TIER_CONFIG[tier];
              const stock = item.stock ?? 0;
              return (
                <div
                  key={item.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${cfg.badgeBg}`}
                  title={`${item.name} · Stock: ${stock} · Reorder at: ${item.reorder_point}`}
                >
                  {tier === 'out' && <AlertCircle size={10} />}
                  {tier === 'critical' && <AlertTriangle size={10} />}
                  {tier === 'low' && <Minus size={10} />}
                  <span className="truncate max-w-[120px]">{item.name}</span>
                  <span className="opacity-70 font-mono">{stock}</span>
                </div>
              );
            })}
            {(tiers.out.length + tiers.critical.length + tiers.low.length) > 12 && (
              <span className="text-xs text-muted-foreground self-center">
                +{(tiers.out.length + tiers.critical.length + tiers.low.length) - 12} more…
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}