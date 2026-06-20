import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  FileSpreadsheet,
  History,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CostAnalysisReport from '@/components/CostAnalysisReport';
import StockAgingReport from '@/components/StockAgingReport';
import SupplierPerformanceReport from '@/components/SupplierPerformanceReport';
import ComplianceReport from '@/components/ComplianceReport';
import AuditSummaryDashboard from '@/components/AuditSummaryDashboard';
import InventoryValueBySite from '@/components/InventoryValueBySite';
import ValuationHistory from '@/components/ValuationHistory';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('cost');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  const tabs = [
    {
      id: 'cost',
      label: 'Cost Analysis',
      shortLabel: 'Costs',
      icon: TrendingDown,
      description: 'Inventory value, high-value stock, and reorder-cost pressure.',
    },
    {
      id: 'site-values',
      label: 'By Site',
      shortLabel: 'Sites',
      icon: Building2,
      description: 'Location-level stock value and site concentration visibility.',
    },
    {
      id: 'valuation',
      label: 'Valuation History',
      shortLabel: 'Valuation',
      icon: History,
      description: 'Recent price and stock movement events affecting valuation.',
    },
    {
      id: 'aging',
      label: 'Stock Aging',
      shortLabel: 'Aging',
      icon: BarChart3,
      description: 'Age bands for stock that has not moved recently.',
    },
    {
      id: 'supplier',
      label: 'Supplier Scorecards',
      shortLabel: 'Suppliers',
      icon: CheckCircle2,
      description: 'Supplier delivery, discrepancy, and quality-score monitoring.',
    },
    {
      id: 'compliance',
      label: 'Compliance Overview',
      shortLabel: 'Compliance',
      icon: AlertCircle,
      description: 'Receiving, movement integrity, and unresolved discrepancy checks.',
    },
    {
      id: 'audit',
      label: 'Audit Summary',
      shortLabel: 'Audit',
      icon: ClipboardCheck,
      description: 'Governance visibility for audit events and controlled changes.',
    },
  ];

  const activeReport = tabs.find(tab => tab.id === activeTab) || tabs[0];
  const ActiveIcon = activeReport.icon;

  const dateStr = new Date().toISOString().split('T')[0];

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('generateCompleteReport', { report_type: activeTab });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report-${dateStr}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
    setExporting(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const el = reportRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgWidth = pageWidth;
      const imgHeight = imgWidth / ratio;

      let y = 0;
      let remaining = imgHeight;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight);
        remaining -= pageHeight;
        y += pageHeight;
        if (remaining > 0) pdf.addPage();
      }

      pdf.save(`${activeTab}-report-${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setExporting(false);
  };

  return (
    <div className="w-full max-w-none px-5 py-5 lg:px-8 space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Advanced Reporting</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Cost analysis, inventory aging, supplier performance, and compliance visibility.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={exporting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 xl:mt-1"
            >
              <Download size={15} />
              {exporting ? 'Exporting…' : 'Export'}
              <ChevronDown size={13} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
              <FileSpreadsheet size={14} className="text-emerald-600" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
              <FileText size={14} className="text-red-500" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/45 hover:text-foreground'
                }`}
              >
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground'}`}>
                  <Icon size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate xl:hidden">{tab.shortLabel}</span>
                  <span className="hidden truncate xl:block">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 border-b border-border bg-muted/20 px-5 py-4">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ActiveIcon size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{activeReport.label}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{activeReport.description}</p>
          </div>
        </div>

        <div className="p-5" ref={reportRef}>
          {activeTab === 'cost' && <CostAnalysisReport />}
          {activeTab === 'site-values' && <InventoryValueBySite />}
          {activeTab === 'valuation' && <ValuationHistory />}
          {activeTab === 'aging' && <StockAgingReport />}
          {activeTab === 'supplier' && <SupplierPerformanceReport />}
          {activeTab === 'compliance' && <ComplianceReport />}
          {activeTab === 'audit' && <AuditSummaryDashboard />}
        </div>
      </div>
    </div>
  );
}