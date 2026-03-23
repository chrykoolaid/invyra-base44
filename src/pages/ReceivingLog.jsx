import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const logData = [
  { po: 'PO-2026-004', supplier: 'LaundryChem Direct',    date: '2026-03-15', itemsReceived: 1, status: 'Complete'  },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     date: '2026-03-13', itemsReceived: 2, status: 'Partial'   },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', date: '2026-03-10', itemsReceived: 2, status: 'Partial'   },
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         date: '2026-03-06', itemsReceived: 2, status: 'Complete'  },
  { po: 'PO-2025-048', supplier: 'SafetyFirst Supplies',  date: '2026-02-28', itemsReceived: 1, status: 'Complete'  },
  { po: 'PO-2025-047', supplier: 'PackPro Solutions',     date: '2026-02-21', itemsReceived: 3, status: 'Complete'  },
  { po: 'PO-2025-046', supplier: 'ChemSupply Co',         date: '2026-02-14', itemsReceived: 2, status: 'Partial'   },
  { po: 'PO-2025-045', supplier: 'LaundryChem Direct',    date: '2026-02-07', itemsReceived: 1, status: 'Complete'  },
  { po: 'PO-2025-044', supplier: 'CleanTex Distributors', date: '2026-01-31', itemsReceived: 2, status: 'Complete'  },
  { po: 'PO-2025-043', supplier: 'HangerCo Wholesale',    date: '2026-01-24', itemsReceived: 1, status: 'Discrepancy' },
];

const statusStyle = {
  'Complete':     'bg-green-50 text-green-700 border border-green-200',
  'Partial':      'bg-amber-50 text-amber-700 border border-amber-200',
  'Discrepancy':  'bg-red-50 text-red-700 border border-red-200',
};

export default function ReceivingLog() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/Receiving')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Receiving
      </button>

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Receiving Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">History of completed and partial receiving events</p>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['PO Number', 'Supplier', 'Date', 'Items Received', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logData.map((row, i) => (
              <tr key={row.po} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                <td className="px-5 py-3 font-mono text-xs text-primary">{row.po}</td>
                <td className="px-5 py-3 font-medium">{row.supplier}</td>
                <td className="px-5 py-3 text-muted-foreground">{row.date}</td>
                <td className="px-5 py-3 text-muted-foreground">{row.itemsReceived} line{row.itemsReceived !== 1 ? 's' : ''}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-4 px-1">{logData.length} receiving events on record</p>
    </div>
  );
}