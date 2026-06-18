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
  const [window, setWindow] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterCostCentre, setFilterCostCentre] = useState('ALL');
  const [filterUser, setFilterUser] = useState('ALL');

  // Load all relevant record statuses: DRAFT, SUBMITTED, POSTED, REVERSED, REJECTED, AMENDED
  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.StockOutRecord.filter({
        status: 'DRAFT',
        environment: 'LIVE',
      }, '-created_date', 200),
      base44.entities.StockOutRecord.filter({
        status: 'SUBMITTED',
        environment: 'LIVE',
      }, '-created_date', 200),
      base44.entities.StockOutRecord.filter({
        status: 'POSTED',
        environment: 'LIVE',
      }, '-created_date', 200),
      base44.entities.StockOutRecord.filter({
        status: 'REVERSED',
        environment: 'LIVE',
      }, '-created_date', 200),
      base44.entities.StockOutRecord.filter({
        status: 'REJECTED',
        environment: 'LIVE',
      }, '-created_date', 200),
      base44.entities.StockOutRecord.filter({
        status: 'AMENDED',
        environment: 'LIVE',
      }, '-created_date', 200),
    ]).then(([draft, submitted, posted, reversed, rejected, amended]) => {
      const allRecords = [
        ...(draft || []),
        ...(submitted || []),
        ...(posted || []),
        ...(reversed || []),
        ...(rejected || []),
        ...(amended || []),
      ];
      setRecords(allRecords);
      setLoading(false);
    });
  }, [refreshTick]);

  const filteredRecords = useMemo(() => {
    const q = query.toLowerCase();
    const now = new Date();
    let cutoff = new Date(0); // No cutoff for ALL

    if (window === '7D') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (window === '30D') {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return records.filter(r => {
       const createdDate = new Date(r.created_date);
       const recordUser = r.submitted_by || r.posted_by || r.approved_by || r.created_by || 'Unknown';
       return (
         createdDate >= cutoff &&
         (filterType === 'ALL' || r.stock_out_class === filterType) &&
         (filterStatus === 'ALL' || r.status === filterStatus) &&
         (filterLocation === 'ALL' || (r.location === filterLocation)) &&
         (filterDepartment === 'ALL' || (r.department === filterDepartment)) &&
         (filterSource === 'ALL' || (r.source === filterSource)) &&
         (filterCostCentre === 'ALL' || (r.cost_centre === filterCostCentre)) &&
         (filterUser === 'ALL' || (recordUser === filterUser)) &&
         ((r.sku || '').toLowerCase().includes(q) ||
           (r.item_name || '').toLowerCase().includes(q) ||
           (r.reason_category || '').toLowerCase().includes(q) ||
           (r.location && r.location.toLowerCase().includes(q)) ||
           (r.department && r.department.toLowerCase().includes(q)))
       );
     });
    }, [records, query, window, filterType, filterStatus, filterLocation, filterDepartment, filterSource, filterCostCentre, filterUser]);

  const grouped = useMemo(() => {
    const groups = {};
    filteredRecords.forEach(r => {
      let key;
      if (groupBy === 'sku') {
        key = r.sku;
      } else if (groupBy === 'item') {
        key = r.item_name;
      } else if (groupBy === 'reason') {
        key = r.reason_category;
      } else if (groupBy === 'user') {
        key = r.submitted_by || r.posted_by || r.approved_by || r.created_by || 'Unknown';
      } else if (groupBy === 'location') {
        key = r.location || 'N/A';
      } else if (groupBy === 'source') {
        key = r.source;
      } else if (groupBy === 'department') {
        key = r.department || 'N/A';
      } else if (groupBy === 'costcentre') {
        key = r.cost_centre || 'N/A';
      } else if (groupBy === 'status') {
        key = r.status;
      } else if (groupBy === 'type') {
        key = r.stock_out_class;
      } else {
        key = r.reason_category;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(r);
    });
    return groups;
  }, [filteredRecords, groupBy]);

  const summary = useMemo(() => {
    // Gross: includes POSTED, REVERSED, and AMENDED (records that originally posted stock out)
    const grossRecords = filteredRecords.filter(r => r.status === 'POSTED' || r.status === 'REVERSED' || r.status === 'AMENDED');
    const grossQty = grossRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const grossValue = grossRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);

    // Reversed: records with REVERSED status
    const reversedRecords = filteredRecords.filter(r => r.status === 'REVERSED');
    const reversedQty = reversedRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const reversedValue = reversedRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);

    // Net = Gross - Reversed
    const netQty = grossQty - reversedQty;
    const netValue = grossValue - reversedValue;

    // Wastage breakdowns: gross/reversed/net plus pending/rejected audit visibility
    const wastageGrossRecords = grossRecords.filter(r => r.stock_out_class === 'WASTAGE');
    const wastageGrossValue = wastageGrossRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);
    const wastageGrossQty = wastageGrossRecords.reduce((s, r) => s + (r.quantity || 0), 0);

    const wastageReversedRecords = reversedRecords.filter(r => r.stock_out_class === 'WASTAGE');
    const wastageReversedValue = wastageReversedRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);

    const wastageNetValue = wastageGrossValue - wastageReversedValue;
    const wastageNetQty = wastageGrossQty - wastageReversedRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const wastagePendingRecords = filteredRecords.filter(r => r.stock_out_class === 'WASTAGE' && (r.status === 'DRAFT' || r.status === 'SUBMITTED'));
    const wastagePendingValue = wastagePendingRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);
    const wastagePendingQty = wastagePendingRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const wastageRejectedRecords = filteredRecords.filter(r => r.stock_out_class === 'WASTAGE' && r.status === 'REJECTED');
    const wastageRejectedValue = wastageRejectedRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);
    const wastageRejectedQty = wastageRejectedRecords.reduce((s, r) => s + (r.quantity || 0), 0);

    // Store Use breakdowns: gross/reversed/net plus pending/rejected audit visibility
    const storeUseGrossRecords = grossRecords.filter(r => r.stock_out_class === 'STORE_USE');
    const storeUseGrossValue = storeUseGrossRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);
    const storeUseGrossQty = storeUseGrossRecords.reduce((s, r) => s + (r.quantity || 0), 0);

    const storeUseReversedRecords = reversedRecords.filter(r => r.stock_out_class === 'STORE_USE');
    const storeUseReversedValue = storeUseReversedRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);

    const storeUseNetValue = storeUseGrossValue - storeUseReversedValue;
    const storeUseNetQty = storeUseGrossQty - storeUseReversedRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const storeUsePendingRecords = filteredRecords.filter(r => r.stock_out_class === 'STORE_USE' && (r.status === 'DRAFT' || r.status === 'SUBMITTED'));
    const storeUsePendingValue = storeUsePendingRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);
    const storeUsePendingQty = storeUsePendingRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const storeUseRejectedRecords = filteredRecords.filter(r => r.stock_out_class === 'STORE_USE' && r.status === 'REJECTED');
    const storeUseRejectedValue = storeUseRejectedRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);
    const storeUseRejectedQty = storeUseRejectedRecords.reduce((s, r) => s + (r.quantity || 0), 0);

    // Pending approval (not in gross/net)
    const pendingRecords = filteredRecords.filter(r => r.status === 'SUBMITTED' || r.status === 'DRAFT');
    const pendingQty = pendingRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const pendingValue = pendingRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);

    // Rejected (not in gross/net)
    const rejectedRecords = filteredRecords.filter(r => r.status === 'REJECTED');
    const rejectedQty = rejectedRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const rejectedValue = rejectedRecords.reduce((s, r) => s + (r.estimated_value || 0), 0);

    // Total quantity across all
    const totalQty = filteredRecords.reduce((s, r) => s + (r.quantity || 0), 0);

    return {
      total: filteredRecords.length,
      totalQty,
      grossQty,
      grossValue,
      reversedQty,
      reversedValue,
      netQty,
      netValue,
      wastageGrossValue,
      wastageReversedValue,
      wastageNetValue,
      wastagePendingQty,
      wastagePendingValue,
      wastageRejectedQty,
      wastageRejectedValue,
      storeUseGrossValue,
      storeUseReversedValue,
      storeUseNetValue,
      storeUsePendingQty,
      storeUsePendingValue,
      storeUseRejectedQty,
      storeUseRejectedValue,
      pendingQty,
      pendingValue,
      rejectedQty,
      rejectedValue,
    };
  }, [filteredRecords]);

  // Extract unique values for filters
   const uniqueLocations = [...new Set(records.filter(r => r.location).map(r => r.location))];
   const uniqueDepartments = [...new Set(records.filter(r => r.department).map(r => r.department))];
   const uniqueSources = [...new Set(records.map(r => r.source))];
   const uniqueCostCentres = [...new Set(records.filter(r => r.cost_centre).map(r => r.cost_centre))];
   const uniqueUsers = [...new Set(records.map(r => r.submitted_by || r.posted_by || r.approved_by || r.created_by || 'Unknown'))];

  const handleExport = async () => {
    try {
      // Create CSV from filtered records with complete columns
      const headers = [
        'Record ID',
        'Type',
        'Status',
        'SKU',
        'Item Name',
        'Quantity',
        'Unit Cost',
        'Total Value',
        'Gross Value',
        'Reversed Value',
        'Net Value',
        'Reason',
        'User',
        'Location',
        'Department',
        'Cost Centre',
        'Source',
        'Created Date',
        'Submitted Date',
        'Posted Date',
        'Reversed Date',
      ];

      const rows = filteredRecords.map(r => {
        const costPerUnit = r.estimated_value && r.quantity ? (r.estimated_value / r.quantity) : 0;
        const recordUser = r.submitted_by || r.posted_by || r.approved_by || r.created_by || 'Unknown';
        
        // For gross/reversed/net: calculate if this record is reversed
        let grossValue = 0;
        let reversedValue = 0;
        let netValue = 0;
        if (r.status === 'POSTED' || r.status === 'REVERSED' || r.status === 'AMENDED') {
          grossValue = r.estimated_value || 0;
          if (r.status === 'REVERSED') {
            reversedValue = r.estimated_value || 0;
            netValue = 0;
          } else {
            netValue = r.estimated_value || 0;
          }
        }

        return [
          r.id,
          r.stock_out_class,
          r.status,
          r.sku,
          r.item_name,
          r.quantity,
          costPerUnit.toFixed(2),
          (r.estimated_value || 0).toFixed(2),
          grossValue.toFixed(2),
          reversedValue.toFixed(2),
          netValue.toFixed(2),
          r.reason_category,
          recordUser,
          r.location || '',
          r.department || '',
          r.cost_centre || '',
          r.source,
          new Date(r.created_date).toLocaleDateString(),
          r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '',
          (r.posted_at || r.approved_at) ? new Date(r.posted_at || r.approved_at).toLocaleDateString() : '',
          r.reversed_at ? new Date(r.reversed_at).toLocaleDateString() : '',
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stock-out-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      try {
        const me = await base44.auth.me();
        await base44.entities.AuditLog.create({
          item_id: '', sku: '', item_name: '', change_type: 'STOCK_WASTE', field_name: 'report_export',
          old_value: '', new_value: `${filteredRecords.length} rows`, changed_by: me?.email || me?.id || 'current_user',
          actor_role: me?.role || 'unknown', source_module: 'StockOutReports', action_type: 'REPORT_EXPORTED',
          linked_source_record: 'stock-out-report', source_record_id: 'stock-out-report',
          notes: `CSV export generated from filtered Stock-Out report dataset. Rows: ${filteredRecords.length}`,
          environment: 'LIVE',
        });
      } catch (_) {}
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
          <p className="text-xs text-muted-foreground mt-2">{summary.netQty} units after reversals</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-700">₱{summary.pendingValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{summary.pendingQty} units awaiting</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Rejected Value</p>
          <p className="text-2xl font-bold text-muted-foreground">₱{summary.rejectedValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{summary.rejectedQty} units rejected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Wastage Gross</p>
          <p className="text-2xl font-bold text-foreground">₱{summary.wastageGrossValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Posted + reversed</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Wastage Reversed</p>
          <p className="text-2xl font-bold text-red-700">₱{summary.wastageReversedValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Restored</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Wastage Net</p>
          <p className="text-2xl font-bold text-green-700">₱{summary.wastageNetValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">After reversals</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Store Use Gross</p>
          <p className="text-2xl font-bold text-foreground">₱{summary.storeUseGrossValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Posted + reversed</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Store Use Reversed</p>
          <p className="text-2xl font-bold text-red-700">₱{summary.storeUseReversedValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Restored</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Store Use Net</p>
          <p className="text-2xl font-bold text-green-700">₱{summary.storeUseNetValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">After reversals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Wastage Pending</p>
          <p className="text-2xl font-bold text-amber-700">₱{summary.wastagePendingValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{summary.wastagePendingQty} units draft/submitted</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Wastage Rejected</p>
          <p className="text-2xl font-bold text-muted-foreground">₱{summary.wastageRejectedValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{summary.wastageRejectedQty} units rejected</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Store Use Pending</p>
          <p className="text-2xl font-bold text-amber-700">₱{summary.storeUsePendingValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{summary.storeUsePendingQty} units draft/submitted</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Store Use Rejected</p>
          <p className="text-2xl font-bold text-muted-foreground">₱{summary.storeUseRejectedValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{summary.storeUseRejectedQty} units rejected</p>
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
              onClick={handleExport}
              className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1 font-medium"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by SKU, item, reason, location, or department..."
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
              <select
                value={window}
                onChange={(e) => setWindow(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-xs"
              >
                <option value="7D">Last 7 days</option>
                <option value="30D">Last 30 days</option>
                <option value="ALL">All time</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-xs"
              >
                <option value="ALL">Type: All</option>
                <option value="WASTAGE">Wastage</option>
                <option value="STORE_USE">Store Use</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-xs"
              >
                <option value="ALL">Status: All</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="POSTED">Posted</option>
                <option value="REVERSED">Reversed</option>
                <option value="AMENDED">Amended</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-xs"
              >
                <option value="ALL">Location: All</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-xs"
              >
                <option value="ALL">Dept: All</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-xs"
              >
                <option value="ALL">Source: All</option>
                {uniqueSources.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>

              <select
                value={filterCostCentre}
                onChange={(e) => setFilterCostCentre(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-xs"
              >
                <option value="ALL">Cost Centre: All</option>
                {uniqueCostCentres.map(cc => (
                  <option key={cc} value={cc}>{cc}</option>
                ))}
              </select>

              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="h-9 px-2 rounded border border-input bg-background text-xs"
              >
                <option value="ALL">User: All</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
              </div>

            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="h-9 px-2 rounded border border-input bg-background text-xs w-full md:w-auto"
            >
              <option value="reason">Group by Reason</option>
              <option value="sku">Group by SKU</option>
              <option value="item">Group by Item</option>
              <option value="user">Group by User</option>
              <option value="location">Group by Location</option>
              <option value="source">Group by Source</option>
              <option value="department">Group by Department</option>
              <option value="costcentre">Group by Cost Centre</option>
              <option value="status">Group by Status</option>
              <option value="type">Group by Type</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No records match filters</p>
              <p className="text-xs text-muted-foreground">Try adjusting date range or filters</p>
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