import { useState } from 'react';
import { X } from 'lucide-react';

export default function RejectReasonModal({ title, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Please enter a reason');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for this action..."
          className="w-full h-24 p-3 rounded border border-input bg-background text-foreground text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

        <div className="flex gap-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 rounded border border-border text-foreground text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="flex-1 px-3 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}