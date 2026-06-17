import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Download, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ReportsTab({ refreshTick }) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('reason');
  const [window, setWindow] = useState('30D');

  useEffect(() => {
    setLoading(true);
    base44.entities.StockOutRecord.filter({
      status: 'POSTED',
      environment: 'LIVE',
    }, '-created_date', 200).then(data => {
      setRecords(data || []);
      setLoading(false);
    });
  }, [refreshTick]);

  const filteredRecords = useMemo(() => {
    const q = query.toLowerCase();
    const now = new Date();
    const daysDiff = window === '7D' ? 7 : 30;
    const cutoff = new Date(now.getTime() - daysDiff * 24 * 60 * 60 * 1000);

    return records.filter(r => {
      const createdDate = new Date(r.created_date);
      return createdDate >= cutoff && (
        r.sku.toLowerCase().includes(q) ||
        r.item_name.toLowerCase().includes(q) ||
        r.reason_category.toLowerCase().includes(q) ||
        (r.location && r.location.toLowerCase().includes(q))
      );
    });
  }, [records, query, window]);

  const grouped = useMemo(() => {
    const groups = {};
    filteredRecords.forEach(r => {
      const key = groupBy === 'sku' ? r.sku : groupBy === 'location' ? (r.location || 'N/A') : r.reason_category;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(r);
    });
    return groups;
  }, [filteredRecords, groupBy]);

  const summary = useMemo(() => {
    // Gross: all posted records before reversals
    const postedRecords = filteredRecords.filter(r => r.status === 'POSTED');
    const grossQty = postedRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const grossValue = postedRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);

    // Reversed: records with REVERSED status
    const reversedRecords = filteredRecords.filter(r => r.status === 'REVERSED');
    const reversedQty = reversedRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const reversedValue = reversedRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);

    // Net = Gross - Reversed
    const netQty = grossQty - reversedQty;
    const netValue = grossValue - reversedValue;

    // Wastage vs Store Use
    const wastageValue = filteredRecords.filter(r => r.stock_out_class === 'WASTAGE').reduce((s, r) => s + (r.estimated_value || 0), 0);
    const storeUseValue = filteredRecords.filter(r => r.stock_out_class === 'STORE_USE').reduce((s, r) => s + (r.estimated_value || 0), 0);

    // Pending approval
    const pendingValue = filteredRecords.filter(r => r.status === 'SUBMITTED' || r.status === 'DRAFT').reduce((s, r) => s + (r.estimated_value || 0), 0);

    return {
      total: filteredRecords.length,
      grossQty,
      grossValue,
      reversedQty,
      reversedValue,
      netQty,
      netValue,
      wastageValue,
      storeUseValue,
      pendingValue,
    };
  }, [filteredRecords]);

  const handleExport = async (format) => {
    try {
      const response = await base44.functions.invoke('exportWastageCSV', {
        records: filteredRecords.map(r => ({
          id: r.id,
          sku: r.sku,
          item_name: r.item_name,
          quantity: r.quantity,
          reason_category: r.reason_category,
          location: r.location,
          status: r.status,
          created_date: r.created_date,
          estimated_value: r.estimated_value,
        })),
      });
      if (response.data.csv_url) {
        window.open(response.data.csv_url, '_blank');
        toast.success('Export ready for download');
      }
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Gross Value</p>
          <p className="text-2xl font-bold text-foreground">₱{summary.grossValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{summary.grossQty} units posted</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Reversed Value</p>
          <p className="text-2xl font-bold text-red-700">₱{summary.reversedValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{summary.reversedQty} units reversed</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Net Value</p>
          <p className="text-2xl font-bold text-green-700">₱{summary.netValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">After reversals</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-700">₱{summary.pendingValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Wastage Value</p>
          <p className="text-2xl font-bold text-foreground">₱{summary.wastageValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Damaged, expired, spoiled</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Store Use Value</p>
          <p className="text-2xl font-bold text-foreground">₱{summary.storeUseValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Staff use, cleaning, etc.</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Records</p>
          <p className="text-2xl font-bold text-foreground">{summary.total}</p>
          <p className="text-xs text-muted-foreground mt-2">In selected period</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-max">
              <p className="text-sm font-medium text-foreground">Stock-Out Analysis</p>
              <p className="text-xs text-muted-foreground mt-1">Grouped and filterable reports</p>
            </div>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1 font-medium"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by SKU, item, reason, or location..."
                className="pl-9"
              />
            </div>

            <select
              value={window}
              onChange={(e) => setWindow(e.target.value)}
              className="h-10 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="7D">Last 7 days</option>
              <option value="30D">Last 30 days</option>
              <option value="ALL">All time</option>
            </select>

            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="h-10 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="reason">Group by Reason</option>
              <option value="sku">Group by SKU</option>
              <option value="location">Group by Location</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No records in this period</p>
              <p className="text-xs text-muted-foreground">Try adjusting filters or time window</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped)
                .sort(([, a], [, b]) => (b.reduce((s, r) => s + (r.estimated_value || 0), 0)) - (a.reduce((s, r) => s + (r.estimated_value || 0), 0)))
                .map(([key, items]) => {
                  const groupQty = items.reduce((s, r) => s + (r.quantity || 0), 0);
                  const groupValue = items.reduce((s, r) => s + (r.estimated_value || 0), 0);
                  const percentage = summary.netValue > 0 ? (groupValue / summary.netValue) * 100 : 0;
                  return (
                    <div key={key} className="border border-border rounded-xl p-4 bg-background/40">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-medium text-foreground text-sm flex items-center gap-2">
                            {key}
                            <TrendingUp size={14} className="text-muted-foreground" />
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{items.length} records · {groupQty} units · {percentage.toFixed(1)}%</p>
                        </div>
                        <p className="font-semibold text-foreground whitespace-nowrap">₱{groupValue.toFixed(0)}</p>
                      </div>
                      <div className="w-full bg-muted rounded h-2">
                        <div
                          className="bg-primary h-2 rounded"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
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