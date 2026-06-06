import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, RefreshCw, TrendingDown, AlertCircle, Clock, PackageX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Exceptions() {
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState([]);

  const loadData = async () => {
    setLoading(true);

    const [items, movements, receivingRecords] = await Promise.all([
      base44.entities.InventoryItem.list('', 500),
      base44.entities.StockMovement.list('-created_date', 500),
      base44.entities.ReceivingRecord.filter({ status: 'Discrepancy' }),
    ]);

    const alerts = [];

    // 1. Negative stock
    (items || []).filter(i => (i.stock || 0) < 0).forEach(item => {
      alerts.push({
        id: `neg-${item.id}`,
        type: 'negative_stock',
        severity: 'critical',
        title: 'Negative Stock',
        description: `${item.name} (${item.sku}) is at ${item.stock} units`,
        action_label: 'View Inventory',
        action_path: '/Inventory',
        item,
      });
    });

    // 2. Below reorder point
    (items || []).filter(i => i.reorder_point && (i.stock || 0) <= i.reorder_point && (i.stock || 0) >= 0).forEach(item => {
      alerts.push({
        id: `reorder-${item.id}`,
        type: 'reorder_overdue',
        severity: 'high',
        title: 'Below Reorder Point',
        description: `${item.name} (${item.sku}) has ${item.stock ?? 0} units — reorder at ${item.reorder_point}`,
        action_label: 'Reorder Review',
        action_path: '/ReorderReview',
        item,
      });
    });

    // 3. Receiving discrepancies unresolved
    (receivingRecords || []).forEach(rec => {
      alerts.push({
        id: `disc-${rec.id}`,
        type: 'receiving_discrepancy',
        severity: 'high',
        title: 'Unresolved Receiving Discrepancy',
        description: `PO ${rec.po_number} from ${rec.supplier} — ${rec.discrepancy_status || 'Flagged'}`,
        action_label: 'View Receiving Log',
        action_path: '/Receiving/log',
      });
    });

    // 4. Unresolved VOIDED movements
    const voided = (movements || []).filter(m => m.status === 'VOIDED');
    if (voided.length > 0) {
      alerts.push({
        id: 'voided-group',
        type: 'voided_movements',
        severity: 'medium',
        title: 'Voided Stock Movements',
        description: `${voided.length} movement(s) have been voided and may need review`,
        action_label: 'View Movements',
        action_path: '/Movements',
      });
    }

    // 5. Zero-cost items with stock
    const zeroCostWithStock = (items || []).filter(i => (!i.cost_per_unit || i.cost_per_unit === 0) && (i.stock || 0) > 0);
    if (zeroCostWithStock.length > 0) {
      alerts.push({
        id: 'zero-cost',
        type: 'missing_cost',
        severity: 'medium',
        title: 'Items Missing Unit Cost',
        description: `${zeroCostWithStock.length} item(s) have stock but no cost set — inventory valuation incomplete`,
        action_label: 'Inventory Admin',
        action_path: '/InventoryAdmin',
      });
    }

    // Sort: critical first, then high, then medium
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);
    setExceptions(alerts);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const severityConfig = {
    critical: { color: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-700', icon: AlertCircle, iconColor: 'text-red-600' },
    high: { color: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-600' },
    medium: { color: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-700', icon: Clock, iconColor: 'text-blue-600' },
    low: { color: 'border-border bg-card', badge: 'bg-muted text-muted-foreground', icon: AlertCircle, iconColor: 'text-muted-foreground' },
  };

  const counts = {
    critical: exceptions.filter(e => e.severity === 'critical').length,
    high: exceptions.filter(e => e.severity === 'high').length,
    medium: exceptions.filter(e => e.severity === 'medium').length,
  };

  return (
    <div className="p-5 lg:p-6 max-w-[900px] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Exceptions</h1>
          <p className="text-sm text-muted-foreground">Operational alert queue — negative stock, reorder overdue, unresolved discrepancies, and data quality issues.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

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

      {/* Exception List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Scanning for exceptions…</div>
      ) : exceptions.length === 0 ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm font-semibold text-green-800">No exceptions found</p>
          <p className="text-sm text-green-700 mt-1">All inventory metrics look clean.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exceptions.map(exc => {
            const cfg = severityConfig[exc.severity];
            const Icon = cfg.icon;
            return (
              <div key={exc.id} className={`rounded-2xl border p-4 ${cfg.color}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon size={18} className={`${cfg.iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{exc.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${cfg.badge}`}>{exc.severity}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{exc.description}</p>
                    </div>
                  </div>
                  <Link
                    to={exc.action_path}
                    className="flex-shrink-0 h-8 px-3 text-xs font-medium rounded-lg bg-white/70 border border-border hover:bg-white transition-colors flex items-center"
                  >
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