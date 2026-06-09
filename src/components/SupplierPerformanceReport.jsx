import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { RefreshCw } from 'lucide-react';

export default function SupplierPerformanceReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const orders = await base44.entities.PurchaseOrder.filter(envFilter(), '-submitted_at', 500);
    const receiving = await base44.entities.ReceivingRecord.filter(envFilter(), '-confirmed_at', 500);

    const now = new Date();
    const supplierMetrics = orders.reduce((acc, order) => {
      if (!acc[order.supplier]) {
        acc[order.supplier] = { 
          total_orders: 0, 
          on_time: 0, 
          discrepancies: 0,
          avg_days_to_delivery: 0,
          quality_score: 100,
          total_days: 0
        };
      }
      
      acc[order.supplier].total_orders++;
      
      const recv = receiving.find(r => r.po_number === order.order_number);
      if (recv) {
        if (recv.confirmed_at && order.expected_date) {
          const daysLate = Math.max(0, (new Date(recv.confirmed_at) - new Date(order.expected_date)) / (1000 * 60 * 60 * 24));
          acc[order.supplier].total_days += daysLate;
          if (daysLate <= 0) acc[order.supplier].on_time++;
        }
        
        if (recv.status === 'Discrepancy') {
          acc[order.supplier].discrepancies++;
          acc[order.supplier].quality_score -= 5;
        }
      }
      
      return acc;
    }, {});

    // Calculate averages
    Object.keys(supplierMetrics).forEach(supplier => {
      const m = supplierMetrics[supplier];
      m.on_time_rate = m.total_orders > 0 ? Math.round((m.on_time / m.total_orders) * 100) : 0;
      m.avg_days_to_delivery = m.total_orders > 0 ? Math.round(m.total_days / m.total_orders) : 0;
      m.quality_score = Math.max(0, Math.min(100, m.quality_score));
    });

    const sorted = Object.entries(supplierMetrics)
      .map(([name, metrics]) => ({ name, ...metrics }))
      .sort((a, b) => b.quality_score - a.quality_score);

    setData(sorted);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading supplier performance…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25">
          <h3 className="text-sm font-semibold text-foreground">Supplier Scorecards</h3>
        </div>
        <div className="divide-y divide-border">
          {data?.map((supplier) => {
            const scoreColor = supplier.quality_score >= 90 ? 'text-green-700' 
              : supplier.quality_score >= 75 ? 'text-amber-700'
              : 'text-red-700';
            
            return (
              <div key={supplier.name} className="px-4 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{supplier.name}</p>
                    <p className="text-xs text-muted-foreground">{supplier.total_orders} orders</p>
                  </div>
                  <div className={`text-right`}>
                    <p className={`text-2xl font-bold ${scoreColor}`}>{supplier.quality_score}/100</p>
                    <p className="text-xs text-muted-foreground">Quality Score</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/30 p-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">On-Time Delivery</p>
                    <p className="font-bold text-foreground">{supplier.on_time_rate}%</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Avg Days Late</p>
                    <p className="font-bold text-foreground">{supplier.avg_days_to_delivery}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Discrepancies</p>
                    <p className="font-bold text-foreground">{supplier.discrepancies}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={loadData} disabled={loading} className="flex items-center gap-2 h-9 px-4 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-50">
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
      </button>
    </div>
  );
}