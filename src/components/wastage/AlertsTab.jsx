import { useState } from 'react';

export default function AlertsTab({ refreshTick }) {
  return (
    <div className="border border-border rounded-2xl bg-card">
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <p className="text-sm font-medium text-foreground">Wastage Alert Rules</p>
        <p className="text-xs text-muted-foreground mt-1">Coming soon — Moved from Wastage page alerts surface</p>
      </div>
      <div className="p-12 text-center">
        <p className="text-base font-medium text-foreground mb-1">Alert Rules Coming Soon</p>
        <p className="text-sm text-muted-foreground">Alert configuration and instance monitoring will be available in a future update.</p>
      </div>
    </div>
  );
}