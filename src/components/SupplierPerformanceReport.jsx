import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { CheckCircle2, Clock3, PackageCheck, RefreshCw, TriangleAlert } from 'lucide-react';

export default function SupplierPerformanceReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const orders = await base44.entities.PurchaseOrder.filter(envFilter(), '-submitted_at', 500);
    const receiving = await base44.entities.ReceivingRecord.filter(envFilter(), '-confirmed_at', 500);

    const supplierMetrics = orders.reduce((acc, order) => {
      const supplierName = order.supplier || 'Unassigned supplier';
      if (!acc[supplierName]) {
        acc[supplierName] = {
          total_orders: 0,
          on_time: 0,
          received_orders: 0,
          discrepancies: 0,
          avg_days_to_delivery: 0,
          quality_score: 100,
          total_days: 0,
        };
      }

      acc[supplierName].total_orders++;

      const recv = receiving.find(r => r.po_number === order.order_number);
      if (recv) {
        acc[supplierName].received_orders++;

        if (recv.confirmed_at && order.expected_date) {
          const daysLate = Math.max(0, (new Date(recv.confirmed_at) - new Date(order.expected_date)) / (1000 * 60 * 60 * 24));
          acc[supplierName].total_days += daysLate;
          if (daysLate <= 0) acc[supplierName].on_time++;
        }

        if (recv.status === 'Discrepancy') {
          acc[supplierName].discrepancies++;
          acc[supplierName].quality_score -= 5;
        }
      }

      return acc;
    }, {});

    // Calculate averages
    Object.keys(supplierMetrics).forEach(supplier => {
      const m = supplierMetrics[supplier];
      m.on_time_rate = m.received_orders > 0 ? Math.round((m.on_time / m.received_orders) * 100) : 0;
      m.avg_days_to_delivery = m.received_orders > 0 ? Math.round(m.total_days / m.received_orders) : 0;
      m.quality_score = Math.max(0, Math.min(100, m.quality_score));
    });

    const sorted = Object.entries(supplierMetrics)
      .map(([name, metrics]) => ({ name, ...metrics }))
      .sort((a, b) => b.quality_score - a.quality_score || b.total_orders - a.total_orders);

    setData(sorted);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        Loading supplier performance…
      </div>
    );
  }

  const suppliers = data || [];
  const totalOrders = suppliers.reduce((sum, supplier) => sum + supplier.total_orders, 0);
  const totalReceived = suppliers.reduce((sum, supplier) => sum + supplier.received_orders, 0);
  const totalDiscrepancies = suppliers.reduce((sum, supplier) => sum + supplier.discrepancies, 0);
  const averageQuality = suppliers.length > 0
    ? Math.round(suppliers.reduce((sum, supplier) => sum + supplier.quality_score, 0) / suppliers.length)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Suppliers</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{suppliers.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">With purchase orders</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Orders Reviewed</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalOrders}</p>
          <p className="mt-1 text-xs text-muted-foreground">{totalReceived} received</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Avg Quality</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{averageQuality}/100</p>
          <p className="mt-1 text-xs text-muted-foreground">Across active suppliers</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Discrepancies</p>
          <p className={`mt-1 text-2xl font-bold ${totalDiscrepancies > 0 ? 'text-amber-700' : 'text-foreground'}`}>{totalDiscrepancies}</p>
          <p className="mt-1 text-xs text-muted-foreground">Receiving exceptions</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border bg-muted/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Supplier Scorecards</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Scores are calculated from purchase orders and confirmed receiving records.</p>
          </div>
          <button onClick={loadData} disabled={loading} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PackageCheck size={19} />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">No supplier scorecards yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Supplier performance will appear after purchase orders and receiving confirmations exist for this environment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {suppliers.map((supplier) => {
              const scoreTone = supplier.quality_score >= 90
                ? 'text-green-700 bg-green-50 border-green-200'
                : supplier.quality_score >= 75
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-red-700 bg-red-50 border-red-200';
              const scoreIcon = supplier.quality_score >= 75 ? CheckCircle2 : TriangleAlert;
              const ScoreIcon = scoreIcon;

              return (
                <div key={supplier.name} className="px-4 py-4 transition hover:bg-muted/25">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{supplier.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {supplier.total_orders} orders • {supplier.received_orders} received
                      </p>
                    </div>
                    <div className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 ${scoreTone}`}>
                      <ScoreIcon size={15} />
                      <div className="text-right leading-none">
                        <p className="text-lg font-bold">{supplier.quality_score}/100</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">Quality</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 size={13} />
                        <p className="text-[10px] font-semibold uppercase tracking-wide">On-Time Delivery</p>
                      </div>
                      <p className="mt-1 font-bold text-foreground">{supplier.on_time_rate}%</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock3 size={13} />
                        <p className="text-[10px] font-semibold uppercase tracking-wide">Avg Days Late</p>
                      </div>
                      <p className="mt-1 font-bold text-foreground">{supplier.avg_days_to_delivery}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TriangleAlert size={13} />
                        <p className="text-[10px] font-semibold uppercase tracking-wide">Discrepancies</p>
                      </div>
                      <p className="mt-1 font-bold text-foreground">{supplier.discrepancies}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
