import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Plus, Search, ChevronDown } from 'lucide-react';
import AddBatchModal from './AddBatchModal';

const STATUS_FILTERS = ['All', 'Active', 'Near Expiry', 'Expired', 'Depleted', 'Quarantine'];

function expiryStatusBucket(expiryDate) {
  if (!expiryDate) return { label: '—', cls: 'bg-muted text-muted-foreground border-border' };
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0)   return { label: 'Expired',      cls: 'bg-red-50 text-red-700 border-red-200' };
  if (days === 0) return { label: 'Today',         cls: 'bg-red-50 text-red-700 border-red-200' };
  if (days <= 7)  return { label: '≤7 days',       cls: 'bg-orange-50 text-orange-700 border-orange-200' };
  if (days <= 14) return { label: '≤14 days',      cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (days <= 30) return { label: '≤30 days',      cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  return { label: 'OK',                            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export default function BatchRegisterTab() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.ItemBatch.filter(envFilter(), '-created_date', 200);
    setBatches(rows || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return batches.filter(b => {
      const matchQuery = !query ||
        b.item_name?.toLowerCase().includes(query.toLowerCase()) ||
        b.sku?.toLowerCase().includes(query.toLowerCase()) ||
        b.batch_number?.toLowerCase().includes(query.toLowerCase()) ||
        b.lot_number?.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [batches, query, statusFilter]);

  // Summary counts
  const counts = useMemo(() => {
    const c = { expired: 0, today: 0, week: 0, fortnight: 0, month: 0, ok: 0 };
    batches.forEach(b => {
      if (!b.expiry_date) return;
      const days = differenceInDays(parseISO(b.expiry_date), new Date());
      if (days < 0) c.expired++;
      else if (days === 0) c.today++;
      else if (days <= 7) c.week++;
      else if (days <= 14) c.fortnight++;
      else if (days <= 30) c.month++;
      else c.ok++;
    });
    return c;
  }, [batches]);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Expired',    value: counts.expired,   cls: 'text-red-600' },
          { label: 'Today',      value: counts.today,     cls: 'text-red-500' },
          { label: '≤7 Days',    value: counts.week,      cls: 'text-orange-600' },
          { label: '≤14 Days',   value: counts.fortnight, cls: 'text-amber-600' },
          { label: '≤30 Days',   value: counts.month,     cls: 'text-yellow-600' },
          { label: 'Healthy',    value: counts.ok,        cls: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="border border-border rounded-xl bg-card px-3 py-2.5 text-center">
            <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search item, SKU, batch or lot…"
            className="w-full h-8 border border-border rounded-xl pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-8 border border-border rounded-xl pl-3 pr-7 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
          >
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-8 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <Plus size={13} /> Add Batch
        </button>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} batch{filtered.length !== 1 ? 'es' : ''}</span>
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
                {['Batch #', 'Lot #', 'SKU', 'Item', 'Expiry', 'Window', 'Qty', 'Received', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">No batches found.</td></tr>
              )}
              {filtered.map((b, i) => {
                const bucket = expiryStatusBucket(b.expiry_date);
                return (
                  <tr key={b.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">{b.batch_number}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{b.lot_number || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{b.sku}</td>
                    <td className="px-4 py-2.5 font-medium">{b.item_name}</td>
                    <td className="px-4 py-2.5 text-sm">{b.expiry_date ? format(parseISO(b.expiry_date), 'dd MMM yyyy') : '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${bucket.cls}`}>{bucket.label}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono">{b.quantity}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.received_date ? format(parseISO(b.received_date), 'dd MMM yyyy') : '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        b.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        b.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-200' :
                        b.status === 'Near Expiry' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        b.status === 'Quarantine' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddBatchModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}