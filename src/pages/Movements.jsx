import LedgerViewer from '@/components/LedgerViewer';

export default function Movements() {
  return (
    <div className="p-5 lg:p-6 w-full max-w-none space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Inventory Movements</h1>
        <p className="text-sm text-muted-foreground">Complete inventory ledger — every stock-in, stock-out, adjustment, transfer, and reversal in one place.</p>
      </div>
      <LedgerViewer />
    </div>
  );
}