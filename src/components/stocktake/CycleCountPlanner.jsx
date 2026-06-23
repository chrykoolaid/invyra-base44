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
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.SystemConfiguration.filter(envFilter(), '-created_date', 1),
      base44.auth.me(),
    ])
      .then(([rows, user]) => {
        const cfg = rows?.[0] || null;
        setConfig(cfg);
        setConfigId(cfg?.id || null);
        setTasks(cfg?.cycle_count_tasks || []);
        setUserRole(user?.role || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const canEditPlan = ['manager', 'admin', 'owner'].includes((userRole || '').toLowerCase());

  const persist = async (updatedTasks, actionType = 'CYCLE_COUNT_PLAN_UPDATED', notes = '') => {
    if (!canEditPlan) { setError('Only Manager, Admin, or Owner roles can edit cycle count plan definitions.'); return; }
    setSaving(true);
    setError('');
    try {
      const user = await base44.auth.me();
      const actor = user?.email || user?.full_name || '';
      const payload = {
        cycle_count_tasks: updatedTasks,
        last_saved_by: actor,
        last_saved_at: new Date().toISOString(),
      };
      let nextConfigId = configId;
      if (configId) {
        await base44.entities.SystemConfiguration.update(configId, payload);
      } else {
        const created = await base44.entities.SystemConfiguration.create({ ...envFilter(), ...payload });
        nextConfigId = created.id;
        setConfigId(created.id);
      }
      await base44.entities.AuditLog.create({
        ...envFilter(),
        item_id: 'SYSTEM_CONFIGURATION',
        sku: 'SYSTEM_CONFIGURATION',
        item_name: 'Cycle Count Planner',
        change_type: 'ITEM_UPDATE',
        action_type: actionType,
        field_name: 'SystemConfiguration.cycle_count_tasks',
        old_value: String(tasks.length),
        new_value: String(updatedTasks.length),
        changed_by: actor,
        actor_role: user?.role || '',
        source_module: 'StocktakeCycleCountPlanner',
        source_record_id: nextConfigId || '',
        linked_source_record: nextConfigId || '',
        notes,
      });
      setTasks(updatedTasks);
    } catch (err) {
      console.error('Failed to save cycle count planner:', err);
      setError('Failed to save cycle count plan definition.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTask = async (task) => {
    const existing = tasks.find(t => t.id === task.id);
    const updated = existing
      ? tasks.map(t => t.id === task.id ? task : t)
      : [...tasks, { ...task, created_by: '', created_at: new Date().toISOString() }];
    await persist(updated, existing ? 'CYCLE_COUNT_PLAN_UPDATED' : 'CYCLE_COUNT_PLAN_CREATED', task.name);
    if (canEditPlan) setEditingTask(null);
  };

  const handleDelete = async (id) => {
    const target = tasks.find(t => t.id === id);
    await persist(tasks.map(t => t.id === id ? { ...t, is_active: false, is_archived: true, archived_at: new Date().toISOString() } : t), 'CYCLE_COUNT_PLAN_DEACTIVATED', target?.name || id);
  };

  const handleToggleActive = async (id) => {
    const target = tasks.find(t => t.id === id);
    await persist(tasks.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t), 'CYCLE_COUNT_PLAN_STATUS_CHANGED', target?.name || id);
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
        <button onClick={() => canEditPlan ? setEditingTask(emptyTask()) : setError('Only Manager, Admin, or Owner roles can create cycle count plan definitions.')}
          disabled={!canEditPlan}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-primary/40 rounded bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus size={13} /> New Task
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
      {!canEditPlan && <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">Planner definitions are Manager/Admin/Owner controlled. Supervisors can start active approved counts.</p>}

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
                <button onClick={() => task.is_active && onStartCount(task)}
                  title="Start count session"
                  disabled={!task.is_active}
                  className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                  <Play size={11} /> Start
                </button>
                <button onClick={() => canEditPlan ? setEditingTask({ ...task }) : setError('Only Manager, Admin, or Owner roles can edit cycle count plan definitions.')}
                  disabled={!canEditPlan}
                  title="Edit task"
                  className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleToggleActive(task.id)}
                  disabled={!canEditPlan}
                  title={task.is_active ? 'Deactivate' : 'Activate'}
                  className="h-7 px-2 text-xs rounded border border-border hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                  {task.is_active ? 'Pause' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(task.id)}
                  disabled={!canEditPlan}
                  title="Deactivate task"
                  className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed">
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

      {editingTask && canEditPlan && (
        <TaskFormModal
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}