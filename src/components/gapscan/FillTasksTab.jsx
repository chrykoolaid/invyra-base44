import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

const statusStyle = {
  OPEN:      'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED:  'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const riskStyle = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High:     'bg-orange-50 text-orange-700 border-orange-200',
  Medium:   'bg-amber-50 text-amber-700 border-amber-200',
  Low:      'bg-slate-100 text-slate-600 border-slate-200',
  None:     'bg-slate-100 text-slate-500 border-slate-200',
};

const flagStyle = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  Watch:    'bg-amber-50 text-amber-700 border-amber-200',
  OK:       'bg-green-50 text-green-700 border-green-200',
};

const filterLabels = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ALL: 'All',
};

const formatDateTime = (val) => {
  if (!val) return '—';
  const parsed = new Date(val);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return value;
};

const getTaskCreatedAt = (task) => task.created_at || task.created_date || task.createdAt;
const getTaskCreatedBy = (task) => task.created_by || task.created_by_name || task.createdBy || '—';
const getTaskRisk = (task) => task.risk || task.priority || 'None';
const getTaskFlag = (task) => task.flag || 'OK';
const isActionable = (task) => task.status === 'OPEN' || task.status === 'ASSIGNED';

function FieldPill({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground">{formatValue(value)}</p>
    </div>
  );
}

function DetailModal({ task, onClose, onComplete, onCancel, actioning }) {
  if (!task) return null;

  const risk = getTaskRisk(task);
  const flag = getTaskFlag(task);
  const canAct = isActionable(task);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fill Task Details</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{task.item_name || 'Unnamed item'}</h3>
            <p className="font-mono text-xs text-muted-foreground">{task.sku || 'No SKU'}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close fill task details"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle[task.status] || statusStyle.OPEN}`}>
              {task.status || 'OPEN'}
            </span>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              Source: {task.source || 'GAP_SCAN'}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${riskStyle[risk] || riskStyle.None}`}>
              Risk: {risk}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${flagStyle[flag] || flagStyle.OK}`}>
              Flag: {flag}
            </span>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gap Scan Snapshot</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <FieldPill label="System stock" value={task.system_stock} />
              <FieldPill label="Avg use/day" value={task.avg_use_per_day} />
              <FieldPill label="Days left" value={task.days_left} />
              <FieldPill label="Suggested qty" value={task.suggested_order_qty ?? task.qty_requested} />
              <FieldPill label="Location" value={task.location_name || task.shelf_location_name} />
              <FieldPill label="Environment" value={task.environment} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Task Governance</p>
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <div className="grid gap-2 md:grid-cols-2">
                <span>Created by: <strong className="text-foreground">{getTaskCreatedBy(task)}</strong></span>
                <span>Created: <strong className="text-foreground">{formatDateTime(getTaskCreatedAt(task))}</strong></span>
                {task.completed_at && <span>Completed: <strong className="text-foreground">{formatDateTime(task.completed_at)}</strong></span>}
                {task.cancelled_at && <span>Cancelled: <strong className="text-foreground">{formatDateTime(task.cancelled_at)}</strong></span>}
              </div>
              {task.notes && <p className="mt-3 border-t border-border pt-3 text-xs italic">{task.notes}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">
            Completing or cancelling this task does not post a StockMovement.
          </p>
          <div className="flex items-center gap-2">
            {canAct && (
              <>
                <button
                  onClick={() => onComplete(task)}
                  disabled={actioning === task.id}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                >
                  <CheckCircle2 size={13} /> Complete Task
                </button>
                <button
                  onClick={() => onCancel(task)}
                  disabled={actioning === task.id}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <X size={13} /> Cancel Task
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FillTasksTab() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN');
  const [actioning, setActioning] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await base44.entities.FillTask.filter(envFilter(), '-created_date', 200);
      setTasks(rows || []);
    } catch (err) {
      console.error('Unable to load Fill Tasks:', err);
      setError('Unable to load Fill Tasks. No stock movement or inventory write was attempted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (task) => {
    setActioning(task.id);
    setError('');
    try {
      const user = await base44.auth.me();
      await base44.entities.FillTask.update(task.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        completed_by: user?.email || user?.id || '',
      });
      await load();
      setSelectedTask(null);
    } catch (err) {
      console.error('Unable to complete Fill Task:', err);
      setError('Unable to complete Fill Task. No StockMovement was posted.');
    } finally {
      setActioning(null);
    }
  };

  const handleCancel = async (task) => {
    setActioning(task.id);
    setError('');
    try {
      const user = await base44.auth.me();
      await base44.entities.FillTask.update(task.id, {
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user?.email || user?.id || '',
      });
      await load();
      setSelectedTask(null);
    } catch (err) {
      console.error('Unable to cancel Fill Task:', err);
      setError('Unable to cancel Fill Task. No StockMovement was posted.');
    } finally {
      setActioning(null);
    }
  };

  const filtered = filter === 'ALL'
    ? tasks
    : tasks.filter(t => t.status === filter);

  const counts = {
    OPEN:      tasks.filter(t => t.status === 'OPEN').length,
    ASSIGNED:  tasks.filter(t => t.status === 'ASSIGNED').length,
    COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
    CANCELLED: tasks.filter(t => t.status === 'CANCELLED').length,
  };

  const handleGoToGapScan = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/GapScan');
    }
  };

  return (
    <div className="space-y-5">
      <DetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onComplete={handleComplete}
        onCancel={handleCancel}
        actioning={actioning}
      />

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList size={17} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Fill Task Queue</h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Manual replenishment tasks created from Gap Scan. This queue helps staff action shelf-fill work without changing stock truth.
            </p>
          </div>
          <button
            onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Refresh Fill Tasks"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Open', value: counts.OPEN, tone: 'text-blue-600', border: 'border-blue-100' },
            { label: 'Assigned', value: counts.ASSIGNED, tone: 'text-amber-600', border: 'border-amber-100' },
            { label: 'Completed', value: counts.COMPLETED, tone: 'text-green-600', border: 'border-green-100' },
            { label: 'Cancelled', value: counts.CANCELLED, tone: 'text-slate-500', border: 'border-slate-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border ${s.border} bg-background px-4 py-3`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {['OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED', 'ALL'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-9 px-4 text-sm font-medium border-b-2 transition-colors ${
              filter === f ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-14 text-center text-sm text-muted-foreground">
          Loading fill task queue…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <Package size={32} className="mx-auto text-muted-foreground" />
          <p className="mt-4 text-base font-semibold text-foreground">
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} fill tasks
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Run Gap Scan, select suggested rows, then choose “Add Selected to Fill Tasks.” Healthy OK rows are skipped to avoid task noise.
          </p>
          <button
            onClick={handleGoToGapScan}
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Go to Gap Scan
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const risk = getTaskRisk(task);
            const flag = getTaskFlag(task);
            const canAct = isActionable(task);

            return (
              <div
                key={task.id}
                className={`rounded-2xl border bg-card px-4 py-4 transition-colors ${task.status === 'COMPLETED' || task.status === 'CANCELLED' ? 'opacity-70' : 'hover:border-primary/30'}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{task.item_name || 'Unnamed item'}</h3>
                      <span className="font-mono text-xs text-muted-foreground">{task.sku || 'No SKU'}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyle[task.status] || statusStyle.OPEN}`}>
                        {task.status || 'OPEN'}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        {task.source || 'GAP_SCAN'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                      <FieldPill label="System stock" value={task.system_stock} />
                      <FieldPill label="Days left" value={task.days_left} />
                      <FieldPill label="Suggested qty" value={task.suggested_order_qty ?? task.qty_requested} />
                      <FieldPill label="Risk" value={risk} />
                      <FieldPill label="Flag" value={flag} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {task.location_name && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {task.location_name}</span>}
                      {task.assigned_to_name && <span className="inline-flex items-center gap-1"><User size={11} /> {task.assigned_to_name}</span>}
                      <span className="inline-flex items-center gap-1"><Clock size={11} /> Created {formatDateTime(getTaskCreatedAt(task))}</span>
                      <span>Created by: <strong className="text-foreground">{getTaskCreatedBy(task)}</strong></span>
                    </div>

                    {task.notes && <p className="mt-2 text-xs italic text-muted-foreground">{task.notes}</p>}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    >
                      <Eye size={13} /> View Details
                    </button>
                    {canAct && (
                      <>
                        <button
                          onClick={() => handleComplete(task)}
                          disabled={actioning === task.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} /> Complete
                        </button>
                        <button
                          onClick={() => handleCancel(task)}
                          disabled={actioning === task.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          <X size={13} /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Fill tasks are evidentiary records only. Completing a task does not post a stock movement — stock changes require governed Transfer, Adjustment, Receiving, POS sale, Wastage, or Stocktake workflows.
        </p>
      </div>
    </div>
  );
}
