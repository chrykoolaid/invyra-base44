import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

export default function ValuationHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState('30d');

  const loadData = async () => {
    setLoading(true);
    const [items, movements, auditLogs] = await Promise.all([
      base44.entities.InventoryItem.list('', 500),
      base44.entities.StockMovement.list('-created_date', 1000),
      base44.entities.AuditLog.list('-created_date', 500),
    ]);

    const days = parseInt(timeline);
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Build valuation snapshots from movements and price changes
    const valuationEvents = [];

    // Add price change events
    auditLogs.forEach(log => {
      if (log.change_type === 'PRICE_UPDATE' && new Date(log.created_date) >= cutoff) {
        const item = items.find(i => i.id === log.item_id);
        if (item) {
          valuationEvents.push({
            date: new Date(log.created_date),
            type: 'price_change',
            item_name: log.item_name,
            sku: log.sku,
            old_price: parseFloat(log.old_value) || 0,
            new_price: parseFloat(log.new_value) || 0,
            changed_by: log.changed_by,
            current_stock: item.stock || 0,
            impact: ((parseFloat(log.new_value) || 0) - (parseFloat(log.old_value) || 0)) * (item.stock || 0),
          });
        }
      }
    });

    // Add significant stock movement events (RECEIVE, WASTE, TRANSFER > 5 items)
    movements.forEach(move => {
      if (move.qty >= 5 && ['RECEIVE', 'WASTE', 'TRANSFER_OUT'].includes(move.movement_type) && new Date(move.created_date) >= cutoff) {
        valuationEvents.push({
          date: new Date(move.created_date),
          type: 'stock_movement',
          item_name: move.item_name,
          sku: move.sku,
          movement_type: move.movement_type,
          qty: move.qty,
          balance_after: move.balance_after,
          source_ref: move.source_ref,
          posted_by: move.posted_by,
        });
      }
    });

    // Sort by date descending
    valuationEvents.sort((a, b) => b.date - a.date);

    setHistory(valuationEvents);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [timeline]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading valuation history…</div>;

  // Calculate net impact of price changes
  const priceChangeEvents = history.filter(h => h.type === 'price_change');
  const totalPriceImpact = priceChangeEvents.reduce((sum, event) => sum + event.impact, 0);
  const netTrend = totalPriceImpact >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-6">
      {/* Impact Summary */}
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valuation Impact</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              ₱{Math.abs(totalPriceImpact).toLocaleString('en-PH', {maximumFractionDigits: 0})}
            </p>
          </div>
          <div className={`flex items-center gap-1 text-lg font-bold ${totalPriceImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPriceImpact >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            {totalPriceImpact >= 0 ? '+' : '−'}{Math.abs(totalPriceImpact).toLocaleString('en-PH', {maximumFractionDigits: 0})}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {priceChangeEvents.length} price changes in the last {timeline}
        </p>
      </div>

      {/* Timeline Selector */}
      <div className="flex gap-2 flex-wrap">
        {['7d', '14d', '30d', '90d'].map(t => (
          <button
            key={t}
            onClick={() => setTimeline(t)}
            className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
              timeline === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* History Timeline */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Valuation Changes Timeline</h3>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1 h-8 px-3 text-xs rounded border border-border hover:bg-muted disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No valuation changes in this period</div>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {history.map((event, idx) => {
              if (event.type === 'price_change') {
                const priceChange = event.new_price - event.old_price;
                const isIncrease = priceChange >= 0;
                return (
                  <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">PRICE UPDATE</span>
                          <span className={`text-sm font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncrease ? '+' : '−'}₱{Math.abs(priceChange).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{event.item_name}</p>
                        <p className="text-xs text-muted-foreground">{event.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-bold ${event.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {event.impact >= 0 ? '+' : '−'}₱{Math.abs(event.impact).toLocaleString('en-PH', {maximumFractionDigits: 0})}
                        </p>
                        <p className="text-xs text-muted-foreground">Impact on total</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground mb-2">
                      <div>Old: <span className="font-mono text-foreground">₱{event.old_price.toFixed(2)}</span></div>
                      <div>New: <span className="font-mono text-foreground">₱{event.new_price.toFixed(2)}</span></div>
                      <div>Stock: <span className="font-mono text-foreground">{event.current_stock} units</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      By {event.changed_by} • {event.date.toLocaleString()}
                    </p>
                  </div>
                );
              } else if (event.type === 'stock_movement') {
                return (
                  <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
                            {event.movement_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{event.item_name}</p>
                        <p className="text-xs text-muted-foreground">{event.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-foreground">{event.qty} units</p>
                        <p className="text-xs text-muted-foreground">{event.source_ref || 'Manual'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Balance: {event.balance_after} • By {event.posted_by} • {event.date.toLocaleString()}
                    </p>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}