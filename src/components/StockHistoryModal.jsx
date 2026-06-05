import { X, History } from 'lucide-react';
import LedgerViewer from '@/components/LedgerViewer';

export default function StockHistoryModal({ onClose, selectedSkus = [] }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-5xl shadow-xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <History size={16} className="text-primary flex-shrink-0" />
            <h2 className="text-sm font-semibold text-foreground">Stock History</h2>
            {selectedSkus.length > 0 && (
              <span className="text-xs text-muted-foreground">— {selectedSkus.join(', ')}</span>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <LedgerViewer selectedSkus={selectedSkus} />
        </div>
      </div>
    </div>
  );
}