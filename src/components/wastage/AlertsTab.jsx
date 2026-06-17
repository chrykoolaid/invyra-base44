import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AlertsTab({ refreshTick }) {
  const [alerts, setAlerts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('OPEN');

  useEffect(() => {
    setLoading(true);
    const status = filterStatus === 'ALL' ? undefined : filterStatus;
    const queryObj = status ? { status, environment: 'LIVE' } : { environment: 'LIVE' };
    
    base44.entities.StockOutAlert.filter(queryObj, '-created_date', 100).then(data => {
      setAlerts(data || []);
      setLoading(false);
    });
  }, [refreshTick, filterStatus]);

  const filteredAlerts = useMemo(() => {
    const q = query.toLowerCase();
    return alerts.filter(a =>
      a.alert_type.toLowerCase().includes(q) ||
      (a.metadata?.sku && a.metadata.sku.toLowerCase().includes(q)) ||
      (a.metadata?.item_name && a.metadata.item_name.toLowerCase().includes(q)) ||
      a.trigger_reason.toLowerCase().includes(q)
    );
  }, [alerts, query]);

  const severityColors = {
    LOW: 'bg-blue-50 text-blue-700 border-blue-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusIcons = {
    OPEN: AlertCircle,
    ACKNOWLEDGED: CheckCircle2,
    RESOLVED: CheckCircle2,
    DEDUPED: Copy,
  };

  const handleAcknowledge = async (alertId) => {
    try {
      const response = await base44.functions.invoke('acknowledgeStockOutAlert', {
        alert_id: alertId,
      });
      if (response.data.success) {
        toast.success('Alert acknowledged');
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a));
      }
    } catch (error) {
      toast.error(`Acknowledge failed: ${error.message}`);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      const response = await base44.functions.invoke('resolveStockOutAlert', {
        alert_id: alertId,
      });
      if (response.data.success) {
        toast.success('Alert resolved');
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a));
      }
    } catch (error) {
      toast.error(`Resolve failed: ${error.message}`);
    }
  };

  const handleDedupe = async (alertId, dedupeOfId) => {
    try {
      const response = await base44.functions.invoke('dedupeStockOutAlert', {
        alert_id: alertId,
        deduped_of: dedupeOfId,
      });
      if (response.data.success) {
        toast.success('Alert marked as duplicate');
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'DEDUPED' } : a));
      }
    } catch (error) {
      toast.error(`Dedupe failed: ${error.message}`);
    }
  };

  const summaryByStatus = useMemo(() => {
    return {
      OPEN: alerts.filter(a => a.status === 'OPEN').length,
      ACKNOWLEDGED: alerts.filter(a => a.status === 'ACKNOWLEDGED').length,
      RESOLVED: alerts.filter(a => a.status === 'RESOLVED').length,
      DEDUPED: alerts.filter(a => a.status === 'DEDUPED').length,
    };
  }, [alerts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Open</p>
          <p className="text-2xl font-bold text-red-700">{summaryByStatus.OPEN}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting action</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Acknowledged</p>
          <p className="text-2xl font-bold text-amber-700">{summaryByStatus.ACKNOWLEDGED}</p>
          <p className="text-xs text-muted-foreground mt-2">Being investigated</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Resolved</p>
          <p className="text-2xl font-bold text-green-700">{summaryByStatus.RESOLVED}</p>
          <p className="text-xs text-muted-foreground mt-2">Closed</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Duplicates</p>
          <p className="text-2xl font-bold text-slate-700">{summaryByStatus.DEDUPED}</p>
          <p className="text-xs text-muted-foreground mt-2">Merged</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Alert Queue</p>
              <p className="text-xs text-muted-foreground mt-1">Active operational alerts</p>
            </div>
            <span className="text-xs text-muted-foreground">{filteredAlerts.length} visible</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by type, SKU, item, or reason..."
                className="pl-9"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="OPEN">Open Only</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DEDUPED">Duplicates</option>
              <option value="ALL">All</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No alerts</p>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map(alert => {
                const Icon = statusIcons[alert.status];
                return (
                  <div key={alert.id} className={`p-4 rounded-xl border border-border bg-background/40 hover:bg-muted/25 transition-colors ${severityColors[alert.severity] || 'bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground text-sm">{alert.alert_type.replace(/_/g, ' ')}</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${severityColors[alert.severity]}`}>
                            {alert.severity}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                            {alert.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{alert.trigger_reason}</p>
                        {alert.metadata && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.metadata.sku} · {alert.metadata.item_name} · Qty: {alert.metadata.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                      <span>{new Date(alert.created_date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        {alert.status === 'OPEN' && (
                          <>
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="px-2 py-1 text-[11px] rounded bg-amber-600 text-white hover:opacity-90"
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={() => handleResolve(alert.id)}
                              className="px-2 py-1 text-[11px] rounded bg-green-600 text-white hover:opacity-90"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                        {alert.status === 'ACKNOWLEDGED' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-2 py-1 text-[11px] rounded bg-green-600 text-white hover:opacity-90"
                          >
                            Resolve
                          </button>
                        )}
                        {(alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED') && (
                          <button
                            onClick={() => handleDedupe(alert.id, alert.dedupe_key)}
                            className="px-2 py-1 text-[11px] rounded bg-slate-600 text-white hover:opacity-90"
                          >
                            Dedupe
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}