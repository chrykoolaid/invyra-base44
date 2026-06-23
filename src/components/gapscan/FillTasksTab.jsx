import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { CheckCircle2, User, X, RefreshCw, Package } from 'lucide-react';

const statusStyle = {
  OPEN:      'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED:  'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const priorityStyle = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High:     'bg-orange-50 text-orange-700 border-orange-200',
  Medium:   'bg-amber-50 text-amber-700 border-amber-200',
  Low:      'bg-slate-100 text-slate-600 border-slate-200',
};

function formatDateTime(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function FillTasksTab() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN');
  const [actioning, setActioning] = useState(null);

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.FillTask.filter(envFilter(), '-created_date', 200);
    setTasks(rows || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (task) => {
    setActioning(task.id);
    const user = await base44.auth.me();
    await base44.entities.FillTask.update(task.id, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      completed_by: user?.email || user?.id || '',
    });
    await load();
    setActioning(null);
  };

  const handleCancel = async (task) => {
    setActioning(task.id);
    const user = await base44.auth.me();
    await base44.entities.FillTask.update(task.id, {
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.email || user?.id || '',
    });
    await load();
    setActioning(null);
  };

  const filtered = filter === 'ALL'
    ? tasks
    : tasks.filter(t => t.status === filter);

  const counts = {
    OPEN:      tasks.filter(t => t.status === 'OPEN').length,
    ASSIGNED:  tasks.filter(t => t.status === 'ASSIGNED').length,
    COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Fill Tasks</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evidentiary replenishment tasks created from Gap Scan observations. No stock movement is posted until a governed transfer is created.
          </p>
        </div>
        <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded border border-border hover:bg-muted transition-colors text-muted-foreground">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', value: counts.OPEN, tone: 'text-blue-600' },
          { label: 'Assigned', value: counts.ASSIGNED, tone: 'text-amber-600' },
          { label: 'Completed', value: counts.COMPLETED, tone: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {['OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED', 'ALL'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-8 px-3 text-xs font-medium border-b-2 transition-colors capitalize ${
              filter === f ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center space-y-2">
          <Package size={24} className="mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No {filter !== 'ALL' ? filter.toLowerCase() : ''} fill tasks.</p>
          <p className="text-xs text-muted-foreground">Run a Gap Scan and use "Add Selected to Fill Tasks" or a row-level Fill Task action on a suggested row to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id} className={`rounded-xl border bg-card px-4 py-3 space-y-2 ${task.status === 'COMPLETED' || task.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{task.item_name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{task.sku}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityStyle[task.priority] || priorityStyle.Medium}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {task.qty_requested && <span>Qty requested: <strong className="text-foreground">{task.qty_requested}</strong></span>}
                    {task.shelf_location_name && <span>→ {task.shelf_location_name}</span>}
                    {task.backroom_storage_area_name && <span>From: {task.backroom_storage_area_name}</span>}
                    {task.assigned_to_name && <span className="flex items-center gap-1"><User size={10} /> {task.assigned_to_name}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-muted-foreground">
                    {task.source && <span>Source: <strong className="text-foreground">{task.source}</strong></span>}
                    {task.system_stock != null && <span>System stock: <strong className="text-foreground">{task.system_stock}</strong></span>}
                    {task.avg_use_per_day != null && <span>Avg use/day: <strong className="text-foreground">{task.avg_use_per_day}</strong></span>}
                    {task.days_left != null && <span>Days left: <strong className="text-foreground">{task.days_left}</strong></span>}
                    {task.suggested_order_qty != null && <span>Suggested qty: <strong className="text-foreground">{task.suggested_order_qty}</strong></span>}
                  </div>
                  {task.notes && <p className="text-xs text-muted-foreground italic mt-1">{task.notes}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Created {formatDateTime(task.created_date)}
                    {task.completed_at && ` · Completed ${formatDateTime(task.completed_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyle[task.status]}`}>
                    {task.status}
                  </span>
                  {(task.status === 'OPEN' || task.status === 'ASSIGNED') && (
                    <>
                      <button
                        onClick={() => handleComplete(task)}
                        disabled={actioning === task.id}
                        title="Mark complete"
                        className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                        <CheckCircle2 size={11} /> Done
                      </button>
                      <button
                        onClick={() => handleCancel(task)}
                        disabled={actioning === task.id}
                        title="Cancel task"
                        className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-muted-foreground disabled:opacity-50">
                        <X size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Fill tasks are evidentiary records only. Completing a task does not post a stock movement — stock changes require a governed Transfer or Adjustment.
      </div>
    </div>
  );
}