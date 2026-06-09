import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const healthConfig = {
  healthy: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle2 },
  degraded: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertCircle },
};

export default function SyncHealthScorer() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState('24h');

  const calculateScores = async () => {
    setLoading(true);
    
    const perf = await base44.entities.SyncPerformance.list('-created_date', 500);
    
    const grouped = perf.reduce((acc, p) => {
      const key = `${p.sync_type}:${p.external_system}`;
      if (!acc[key]) acc[key] = { syncs: [], sync_type: p.sync_type, external_system: p.external_system };
      acc[key].syncs.push(p);
      return acc;
    }, {});

    const calculated = Object.values(grouped).map(group => {
      const total = group.syncs.length;
      const successful = group.syncs.filter(s => s.status === 'success').length;
      const uptime = total > 0 ? (successful / total) * 100 : 0;
      
      const audit = perf.filter(p => 
        p.sync_type === group.sync_type && p.external_system === group.external_system
      );
      const verified = audit.filter(a => a.reconciliation_status === 'verified').length;
      const accuracy = audit.length > 0 ? (verified / audit.length) * 100 : 0;

      const avgLatency = total > 0 
        ? group.syncs.reduce((sum, s) => sum + (s.duration_ms || 0), 0) / total 
        : 0;

      const throughput = total > 0 
        ? (group.syncs.reduce((sum, s) => sum + (s.items_processed || 0), 0) / total) * 60 
        : 0;

      const composite = (uptime * 0.4) + (accuracy * 0.3) + (Math.max(0, 100 - (avgLatency / 10)) * 0.2) + (Math.min(throughput / 10, 100) * 0.1);

      const health = composite > 85 ? 'healthy' : composite >= 70 ? 'degraded' : 'critical';
      const alert = health !== 'healthy';

      return {
        sync_type: group.sync_type,
        external_system: group.external_system,
        uptime_percent: Math.round(uptime),
        accuracy_percent: Math.round(accuracy),
        avg_latency_ms: Math.round(avgLatency),
        throughput_items_per_hour: Math.round(throughput),
        composite_score: Math.round(composite),
        health_status: health,
        alert_triggered: alert,
        alert_message: alert ? `Health score ${Math.round(composite)}/100 — ${health === 'critical' ? 'immediate attention required' : 'monitor closely'}` : null,
        measurement_window: window,
        last_checked: new Date().toISOString(),
      };
    });

    setScores(calculated);
    setLoading(false);
  };

  useEffect(() => { calculateScores(); }, [window]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Sync Health Scores</h2>
          <p className="text-xs text-muted-foreground mt-1">Composite reliability metrics per connector</p>
        </div>
        <div className="flex gap-2">
          {['1h', '24h', '7d'].map(w => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                window === w
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Calculating health scores…</div>
      ) : scores.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No sync data available</div>
      ) : (
        <div className="space-y-3">
          {scores.map((score) => {
            const config = healthConfig[score.health_status];
            const Icon = config.icon;
            
            return (
              <div key={`${score.sync_type}:${score.external_system}`} className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`h-5 w-5 ${config.text} mt-0.5 flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${config.text}`}>
                        {score.sync_type === 'xero_inventory' ? 'Xero Inventory'
                          : score.sync_type === 'webhook_inventory' ? 'Webhook Stock'
                          : 'Webhook Order'}
                      </p>
                      {score.alert_triggered && (
                        <p className={`text-xs ${config.text} mt-1`}>⚠ {score.alert_message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col items-end">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${config.border} ${config.bg}`}>
                        <span className={`text-lg font-bold ${config.text}`}>{score.composite_score}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">/100</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Uptime</p>
                    <p className="text-sm font-bold text-foreground mt-1">{score.uptime_percent}%</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Accuracy</p>
                    <p className="text-sm font-bold text-foreground mt-1">{score.accuracy_percent}%</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Latency</p>
                    <p className="text-sm font-bold text-foreground mt-1">{score.avg_latency_ms}ms</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Throughput</p>
                    <p className="text-sm font-bold text-foreground mt-1">{score.throughput_items_per_hour}/hr</p>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground mt-2">
                  Calculated {new Date(score.last_checked).toLocaleTimeString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
        <p className="text-xs font-semibold text-muted-foreground">Score Formula</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          40% Uptime + 30% Accuracy + 20% Latency + 10% Throughput
        </p>
      </div>
    </div>
  );
}