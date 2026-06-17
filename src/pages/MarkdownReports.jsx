import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3, RefreshCw, TrendingDown, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#06b6d4'];

export default function MarkdownReports() {
  const [batches, setBatches] = useState([]);
  const [dispositions, setDispositions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [batchData, dispData, eventData] = await Promise.all([
      base44.entities.MarkdownBatch.filter({ environment: 'LIVE' }, '-created_date', 200),
      base44.entities.MarkdownDisposition.filter({ environment: 'LIVE', disposition_status: 'Confirmed' }, '-created_date', 500),
      base44.entities.MarkdownEventLog.filter({ environment: 'LIVE' }, '-created_at', 500),
    ]);
    setBatches(batchData || []);
    setDispositions(dispData || []);
    setEvents(eventData || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // KPIs
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.status === 'Active').length;
  const totalAllocated = batches.reduce((s, b) => s + (b.allocated_qty || 0), 0);
  const totalSold = batches.reduce((s, b) => s + (b.sold_qty || 0), 0);
  const totalDisposed = batches.reduce((s, b) => s + (b.disposed_qty || 0), 0);
  const totalRecovered = batches.reduce((s, b) => s + (b.recovered_qty || 0), 0);
  const avgSellThrough = batches.length > 0
    ? (batches.reduce((s, b) => s + (b.sell_through_pct || 0), 0) / batches.length).toFixed(1)
    : 0;

  // Disposition breakdown for pie
  const dispositionBreakdown = ['Waste', 'Store_Use', 'Donate', 'Return_To_Supplier', 'Transfer', 'Recover'].map(type => ({
    name: type.replace(/_/g, ' '),
    value: dispositions.filter(d => d.outcome_type === type).reduce((s, d) => s + (d.qty || 0), 0),
  })).filter(d => d.value > 0);

  // Sell-through distribution by batch
  const sellThroughBins = [
    { label: '0–25%', count: batches.filter(b => (b.sell_through_pct || 0) < 25).length },
    { label: '25–50%', count: batches.filter(b => (b.sell_through_pct || 0) >= 25 && (b.sell_through_pct || 0) < 50).length },
    { label: '50–75%', count: batches.filter(b => (b.sell_through_pct || 0) >= 50 && (b.sell_through_pct || 0) < 75).length },
    { label: '75–100%', count: batches.filter(b => (b.sell_through_pct || 0) >= 75).length },
  ];

  // Cost impact
  const totalCostImpact = dispositions.reduce((s, d) => s + (d.cost_impact_value || 0), 0);

  // Event type breakdown
  const eventBreakdown = {};
  events.forEach(e => { eventBreakdown[e.event_type] = (eventBreakdown[e.event_type] || 0) + 1; });
  const eventChartData = Object.entries(eventBreakdown).map(([type, count]) => ({ type: type.replace(/_/g, ' '), count }));

  const kpis = [
    { label: 'Total Batches', value: totalBatches, icon: Package, color: 'text-blue-600' },
    { label: 'Active Batches', value: activeBatches, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Avg Sell-Through', value: `${avgSellThrough}%`, icon: TrendingDown, color: 'text-amber-600' },
    { label: 'Total Cost Impact', value: `₱${totalCostImpact.toFixed(2)}`, icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Markdown Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Phase 1 sell-through, disposition, and event analytics</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-border rounded-lg bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} className={color} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Quantity summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Allocated', value: totalAllocated.toLocaleString(), sub: 'units into markdown' },
          { label: 'Total Sold', value: totalSold.toLocaleString(), sub: 'units sold at markdown price' },
          { label: 'Total Disposed', value: totalDisposed.toLocaleString(), sub: 'units disposed' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="border border-border rounded-lg bg-card p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm font-medium text-foreground mt-1">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sell-through distribution */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sell-Through Distribution</h3>
          {loading ? <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sellThroughBins}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Disposition outcome pie */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Disposition Outcomes (by qty)</h3>
          {loading ? <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> :
            dispositionBreakdown.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No confirmed dispositions</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={dispositionBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                      {dispositionBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {dispositionBreakdown.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-foreground flex-1 truncate">{d.name}</span>
                      <span className="font-semibold text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>
      </div>

      {/* Event activity */}
      <div className="border border-border rounded-lg bg-card p-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Event Activity (MarkdownEventLog)</h3>
        {loading ? <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> :
          eventChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No events recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventChartData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Batch detail table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="text-sm font-semibold text-foreground">Batch Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground uppercase tracking-wide">
              <tr>
                {['Batch Ref', 'Item', 'Status', 'Allocated', 'Sold', 'Remaining', 'Disposed', 'Recovered', 'Sell-Through'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No batches found</td></tr>
              ) : batches.map((b, i) => {
                const pct = b.sell_through_pct || 0;
                return (
                  <tr key={b.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">{b.batch_ref || b.id.slice(-8)}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground">{b.item_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{b.sku}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.status.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 text-right">{b.allocated_qty || 0}</td>
                    <td className="px-4 py-2.5 text-right">{b.sold_qty || 0}</td>
                    <td className="px-4 py-2.5 text-right">{b.current_remaining_qty || 0}</td>
                    <td className="px-4 py-2.5 text-right">{b.disposed_qty || 0}</td>
                    <td className="px-4 py-2.5 text-right">{b.recovered_qty || 0}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${pct >= 80 ? 'text-green-700' : pct >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}