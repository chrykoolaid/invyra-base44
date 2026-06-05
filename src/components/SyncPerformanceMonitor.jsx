import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function SyncPerformanceMonitor() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState('24h');

  const loadMetrics = async () => {
    setLoading(true);
    const now = new Date();
    const hours = timeWindow === '24h' ? 24 : timeWindow === '7d' ? 168 : 720;
    const since = new Date(now - hours * 60 * 60 * 1000);

    const data = await base44.entities.SyncPerformance.filter(
      { sync_timestamp: { $gte: since.toISOString() } },
      '-sync_timestamp',
      500
    );
    setMetrics(data || []);
    setLoading(false);
  };

  useEffect(() => { loadMetrics(); }, [timeWindow]);

  // Calculate aggregate stats
  const stats = {
    total: metrics.length,
    successful: metrics.filter(m => m.status === 'success').length,
    failed: metrics.filter(m => m.status === 'failed').length,
    avgDuration: metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + (m.duration_ms || 0), 0) / metrics.length) : 0,
    successRate: metrics.length > 0 ? Math.round((metrics.filter(m => m.status === 'success').length / metrics.length) * 100) : 0,
    totalItems: metrics.reduce((sum, m) => sum + (m.items_processed || 0), 0),
    failedItems: metrics.reduce((sum, m) => sum + (m.items_failed || 0), 0),
  };

  const errorBreakdown = metrics
    .filter(m => m.status === 'failed')
    .reduce((acc, m) => {
      const cat = m.error_category || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

  const syncTypeMetrics = metrics.reduce((acc, m) => {
    const type = m.sync_type || 'unknown';
    if (!acc[type]) acc[type] = { count: 0, success: 0, failed: 0, totalDuration: 0 };
    acc[type].count++;
    if (m.status === 'success') acc[type].success++;
    else acc[type].failed++;
    acc[type].totalDuration += m.duration_ms || 0;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Sync Performance</h2>
          <p className="text-xs text-muted-foreground mt-1">Real-time metrics and health indicators</p>
        </div>
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map(w => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                timeWindow === w
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              {w}
            </button>
          ))}
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-border hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Success Rate</p>
          <p className="text-2xl font-bold text-foreground mt-2">{stats.successRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.successful}/{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg Duration</p>
          <p className="text-2xl font-bold text-foreground mt-2">{stats.avgDuration}ms</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.total} syncs</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items Synced</p>
          <p className="text-2xl font-bold text-foreground mt-2">{stats.totalItems}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.failedItems} failed</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Failed Syncs</p>
          <p className={`text-2xl font-bold mt-2 ${stats.failed > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.failed}</p>
          <p className="text-xs text-muted-foreground mt-1">of {stats.total}</p>
        </div>
      </div>

      {/* Sync Type Breakdown */}
      {Object.keys(syncTypeMetrics).length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/25">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">By Sync Type</p>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(syncTypeMetrics).map(([type, data]) => {
              const successRate = data.count > 0 ? Math.round((data.success / data.count) * 100) : 0;
              const avgDuration = data.count > 0 ? Math.round(data.totalDuration / data.count) : 0;
              return (
                <div key={type} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {type === 'xero_inventory' ? 'Xero Inventory' : type === 'webhook_inventory' ? 'Webhook Stock' : 'Webhook Order'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{data.count} syncs • {successRate}% success</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-mono text-foreground">{avgDuration}ms</p>
                      <p className="text-xs text-muted-foreground">avg</p>
                    </div>
                    <div className={`flex h-8 w-12 items-center justify-center rounded border font-semibold text-xs ${
                      successRate >= 95 ? 'bg-green-50 border-green-200 text-green-700' :
                      successRate >= 80 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      {successRate}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Breakdown */}
      {Object.keys(errorBreakdown).length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-200 bg-red-100/50">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-700">Error Categories</p>
          </div>
          <div className="divide-y divide-red-200">
            {Object.entries(errorBreakdown).map(([category, count]) => (
              <div key={category} className="px-4 py-2 flex items-center justify-between text-sm">
                <span className="text-red-700 font-medium capitalize">{category}</span>
                <span className="font-mono text-red-700 font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {metrics.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/25">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Recent Syncs</p>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {metrics.slice(0, 10).map((m) => {
              const Icon = m.status === 'success' ? CheckCircle2 : AlertCircle;
              return (
                <div key={m.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={14} className={m.status === 'success' ? 'text-green-600' : 'text-red-600'} />
                    <div className="min-w-0">
                      <p className="text-foreground font-medium truncate">
                        {m.sync_type === 'xero_inventory' ? 'Xero' : m.sync_type === 'webhook_inventory' ? 'Stock Webhook' : 'Order Webhook'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.items_processed || 0} items • {m.duration_ms}ms
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {new Date(m.created_date).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && <div className="text-center py-8 text-muted-foreground text-sm">Loading metrics…</div>}
      {!loading && metrics.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No sync data in this period</div>}
    </div>
  );
}