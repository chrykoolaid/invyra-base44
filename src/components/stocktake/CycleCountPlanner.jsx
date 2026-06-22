import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { Plus, Play, Pencil, Trash2, CalendarClock, X } from 'lucide-react';

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Ad-hoc'];
const CATEGORIES = ['Food & Beverage', 'Cleaning & Sanitation', 'Office Supplies', 'Packaging', 'Equipment', 'Perishable', 'Non-Perishable', 'Other'];

const freqBadge = {
  Daily:   'bg-red-50 text-red-700 border-red-200',
  Weekly:  'bg-amber-50 text-amber-700 border-amber-200',
  Monthly: 'bg-blue-50 text-blue-700 border-blue-200',
  'Ad-hoc': 'bg-slate-100 text-slate-600 border-slate-200',
};

function genId() {
  return `cct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyTask() {
  return {
    id: genId(),
    name: '',
    description: '',
    frequency: 'Weekly',
    filter_category: '',
    filter_min_cost: '',
    filter_low_stock_only: false,
    filter_skus: [],
    is_active: true,
  };
}

function TaskFormModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({ ...task });
  const [skuInput, setSkuInput] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addSku = () => {
    const trimmed = skuInput.trim().toUpperCase();
    if (!trimmed) return;
    set('filter_skus', [...(form.filter_skus || []), trimmed]);
    setSkuInput('');
  };

  const removeSku = (sku) => set('filter_skus', form.filter_skus.filter(s => s !== sku));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...form,
      filter_min_cost: form.filter_min_cost === '' ? null : Number(form.filter_min_cost),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{task.name ? 'Edit Task' : 'New Cycle Count Task'}</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 space-y-1">
              <span className="text-xs text-muted-foreground">Task Name *</span>
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                placeholder="e.g. Daily High-Value Count"
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Frequency</span>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)}
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Filter by Category</span>
              <select value={form.filter_category} onChange={e => set('filter_category', e.target.value)}
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Min Unit Cost (₱)</span>
              <input type="number" min={0} value={form.filter_min_cost} onChange={e => set('filter_min_cost', e.target.value)}
                placeholder="e.g. 500"
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="flex items-center gap-2 pt-5 cursor-pointer">
              <input type="checkbox" checked={form.filter_low_stock_only} onChange={e => set('filter_low_stock_only', e.target.checked)} />
              <span className="text-sm text-foreground">Low stock items only</span>
            </label>
          </div>

          {/* SKU list */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Specific SKUs (overrides filters above)</span>
            <div className="flex gap-2">
              <input value={skuInput} onChange={e => setSkuInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSku())}
                placeholder="Type SKU and press Enter"
                className="h-9 flex-1 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
              <button type="button" onClick={addSku}
                className="h-9 px-3 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Add</button>
            </div>
            {(form.filter_skus || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.filter_skus.map(sku => (
                  <span key={sku} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-mono">
                    {sku}
                    <button type="button" onClick={() => removeSku(sku)} className="text-muted-foreground hover:text-foreground"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Description (optional)</span>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} placeholder="Brief note on purpose of this count task…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose}
              className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={!form.name.trim()}
              className="h-9 px-5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium">
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CycleCountPlanner({ onStartCount }) {
  const [config, setConfig] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [configId, setConfigId] = useState(null);

  useEffect(() => {
    base44.entities.SystemConfiguration.filter(envFilter(), '-created_date', 1)
      .then(rows => {
        const cfg = rows?.[0] || null;
        setConfig(cfg);
        setConfigId(cfg?.id || null);
        setTasks(cfg?.cycle_count_tasks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const persist = async (updatedTasks) => {
    setSaving(true);
    const user = await base44.auth.me();
    const payload = {
      cycle_count_tasks: updatedTasks,
      last_saved_by: user?.email || '',
      last_saved_at: new Date().toISOString(),
    };
    if (configId) {
      await base44.entities.SystemConfiguration.update(configId, payload);
    } else {
      const created = await base44.entities.SystemConfiguration.create({ ...envFilter(), ...payload });
      setConfigId(created.id);
    }
    setTasks(updatedTasks);
    setSaving(false);
  };

  const handleSaveTask = async (task) => {
    const existing = tasks.find(t => t.id === task.id);
    const updated = existing
      ? tasks.map(t => t.id === task.id ? task : t)
      : [...tasks, { ...task, created_by: '', created_at: new Date().toISOString() }];
    await persist(updated);
    setEditingTask(null);
  };

  const handleDelete = async (id) => {
    await persist(tasks.filter(t => t.id !== id));
  };

  const handleToggleActive = async (id) => {
    await persist(tasks.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t));
  };

  const buildFilterLabel = (task) => {
    const parts = [];
    if ((task.filter_skus || []).length > 0) return `${task.filter_skus.length} specific SKU${task.filter_skus.length > 1 ? 's' : ''}`;
    if (task.filter_category) parts.push(task.filter_category);
    if (task.filter_min_cost) parts.push(`Cost ≥ ₱${task.filter_min_cost}`);
    if (task.filter_low_stock_only) parts.push('Low stock only');
    return parts.length > 0 ? parts.join(' · ') : 'All active items';
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Loading planner…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Cycle Count Planner</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Define focused count tasks. Starting one launches a pre-filtered Stocktake session.</p>
        </div>
        <button onClick={() => setEditingTask(emptyTask())}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-primary/40 rounded bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
          <Plus size={13} /> New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center space-y-2">
          <CalendarClock size={24} className="mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No cycle count tasks defined yet.</p>
          <p className="text-xs text-muted-foreground">Create a task to set up a recurring focused count (e.g. high-value items, specific category).</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id}
              className={`rounded-xl border bg-card px-4 py-3 flex items-start justify-between gap-4 transition-opacity ${task.is_active ? 'border-border opacity-100' : 'border-border/50 opacity-60'}`}>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{task.name}</span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${freqBadge[task.frequency] || freqBadge['Ad-hoc']}`}>
                    {task.frequency}
                  </span>
                  {!task.is_active && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{buildFilterLabel(task)}</p>
                {task.description && <p className="text-xs text-muted-foreground italic">{task.description}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => onStartCount(task)}
                  title="Start count session"
                  className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  <Play size={11} /> Start
                </button>
                <button onClick={() => setEditingTask({ ...task })}
                  title="Edit task"
                  className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-muted transition-colors text-muted-foreground">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleToggleActive(task.id)}
                  title={task.is_active ? 'Deactivate' : 'Activate'}
                  className="h-7 px-2 text-xs rounded border border-border hover:bg-muted transition-colors text-muted-foreground">
                  {task.is_active ? 'Pause' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(task.id)}
                  title="Delete task"
                  className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-muted-foreground">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {saving && (
        <p className="text-xs text-muted-foreground text-center">Saving…</p>
      )}

      {editingTask && (
        <TaskFormModal
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}