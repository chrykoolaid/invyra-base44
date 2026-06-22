import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { AlertCircle, AlertTriangle, Clock, CheckCircle2, Bell, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERITY_CFG = {
  critical: { color: 'border-red-200 bg-red-50',    badge: 'bg-red-100 text-red-700',    icon: AlertCircle,   iconColor: 'text-red-600' },
  high:     { color: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-600' },
  medium:   { color: 'border-blue-200 bg-blue-50',  badge: 'bg-blue-100 text-blue-700',  icon: Clock,         iconColor: 'text-blue-600' },
  low:      { color: 'border-border bg-card',        badge: 'bg-muted text-muted-foreground', icon: AlertCircle, iconColor: 'text-muted-foreground' },
};

export default function InventoryExceptionsTab() {
  const [exceptions, setExceptions] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertResult, setAlertResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [items, movements, receivingRecords] = await Promise.all([
      base44.entities.InventoryItem.filter(envFilter(), '', 500),
      base44.entities.StockMovement.filter(envFilter(), '-created_date', 500),
      base44.entities.ReceivingRecord.filter({ ...envFilter(), status: 'Discrepancy' }),
    ]);

    const alerts = [];

    (items || []).filter(i => (i.stock || 0) < 0).forEach(item => {
      alerts.push({ id: `neg-${item.id}`, severity: 'critical', title: 'Negative Stock', description: `${item.name} (${item.sku}) is at ${item.stock} units`, action_label: 'View Inventory', action_path: '/Inventory' });
    });

    (items || []).filter(i => i.reorder_point && (i.stock || 0) <= i.reorder_point && (i.stock || 0) >= 0).forEach(item => {
      alerts.push({ id: `reorder-${item.id}`, severity: 'high', title: 'Below Reorder Point', description: `${item.name} (${item.sku}) has ${item.stock ?? 0} units — reorder at ${item.reorder_point}`, action_label: 'Reorder Review', action_path: '/ReorderReview' });
    });

    (receivingRecords || []).forEach(rec => {
      alerts.push({ id: `disc-${rec.id}`, severity: 'high', title: 'Unresolved Receiving Discrepancy', description: `PO ${rec.po_number} from ${rec.supplier} — ${rec.discrepancy_status || 'Flagged'}`, action_label: 'View Receiving Log', action_path: '/Receiving/log' });
    });

    const voided = (movements || []).filter(m => m.status === 'VOIDED');
    if (voided.length > 0) {
      alerts.push({ id: 'voided-group', severity: 'medium', title: 'Voided Stock Movements', description: `${voided.length} movement(s) have been voided and may need review`, action_label: 'View Movements', action_path: '/Movements' });
    }

    const zeroCost = (items || []).filter(i => (!i.cost_per_unit || i.cost_per_unit === 0) && (i.stock || 0) > 0);
    if (zeroCost.length > 0) {
      alerts.push({ id: 'zero-cost', severity: 'medium', title: 'Items Missing Unit Cost', description: `${zeroCost.length} item(s) have stock but no cost set — inventory valuation incomplete`, action_label: 'Inventory Settings', action_path: '/InventorySettings' });
    }

    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);
    setExceptions(alerts);
    setLoading(false);
  };

  const loadAlertHistory = async () => {
    const history = await base44.entities.StockAlert.filter(envFilter(), '-created_date', 20);
    setAlertHistory(history || []);
  };

  const sendManualAlert = async () => {
    setSendingAlert(true);
    setAlertResult(null);
    const res = await base44.functions.invoke('checkReorderAlerts', {});
    setAlertResult(res.data);
    setSendingAlert(false);
    loadAlertHistory();
  };

  useEffect(() => {
    loadData();
    loadAlertHistory();
  }, []);

  const counts = {
    critical: exceptions.filter(e => e.severity === 'critical').length,
    high: exceptions.filter(e => e.severity === 'high').length,
    medium: exceptions.filter(e => e.severity === 'medium').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{counts.critical}</p>
          <p className="text-xs font-semibold text-red-600 mt-1">Critical</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.high}</p>
          <p className="text-xs font-semibold text-amber-600 mt-1">High</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{counts.medium}</p>
          <p className="text-xs font-semibold text-blue-600 mt-1">Medium</p>
        </div>
      </div>

      {/* Reorder Alert Controls */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Bell size={15} /> Reorder Alerts</p>
            <p className="text-xs text-muted-foreground mt-0.5">Emails all admin users when items are below reorder point.</p>
          </div>
          <button
            onClick={sendManualAlert}
            disabled={sendingAlert}
            className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium flex-shrink-0"
          >
            <Bell size={14} className={sendingAlert ? 'animate-pulse' : ''} />
            {sendingAlert ? 'Sending…' : 'Send Now'}
          </button>
        </div>
        {alertResult && (
          <div className={`rounded-lg border px-3 py-2.5 text-sm flex items-start gap-2 ${alertResult.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>
            {alertResult.error ? <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> : <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-medium">{alertResult.error || alertResult.message}</p>
              {alertResult.items?.length > 0 && <p className="text-xs mt-0.5 opacity-80">Items: {alertResult.items.join(', ')}</p>}
            </div>
          </div>
        )}
        {alertHistory.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Recent Alerts Sent</p>
            <div className="space-y-1">
              {alertHistory.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="text-foreground font-medium">{a.item_name} <span className="font-mono text-muted-foreground">({a.sku})</span></span>
                  <span className="text-muted-foreground">{a.stock_at_alert} on hand · {new Date(a.created_date).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exception list */}
      <div className="flex justify-end">
        <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Scanning for exceptions…</div>
      ) : exceptions.length === 0 ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-800">No exceptions found</p>
          <p className="text-sm text-green-700 mt-1">All inventory metrics look clean.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exceptions.map(exc => {
            const cfg = SEVERITY_CFG[exc.severity];
            const Icon = cfg.icon;
            return (
              <div key={exc.id} className={`rounded-xl border p-4 ${cfg.color}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon size={16} className={`${cfg.iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{exc.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${cfg.badge}`}>{exc.severity}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{exc.description}</p>
                    </div>
                  </div>
                  <Link to={exc.action_path} className="flex-shrink-0 h-8 px-3 text-xs font-medium rounded-lg bg-white/70 border border-border hover:bg-white transition-colors flex items-center">
                    {exc.action_label} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}