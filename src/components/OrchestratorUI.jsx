import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, RefreshCw, ArrowRight } from 'lucide-react';

export default function OrchestratorUI() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    connectors: [],
    batch_size: 100,
    timeout_minutes: 30,
    is_active: true,
  });

  const loadWorkflows = async () => {
    setLoading(true);
    const data = await base44.entities.IntegrationOrchestration.list('-created_date', 50);
    setWorkflows(data || []);
    setLoading(false);
  };

  useEffect(() => { loadWorkflows(); }, []);

  const addConnector = () => {
    setNewWorkflow({
      ...newWorkflow,
      connectors: [...newWorkflow.connectors, { sequence: (newWorkflow.connectors.length || 0) + 1, sync_type: 'xero_inventory', depends_on: [], run_condition: 'always', rollback_on_failure: false }],
    });
  };

  const saveWorkflow = async () => {
    if (!newWorkflow.name || newWorkflow.connectors.length === 0) return;
    await base44.entities.IntegrationOrchestration.create(newWorkflow);
    setNewWorkflow({ name: '', description: '', connectors: [], batch_size: 100, timeout_minutes: 30, is_active: true });
    loadWorkflows();
  };

  const deleteWorkflow = async (id) => {
    await base44.entities.IntegrationOrchestration.delete(id);
    loadWorkflows();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Integration Orchestration</h2>
          <p className="text-xs text-muted-foreground mt-1">Define multi-connector workflows with dependencies</p>
        </div>
        <button onClick={loadWorkflows} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-border hover:bg-muted disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* New Workflow Form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <input type="text" placeholder="Workflow name" value={newWorkflow.name} onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
        <textarea placeholder="Description" value={newWorkflow.description} onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />

        {/* Connectors */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Connector Steps</p>
            <button onClick={addConnector} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90">
              <Plus size={12} /> Add Step
            </button>
          </div>
          <div className="space-y-2">
            {newWorkflow.connectors.map((c, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Step {i + 1}</label>
                  <select value={c.sync_type} onChange={(e) => {
                    const updated = [...newWorkflow.connectors];
                    updated[i].sync_type = e.target.value;
                    setNewWorkflow({...newWorkflow, connectors: updated});
                  }} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
                    <option value="xero_inventory">Xero Inventory</option>
                    <option value="webhook_inventory">Webhook Stock</option>
                    <option value="webhook_order">Webhook Order</option>
                  </select>
                </div>
                <select value={c.run_condition} onChange={(e) => {
                  const updated = [...newWorkflow.connectors];
                  updated[i].run_condition = e.target.value;
                  setNewWorkflow({...newWorkflow, connectors: updated});
                }} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm">
                  <option value="always">Always</option>
                  <option value="if_previous_success">If Success</option>
                  <option value="if_previous_failed">If Failed</option>
                </select>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={c.rollback_on_failure} onChange={(e) => {
                    const updated = [...newWorkflow.connectors];
                    updated[i].rollback_on_failure = e.target.checked;
                    setNewWorkflow({...newWorkflow, connectors: updated});
                  }} />
                  Rollback
                </label>
                <button onClick={() => setNewWorkflow({...newWorkflow, connectors: newWorkflow.connectors.filter((_, idx) => idx !== i)})} className="text-red-600 hover:opacity-70">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Batch Size</label>
            <input type="number" value={newWorkflow.batch_size} onChange={(e) => setNewWorkflow({...newWorkflow, batch_size: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Timeout (min)</label>
            <input type="number" value={newWorkflow.timeout_minutes} onChange={(e) => setNewWorkflow({...newWorkflow, timeout_minutes: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </div>
        </div>

        <button onClick={saveWorkflow} className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-medium">
          <Save size={14} /> Create Workflow
        </button>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading workflows…</div>
      ) : (
        <div className="space-y-2">
          {workflows.map((wf) => (
            <div key={wf.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{wf.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{wf.connectors.length} steps • {wf.batch_size} items/batch</p>
                  {wf.last_executed && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last: {new Date(wf.last_executed).toLocaleString()} — {wf.last_status}
                    </p>
                  )}
                </div>
                <button onClick={() => deleteWorkflow(wf.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">
                  Delete
                </button>
              </div>

              {/* Workflow Diagram */}
              <div className="mt-3 flex items-center gap-1 text-xs flex-wrap">
                {wf.connectors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-mono">Step {i + 1}</span>
                    {i < wf.connectors.length - 1 && <ArrowRight size={12} className="text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}