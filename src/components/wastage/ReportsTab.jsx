import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Download } from 'lucide-react';

export default function ReportsTab({ refreshTick }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.StockOutRecord.filter({ environment: 'LIVE', status: 'POSTED' }, '-created_date', 200),
    ]).then(([allRecords]) => {
      setRecords(allRecords || []);
      setLoading(false);
    });
  }, [refreshTick]);

  const wastageRecords = records.filter(r => r.stock_out_class === 'WASTAGE');
  const storeUseRecords = records.filter(r => r.stock_out_class === 'STORE_USE');

  const wastageStats = {
    gross_qty: wastageRecords.reduce((s, r) => s + (r.quantity || 0), 0),
    gross_value: wastageRecords.reduce((s, r) => s + (r.estimated_value || 0), 0),
    record_count: wastageRecords.length,
  };

  const storeUseStats = {
    gross_qty: storeUseRecords.reduce((s, r) => s + (r.quantity || 0), 0),
    gross_value: storeUseRecords.reduce((s, r) => s + (r.estimated_value || 0), 0),
    record_count: storeUseRecords.length,
  };

  const combined = {
    gross_qty: wastageStats.gross_qty + storeUseStats.gross_qty,
    gross_value: wastageStats.gross_value + storeUseStats.gross_value,
    record_count: wastageStats.record_count + storeUseStats.record_count,
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wastage Summary */}
        <div className="border border-border rounded-2xl bg-card p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-3">Wastage Summary</p>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Gross Quantity</p>
                <p className="text-2xl font-bold text-foreground">{wastageStats.gross_qty}</p>
                <p className="text-xs text-muted-foreground mt-1">units</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Gross Value</p>
                <p className="text-2xl font-bold text-red-700">₱{wastageStats.gross_value.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Records</p>
                <p className="text-lg font-bold text-foreground">{wastageStats.record_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store Use Summary */}
        <div className="border border-border rounded-2xl bg-card p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-3">Store Use Summary</p>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Gross Quantity</p>
                <p className="text-2xl font-bold text-foreground">{storeUseStats.gross_qty}</p>
                <p className="text-xs text-muted-foreground mt-1">units</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Gross Value</p>
                <p className="text-2xl font-bold text-blue-700">₱{storeUseStats.gross_value.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Records</p>
                <p className="text-lg font-bold text-foreground">{storeUseStats.record_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Summary */}
        <div className="border border-border rounded-2xl bg-card p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-3">Combined Stock-Out</p>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Total Quantity</p>
                <p className="text-2xl font-bold text-foreground">{combined.gross_qty}</p>
                <p className="text-xs text-muted-foreground mt-1">units</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Total Value</p>
                <p className="text-2xl font-bold text-amber-700">₱{combined.gross_value.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Total Records</p>
                <p className="text-lg font-bold text-foreground">{combined.record_count}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Reason */}
        <div className="border border-border rounded-2xl bg-card">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <p className="text-sm font-medium text-foreground">Breakdown by Reason</p>
            <p className="text-xs text-muted-foreground mt-1">Gross quantity and value by stock-out reason</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">Reason</th>
                  <th className="text-right px-4 py-2.5 font-medium whitespace-nowrap">Qty</th>
                  <th className="text-right px-4 py-2.5 font-medium whitespace-nowrap">Value</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(records.map(r => r.reason_category))).map(reason => {
                  const subset = records.filter(r => r.reason_category === reason);
                  return (
                    <tr key={reason} className="border-t border-border">
                      <td className="px-4 py-3 text-foreground">{reason}</td>
                      <td className="px-4 py-3 text-right text-foreground font-medium">{subset.reduce((s, r) => s + (r.quantity || 0), 0)}</td>
                      <td className="px-4 py-3 text-right text-foreground font-medium">₱{subset.reduce((s, r) => s + (r.estimated_value || 0), 0).toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* By SKU */}
        <div className="border border-border rounded-2xl bg-card">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <p className="text-sm font-medium text-foreground">Breakdown by SKU</p>
            <p className="text-xs text-muted-foreground mt-1">Top affected items by quantity and value</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">SKU</th>
                  <th className="text-right px-4 py-2.5 font-medium whitespace-nowrap">Qty</th>
                  <th className="text-right px-4 py-2.5 font-medium whitespace-nowrap">Value</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(records.map(r => r.sku))).slice(0, 10).map(sku => {
                  const subset = records.filter(r => r.sku === sku);
                  return (
                    <tr key={sku} className="border-t border-border">
                      <td className="px-4 py-3 text-foreground font-medium">{sku}</td>
                      <td className="px-4 py-3 text-right text-foreground">{subset.reduce((s, r) => s + (r.quantity || 0), 0)}</td>
                      <td className="px-4 py-3 text-right text-foreground">₱{subset.reduce((s, r) => s + (r.estimated_value || 0), 0).toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground">
          <Download size={14} /> Export CSV
        </button>
        <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground">
          <Download size={14} /> Export PDF
        </button>
      </div>
    </div>
  );
}