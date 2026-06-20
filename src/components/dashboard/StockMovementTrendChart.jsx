import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const MOVEMENT_TYPES = [
  { key: 'RECEIVE',      label: 'Receiving',   color: '#34d399' },
  { key: 'ADJUST',       label: 'Adjustments', color: '#60a5fa' },
  { key: 'WASTE',        label: 'Wastage',     color: '#f87171' },
  { key: 'TRANSFER_IN',  label: 'Transfer In', color: '#a78bfa' },
  { key: 'TRANSFER_OUT', label: 'Transfer Out','color': '#fb923c' },
  { key: 'STOCKTAKE',   label: 'Stocktake',   color: '#facc15' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 shadow-lg">
      <p className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
      {payload.map(p => (
        p.value > 0 && (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs text-slate-300 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-slate-400">{p.name}:</span>
            <span className="font-semibold">{p.value} movements</span>
          </div>
        )
      ))}
    </div>
  );
};

export default function StockMovementTrendChart({ stockMovements }) {
  const [hiddenKeys, setHiddenKeys] = useState(new Set());

  const chartData = useMemo(() => {
    const days = 30;
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      const key = format(d, 'MMM d');
      buckets[key] = { date: key };
      MOVEMENT_TYPES.forEach(t => { buckets[key][t.key] = 0; });
    }

    stockMovements.forEach(m => {
      if (!m.created_date) return;
      const d = startOfDay(new Date(m.created_date));
      const key = format(d, 'MMM d');
      if (buckets[key] && m.movement_type && buckets[key][m.movement_type] !== undefined) {
        buckets[key][m.movement_type] += 1;
      }
    });

    return Object.values(buckets);
  }, [stockMovements]);

  const toggleKey = (key) => {
    setHiddenKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Summary counts for the last 30 days
  const totals = useMemo(() => {
    const counts = {};
    MOVEMENT_TYPES.forEach(t => { counts[t.key] = 0; });
    stockMovements.forEach(m => {
      if (counts[m.movement_type] !== undefined) counts[m.movement_type] += 1;
    });
    return counts;
  }, [stockMovements]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/60">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.22em]">
          Stock Movement Trends — Last 30 Days
        </span>
        <span className="text-[10px] text-slate-600">All locations · by movement type</span>
      </div>

      {/* Legend / filter pills */}
      <div className="flex flex-wrap gap-2 px-4 pt-3">
        {MOVEMENT_TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => toggleKey(t.key)}
            className={`flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[10px] font-semibold transition-all ${
              hiddenKeys.has(t.key)
                ? 'border-slate-700 bg-transparent text-slate-600'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: hiddenKeys.has(t.key) ? '#475569' : t.color }}
            />
            {t.label}
            {totals[t.key] > 0 && (
              <span className="ml-0.5 text-slate-500">({totals[t.key]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="px-2 pb-4 pt-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            <defs>
              {MOVEMENT_TYPES.map(t => (
                <linearGradient key={t.key} id={`grad-${t.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={t.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#475569', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#475569', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} />
            {MOVEMENT_TYPES.map(t => (
              !hiddenKeys.has(t.key) && (
                <Area
                  key={t.key}
                  type="monotone"
                  dataKey={t.key}
                  name={t.label}
                  stroke={t.color}
                  strokeWidth={1.5}
                  fill={`url(#grad-${t.key})`}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Empty state */}
      {stockMovements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-slate-600">No movement data in the last 30 days.</p>
        </div>
      )}
    </div>
  );
}