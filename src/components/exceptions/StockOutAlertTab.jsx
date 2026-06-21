import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { AlertCircle, AlertTriangle, Clock, CheckCircle2, RefreshCw, Filter } from 'lucide-react';
import AlertLifecycleActions from './AlertLifecycleActions';
import { format } from 'date-fns';

const SEVERITY_CFG = {
  CRITICAL: { badge: 'bg-red-100 text-red-700 border-red-200',    icon: AlertCircle,   iconColor: 'text-red-500',    row: 'border-red-200 bg-red-50/40' },
  HIGH:     { badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', row: 'border-amber-200 bg-amber-50/40' },
  MEDIUM:   { badge: 'bg-blue-100 text-blue-700 border-blue-200',  icon: Clock,         iconColor: 'text-blue-500',   row: 'border-border bg-card' },
  LOW:      { badge: 'bg-muted text-muted-foreground border-border', icon: AlertCircle,  iconColor: 'text-muted-foreground', row: 'border-border bg-card' },
};

const STATUS_CFG = {
  OPEN:         'bg-red-100 text-red-700',
  ACKNOWLEDGED: 'bg-amber-100 text-amber-700',
  RESOLVED:     'bg-emerald-100 text-emerald-700',
  DEDUPED:      'bg-slate-100 text-slate-500',
};

const TYPE_LABELS = {
  HIGH_VALUE_WASTAGE:       'High-Value Wastage',
  HIGH_VALUE_STORE_USE:     'High-Value Store Use',
  REPEATED_SKU_WASTAGE:     'Repeated SKU Wastage',
  REPEATED_SKU_STORE_USE:   'Repeated SKU Store Use',
  UNKNOWN_BARCODE:          'Unknown Barcode',
  DUPLICATE_SCAN:           'Duplicate Scan',
  AMENDMENT_AFTER_POST:     'Amendment After Post',
  REVERSAL_AFTER_POST:      'Reversal After Post',
};

export default function StockOutAlertTab() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const loadAlerts = async () => {
    setLoading(true);
    const query = { ...envFilter() };
    if (statusFilter !== 'ALL') query.status = statusFilter;
    const rows = await base44.entities.StockOutAlert.filter(query, '-created_date', 100);
    setAlerts(rows || []);
    setLoading(false);
  };

  useEffect(() => { loadAlerts(); }, [statusFilter]);

  const filtered = useMemo(() => {
    if (severityFilter === 'ALL') return alerts;
    return alerts.filter(a => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  const counts = useMemo(() => ({
    OPEN: alerts.filter(a => a.status === 'OPEN').length,
    ACKNOWLEDGED: alerts.filter(a => a.status === 'ACKNOWLEDGED').length,
    RESOLVED: alerts.filter(a => a.status === 'RESOLVED').length,
  }), [alerts]);

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'OPEN', label: `Open (${counts.OPEN})` },
          { key: 'ACKNOWLEDGED', label: `Acknowledged (${counts.ACKNOWLEDGED})` },
          { key: 'RESOLVED', label: `Resolved (${counts.RESOLVED})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === key
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Filter size={13} className="text-muted-foreground" />
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="h-8 px-2 text-xs border border-border rounded-lg bg-card"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button onClick={loadAlerts} disabled={loading} className="h-8 px-3 text-xs border border-border rounded-lg hover:bg-muted flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading alerts…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-800">No alerts in this view</p>
          <p className="text-xs text-emerald-700 mt-1">Try a different status or severity filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const sev = SEVERITY_CFG[alert.severity] || SEVERITY_CFG.LOW;
            const Icon = sev.icon;
            return (
              <div key={alert.id} className={`rounded-xl border p-3.5 ${sev.row}`}>
                <div className="flex items-start gap-3">
                  <Icon size={16} className={`${sev.iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {TYPE_LABELS[alert.alert_type] || alert.alert_type}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${sev.badge}`}>
                        {alert.severity}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_CFG[alert.status] || ''}`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{alert.trigger_reason}</p>
                    {alert.metadata && (
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        {alert.metadata.sku && <span>SKU: <span className="font-mono">{alert.metadata.sku}</span></span>}
                        {alert.metadata.item_name && <span>{alert.metadata.item_name}</span>}
                        {alert.metadata.quantity && <span>Qty: {alert.metadata.quantity}</span>}
                        {alert.metadata.value && <span>Value: ₱{Number(alert.metadata.value).toFixed(2)}</span>}
                        {alert.metadata.location && <span>📍 {alert.metadata.location}</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {alert.created_date && (
                        <span>{format(new Date(alert.created_date), 'dd MMM yyyy, HH:mm')}</span>
                      )}
                      {alert.acknowledged_by && (
                        <span>Ack by {alert.acknowledged_by}</span>
                      )}
                      {alert.resolved_by && (
                        <span>Resolved by {alert.resolved_by}</span>
                      )}
                    </div>
                  </div>
                  {['OPEN', 'ACKNOWLEDGED'].includes(alert.status) && (
                    <AlertLifecycleActions alert={alert} onUpdated={loadAlerts} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}