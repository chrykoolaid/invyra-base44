import { ArrowLeft, BarChart3, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MarkdownMonitor() {
  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Monitor Sheet Moved</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Printable markdown monitoring is now consolidated in Markdown Reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/Markdown"
            className="flex items-center gap-1.5 h-9 px-3 text-sm border border-border rounded-lg bg-card hover:bg-muted text-foreground"
          >
            <ArrowLeft size={14} /> Back to Markdown
          </Link>
          <Link
            to="/Markdown/Reports"
            className="flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            <BarChart3 size={14} /> Open Reports
          </Link>
        </div>
      </div>

      <section className="border border-border rounded-2xl bg-card p-6 max-w-3xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText size={22} />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Monitor Sheet has moved to Reports → Print Take-Off Sheet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                The standalone Printable Monitor Sheet is deprecated to avoid duplicate reporting pages. Use Markdown Reports for date filters, daily/weekly/monthly grouping, printable reports, CSV export, Take-Off Sheets, and holiday or closed-store planning.
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Existing bookmarks to /Markdown/Monitor are preserved, but staff should use Reports as the single place for printable markdown outputs.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
