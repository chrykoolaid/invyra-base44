import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Save, RefreshCw, Send } from 'lucide-react';

export default function WebhookManagementUI() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    external_system: '',
    endpoint_url: '',
    secret_key: '',
    events_subscribed: [],
    is_active: true,
  });
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const loadEndpoints = async () => {
    setLoading(true);
    const data = await base44.entities.WebhookEndpoint.list('-created_date', 50);
    setEndpoints(data || []);
    setLoading(false);
  };

  useEffect(() => { loadEndpoints(); }, []);

  const saveEndpoint = async () => {
    if (!newEndpoint.name || !newEndpoint.endpoint_url) return;
    await base44.entities.WebhookEndpoint.create(newEndpoint);
    setNewEndpoint({ name: '', external_system: '', endpoint_url: '', secret_key: '', events_subscribed: [], is_active: true });
    loadEndpoints();
  };

  const deleteEndpoint = async (id) => {
    await base44.entities.WebhookEndpoint.delete(id);
    loadEndpoints();
  };

  const testEndpoint = async (endpoint) => {
    setTesting(endpoint.id);
    setTestResult(null);
    try {
      const response = await fetch(endpoint.endpoint_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': endpoint.secret_key },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      });
      setTestResult({ success: response.ok, code: response.status });
      if (response.ok) {
        await base44.entities.WebhookEndpoint.update(endpoint.id, { last_tested: new Date().toISOString(), test_result: 'success' });
      } else {
        await base44.entities.WebhookEndpoint.update(endpoint.id, { test_result: 'failed' });
      }
      loadEndpoints();
    } catch (err) {
      setTestResult({ success: false, error: err.message });
      await base44.entities.WebhookEndpoint.update(endpoint.id, { test_result: 'timeout' });
      loadEndpoints();
    }
    setTesting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Webhook Endpoints</h2>
          <p className="text-xs text-muted-foreground mt-1">Register and test external webhook receivers</p>
        </div>
        <button onClick={loadEndpoints} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-border hover:bg-muted disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* New Endpoint Form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <input type="text" placeholder="Endpoint name" value={newEndpoint.name} onChange={(e) => setNewEndpoint({...newEndpoint, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
        <input type="text" placeholder="External system name" value={newEndpoint.external_system} onChange={(e) => setNewEndpoint({...newEndpoint, external_system: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
        <input type="text" placeholder="HTTPS endpoint URL" value={newEndpoint.endpoint_url} onChange={(e) => setNewEndpoint({...newEndpoint, endpoint_url: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono text-xs" />
        <input type="text" placeholder="Shared secret key" value={newEndpoint.secret_key} onChange={(e) => setNewEndpoint({...newEndpoint, secret_key: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />

        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Subscribe to events</p>
          <div className="flex flex-wrap gap-2">
            {['inventory.update', 'order.created', 'sync.completed'].map(evt => (
              <label key={evt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newEndpoint.events_subscribed.includes(evt)} onChange={(e) => {
                  const updated = e.target.checked 
                    ? [...newEndpoint.events_subscribed, evt]
                    : newEndpoint.events_subscribed.filter(e => e !== evt);
                  setNewEndpoint({...newEndpoint, events_subscribed: updated});
                }} />
                {evt}
              </label>
            ))}
          </div>
        </div>

        <button onClick={saveEndpoint} className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-medium">
          <Save size={14} /> Register Endpoint
        </button>
      </div>

      {/* Endpoints List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading endpoints…</div>
      ) : (
        <div className="space-y-2">
          {endpoints.map((ep) => (
            <div key={ep.id} className="rounded-xl border border-border bg-card p-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{ep.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">{ep.endpoint_url}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ep.events_subscribed.length} events • {ep.deliveries_successful}/{ep.deliveries_total} deliveries</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => testEndpoint(ep)} disabled={testing === ep.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:opacity-90 disabled:opacity-50">
                      {testing === ep.id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />} Test
                    </button>
                    <button onClick={() => deleteEndpoint(ep.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {testResult && testing === null && (
                  <div className={`text-xs p-2 rounded ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {testResult.success ? '✓ Test successful' : `✗ Test failed: ${testResult.error || `HTTP ${testResult.code}`}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}