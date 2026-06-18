import { X, Trash2 } from 'lucide-react';

export default function DeleteDraftConfirmModal({ record, loading = false, onCancel, onConfirm }) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border max-w-md w-full shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-50 text-red-700 flex items-center justify-center">
              <Trash2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Delete Draft?</h2>
              <p className="text-xs text-muted-foreground mt-0.5">No stock movement has been posted.</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground" disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            This will delete the draft stock-out record. This cannot be undone from this screen.
          </p>

          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5 text-sm">
            <p className="font-medium text-foreground">{record.item_name}</p>
            <p className="text-xs text-muted-foreground">{record.sku || 'No SKU'}</p>
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div>
                <span className="text-muted-foreground">Quantity</span>
                <p className="font-medium text-foreground">{record.quantity} units</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reason</span>
                <p className="font-medium text-foreground">{record.reason_category || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-900">
              Draft deletion is audit logged. No StockMovement will be created.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 h-9 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 h-9 rounded-xl bg-red-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
