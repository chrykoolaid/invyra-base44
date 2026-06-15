import { useLocation } from 'react-router-dom';
import LedgerViewer from '@/components/LedgerViewer';

export default function Movements() {
  const location = useLocation();
  const defaultSku = new URLSearchParams(location.search).get('sku') || '';

  return (
    <div className="p-5 lg:p-6 w-full max-w-none space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Inventory Movements</h1>
        <p className="text-sm text-muted-foreground">
          Complete inventory ledger — every stock-in, stock-out, adjustment, transfer, and reversal in one place.
          {defaultSku && <span className="block mt-1">Filtered from Item Details: <span className="font-mono text-foreground">{defaultSku}</span></span>}
        </p>
      </div>
      <LedgerViewer defaultSku={defaultSku} />
    </div>
  );
}
