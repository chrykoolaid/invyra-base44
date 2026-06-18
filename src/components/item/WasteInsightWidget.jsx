import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trash2 } from 'lucide-react';

const REASON_COLORS = {
  DAMAGED: '#ef4444',
  EXPIRED: '#f97316',
  SPOILED: '#eab308',
  CONTAMINATED: '#a855f7',
  BREAKAGE: '#3b82f6',
  HANDLING_DAMAGE: '#06b6d4',
  STAFF_REFRESHMENT: '#10b981',
  CLEANING_USE: '#14b8a6',
  BREAKROOM: '#6366f1',
  TOILETRIES: '#ec4899',
  OFFICE_USE: '#84cc16',
  INTERNAL_OPS: '#f59e0b',
};
const DEFAULT_COLOR = '#94a3b8';

function formatCurrency(v) {
  return `₱${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getWeekLabel(date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function WasteInsightWidget({ item }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item?.id && !item?.sku) return;
    setLoading(true);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    base44.entities.StockOutRecord.filter(
      { item_id: item.id, environment: 'LIVE' },
      '-created_date',
      200
    ).then(data => {
      const filtered = (data || []).filter(r => {
        const d = new Date(r.created_date);
        return d >= cutoff && (r.status === 'POSTED' || r.status === 'AMENDED');
      });
      setRecords(filtered);
    }).finally(() => setLoading(false));
  }, [item?.id]);

  const { weeklyData, reasonData, totals } = useMemo(() => {
    if (!records.length) return { weeklyData: [], reasonData: [], totals: { qty: 0, value: 0, events: 0 } };

    // Build 13 weekly buckets (last 90 days ≈ 13 weeks)
    const now = new Date();
    const weeks = [];
    for (let i = 12; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i + 1) * 7);
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      weeks.push({ label: getWeekLabel(start), start, end, qty: 0, value: 0 });
    }

    records.forEach(r => {
      const d = new Date(r.created_date);
      const bucket = weeks.find(w => d >= w.start && d < w.end);
      if (bucket) {
        bucket.qty += r.quantity || 0;
        bucket.value += r.estimated_value || 0;
      }
    });

    // Reason breakdown
    const reasonMap = {};
    records.forEach(r => {
      const key = r.reason_category || 'Unknown';
      if (!reasonMap[key]) reasonMap[key] = { reason: key, qty: 0, value: 0 };
      reasonMap[key].qty += r.quantity || 0;
      reasonMap[key].value += r.estimated_value || 0;
    });
    const reasonData = Object.values(reasonMap).sort((a, b) => b.qty - a.qty);

    const totals = {
      qty: records.reduce((s, r) => s + (r.quantity || 0), 0),
      value: records.reduce((s, r) => s + (r.estimated_value || 0), 0),
      events: records.length,
    };

    return { weeklyData: weeks, reasonData, totals };
  }, [records]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Trash2 size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Waste Analysis (Last 90 Days)</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-2">No posted wastage or store-use records found for this item in the last 90 days.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trash2 size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Waste Analysis <span className="text-muted-foreground font-normal">(Last 90 Days)</span></h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span><span className="font-semibold text-foreground">{totals.events}</span> events</span>
          <span><span className="font-semibold text-foreground">{totals.qty}</span> units lost</span>
          <span className="font-semibold text-red-600">{formatCurrency(totals.value)} total loss</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-4">
        {/* Weekly trend bar chart */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">Weekly Loss (Units)</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                formatter={(value, name) => [value, name === 'qty' ? 'Units' : 'Value']}
                labelFormatter={(label) => `Week of ${label}`}
              />
              <Bar dataKey="qty" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.qty > 0 ? '#ef4444' : 'hsl(var(--muted))'} fillOpacity={entry.qty > 0 ? 0.75 : 0.3} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reason breakdown */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">By Reason</p>
          <div className="space-y-1.5">
            {reasonData.map(r => {
              const pct = totals.qty > 0 ? Math.round((r.qty / totals.qty) * 100) : 0;
              const color = REASON_COLORS[r.reason] || DEFAULT_COLOR;
              return (
                <div key={r.reason}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-foreground font-medium truncate max-w-[130px]">{r.reason.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{r.qty} u · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}