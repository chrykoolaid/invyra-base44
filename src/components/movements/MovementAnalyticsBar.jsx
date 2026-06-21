import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MovementAnalyticsBar({ movements }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const msDay = 86400000;
    const current = movements.filter(m => new Date(m.created_date).getTime() > now - 7 * msDay);
    const previous = movements.filter(m => {
      const t = new Date(m.created_date).getTime();
      return t > now - 14 * msDay && t <= now - 7 * msDay;
    });

    const sumQty = (arr, dir) => arr.filter(m => m.direction === dir).reduce((s, m) => s + (m.qty || 0), 0);

    const curIn  = sumQty(current, 'IN');
    const curOut = sumQty(current, 'OUT');
    const prevIn  = sumQty(previous, 'IN');
    const prevOut = sumQty(previous, 'OUT');

    const delta = (cur, prev) => prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);

    const byType = {};
    current.forEach(m => { byType[m.movement_type] = (byType[m.movement_type] || 0) + 1; });
    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

    const voided = movements.filter(m => m.status === 'VOIDED').length;

    return {
      curIn, curOut, prevIn, prevOut,
      inDelta: delta(curIn, prevIn),
      outDelta: delta(curOut, prevOut),
      topType: topType ? `${topType[0]} (${topType[1]})` : '—',
      voided,
      thisWeek: current.length,
    };
  }, [movements]);

  const DeltaIcon = ({ delta }) => {
    if (delta === null) return null;
    if (delta > 0) return <TrendingUp size={11} className="text-emerald-600" />;
    if (delta < 0) return <TrendingDown size={11} className="text-red-500" />;
    return <Minus size={11} className="text-muted-foreground" />;
  };

  const tiles = [
    {
      label: 'IN this week',
      value: stats.curIn.toLocaleString(),
      sub: stats.inDelta !== null ? `${stats.inDelta > 0 ? '+' : ''}${stats.inDelta}% vs prev week` : 'No prior data',
      delta: stats.inDelta,
      valueColor: 'text-emerald-700',
    },
    {
      label: 'OUT this week',
      value: stats.curOut.toLocaleString(),
      sub: stats.outDelta !== null ? `${stats.outDelta > 0 ? '+' : ''}${stats.outDelta}% vs prev week` : 'No prior data',
      delta: stats.outDelta,
      valueColor: 'text-red-600',
    },
    {
      label: 'Movements this week',
      value: stats.thisWeek.toLocaleString(),
      sub: `Top: ${stats.topType}`,
      delta: null,
      valueColor: 'text-foreground',
    },
    {
      label: 'Voided entries',
      value: stats.voided.toLocaleString(),
      sub: stats.voided > 0 ? 'Review recommended' : 'None — ledger clean',
      delta: null,
      valueColor: stats.voided > 0 ? 'text-amber-700' : 'text-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map(tile => (
        <div key={tile.label} className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">{tile.label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className={`text-xl font-bold leading-tight ${tile.valueColor}`}>{tile.value}</p>
            <DeltaIcon delta={tile.delta} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}