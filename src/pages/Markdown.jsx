import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, ClipboardList, Printer, BarChart3, Settings } from 'lucide-react';

const TABS = [
  { id: 'batches',    label: 'Active Batches',   icon: Tag,           path: '/Markdown/Batches' },
  { id: 'review',     label: 'Review Queue',      icon: ClipboardList, path: '/Markdown/ReviewQueue' },
  { id: 'monitor',    label: 'Monitor Sheet',     icon: Printer,       path: '/Markdown/Monitor' },
  { id: 'reports',    label: 'Reports',           icon: BarChart3,     path: '/Markdown/Reports' },
  { id: 'tests',      label: 'Acceptance Tests',  icon: Settings,      path: '/Markdown/Tests' },
];

export default function Markdown() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Markdown & Waste Prevention</h1>
        <p className="text-sm text-muted-foreground mt-1">Phase 1 — Operational Markdown Workflow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-primary/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon size={22} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}