import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { format, differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ACTION_STYLE = {
  'Ready for Markdown': 'bg-amber-50 text-amber-700 border-amber-200',
  'Ready for Wastage':  'bg-red-50 text-red-700 border-red-200',
  'Priority FEFO':      'bg-violet-50 text-violet-700 border-violet-200',
  'None':               'bg-muted text-muted-foreground border-border',
};

const WINDOW_FILTERS = ['All', '≤7 Days', '≤14 Days', '≤30 Days', 'Expired', 'Today'];

function getDaysLeft(expiryDate) {
  if (!expiryDate) return null;
  return differenceInDays(parseISO(expiryDate), new Date());
}

export default function NearExpiryTab() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState('≤30 Days');

  useEffect(() => {
    base44.entities.ItemExpiryBalance.filter(envFilter(), 'expiry_date', 500)
      .then(rows => { setBalances(rows || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return balances.filter(b => {
      if (!b.expiry_date) return false;
      const days = getDaysLeft(b.expiry_date);
      if (days === null) return false;
      if (window === 'Expired')   return days < 0;
      if (window === 'Today')     return days === 0;
      if (window === '≤7 Days')   return days >= 0 && days <= 7;
      if (window === '≤14 Days')  return days >= 0 && days <= 14;
      if (window === '≤30 Days')  return days >= 0 && days <= 30;
      return true; // All
    }).sort((a, b) => getDaysLeft(a.expiry_date) - getDaysLeft(b.expiry_date));
  }, [balances, window]);

  const actionCounts = useMemo(() => {
    const c = { markdown: 0, wastage: 0, fefo: 0 };
    balances.forEach(b => {
      if (b.action_flag === 'Ready for Markdown') c.markdown++;
      if (b.action_flag === 'Ready for Wastage')  c.wastage++;
      if (b.action_flag === 'Priority FEFO')       c.fefo++;
    });
    return c;
  }, [balances]);

  return (
    <div className="space-y-4">
      {/* Action summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1">Ready for Markdown</p>
            <p className="text-2xl font-bold text-amber-700">{actionCounts.markdown}</p>
          </div>
          <Link to="/Markdown" className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors">
            Open Markdown <ArrowRight size={11} />
          </Link>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-1">Ready for Wastage</p>
            <p className="text-2xl font-bold text-red-700">{actionCounts.wastage}</p>
          </div>
          <Link to="/Wastage" className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors">
            Open Wastage <ArrowRight size={11} />
          </Link>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-700 mb-1">Priority FEFO Items</p>
          <p className="text-2xl font-bold text-violet-700">{actionCounts.fefo}</p>
        </div>
      </div>

      {/* FEFO note */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">FEFO guidance:</strong> First Expired, First Out. Items with the nearest expiry should be used, sold, transferred, or marked down before newer stock. This view does not perform write-offs or pricing changes — use Wastage or Markdown modules for those actions.
        </p>
      </div>

      {/* Window filter pills */}
      <div className="flex flex-wrap gap-2">
        {WINDOW_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setWindow(f)}
            className={`h-8 px-3.5 rounded-xl border text-sm font-medium transition-colors ${
              window === f
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                {['SKU', 'Item', 'Batch', 'Location', 'Expiry', 'Days Left', 'Qty On Hand', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    {balances.length === 0 ? 'No expiry balances recorded yet. Add batches in the Batch & Lot Register tab.' : `No items in the "${window}" window.`}
                  </td>
                </tr>
              )}
              {filtered.map((b, i) => {
                const days = getDaysLeft(b.expiry_date);
                const daysLabel = days === null ? '—' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`;
                const daysColor = days === null ? 'text-muted-foreground' : days < 0 ? 'text-red-600 font-semibold' : days <= 7 ? 'text-orange-600 font-semibold' : days <= 14 ? 'text-amber-600' : 'text-foreground';
                return (
                  <tr key={b.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{b.sku}</td>
                    <td className="px-4 py-2.5 font-medium">{b.item_name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{b.batch_number || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.location_name || '—'}{b.storage_area_name ? ` · ${b.storage_area_name}` : ''}</td>
                    <td className="px-4 py-2.5 text-sm">{b.expiry_date ? format(parseISO(b.expiry_date), 'dd MMM yyyy') : '—'}</td>
                    <td className={`px-4 py-2.5 text-sm ${daysColor}`}>{daysLabel}</td>
                    <td className="px-4 py-2.5 font-mono">{b.on_hand_qty}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ACTION_STYLE[b.action_flag] || ACTION_STYLE['None']}`}>
                        {b.action_flag || 'None'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}