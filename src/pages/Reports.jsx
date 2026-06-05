import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingDown, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import CostAnalysisReport from '@/components/CostAnalysisReport';
import StockAgingReport from '@/components/StockAgingReport';
import SupplierPerformanceReport from '@/components/SupplierPerformanceReport';
import ComplianceReport from '@/components/ComplianceReport';
import AuditSummaryDashboard from '@/components/AuditSummaryDashboard';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('cost');
  const [exporting, setExporting] = useState(false);

  const tabs = [
    { id: 'cost', label: 'Cost Analysis', icon: TrendingDown },
    { id: 'aging', label: 'Stock Aging', icon: BarChart3 },
    { id: 'supplier', label: 'Supplier Scorecards', icon: CheckCircle2 },
    { id: 'compliance', label: 'Compliance Overview', icon: AlertCircle },
    { id: 'audit', label: 'Audit Summary', icon: BarChart3 },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('generateCompleteReport', { report_type: activeTab });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  };

  return (
    <div className="p-5 lg:p-6 max-w-[1400px] space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Advanced Reporting</h1>
        <p className="text-sm text-muted-foreground">Cost analysis, inventory aging, supplier performance, and compliance visibility.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between gap-4 border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium"
        >
          <Download size={14} />
          {exporting ? 'Exporting…' : 'Export'}
        </button>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden p-6">
        {activeTab === 'cost' && <CostAnalysisReport />}
        {activeTab === 'aging' && <StockAgingReport />}
        {activeTab === 'supplier' && <SupplierPerformanceReport />}
        {activeTab === 'compliance' && <ComplianceReport />}
        {activeTab === 'audit' && <AuditSummaryDashboard />}
      </div>
    </div>
  );
}