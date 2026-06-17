import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function WastageTab({ refreshTick }) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    base44.entities.StockOutRecord.filter({
      stock_out_class: 'WASTAGE',
      environment: 'LIVE',
    }, '-created_date', 50).then(data => {
      setRecords(data || []);
      setLoading(false);
    });
  }, [refreshTick]);

  const statusColors = {
    DRAFT: 'bg-slate-50 text-slate-700 border-slate-200',
    SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
    POSTED: 'bg-green-50 text-green-700 border-green-200',
    AMENDED: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const filteredRecords = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter(r =>
      r.sku.toLowerCase().includes(q) ||
      r.item_name.toLowerCase().includes(q) ||
      r.reason_category.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q)
    );
  }, [records, query]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Wastage</p>
          <p className="text-2xl font-bold text-foreground">{records.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Stock-out records</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-700">{records.filter(r => r.status === 'SUBMITTED').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting decision</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Posted</p>
          <p className="text-2xl font-bold text-green-700">{records.filter(r => r.status === 'POSTED').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Stock impact recorded</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Value</p>
          <p className="text-2xl font-bold text-foreground">₱{records.reduce((s, r) => s + (r.estimated_value || 0), 0).toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Estimated cost</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Wastage Ledger</p>
              <p className="text-xs text-muted-foreground mt-1">All wastage records across all stages</p>
            </div>
            <span className="text-xs text-muted-foreground">{filteredRecords.length} visible</span>
          </div>
        </div>

        <div className="p-4">
          <div className="relative w-full mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by SKU, item, reason, or location..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No wastage records</p>
              <p className="text-xs text-muted-foreground">Start by creating a new wastage record</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div key={record.id} className="p-4 rounded-xl border border-border bg-background/40 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm">{record.item_name}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">WASTAGE</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColors[record.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{record.sku} · {record.location}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-semibold text-foreground">{record.quantity} units</p>
                      <p className="text-xs text-muted-foreground">₱{record.estimated_value?.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <span>{record.reason_category}</span>
                    <span>{new Date(record.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}