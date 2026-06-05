import { useState } from 'react';
import { Loader2, Check, AlertCircle, PlugZap, Copy, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AccountingConnectorPanel() {
  const [xeroConnected, setXeroConnected] = useState(false);
  const [xeroTenantId, setXeroTenantId] = useState('');
  const [xeroAccessToken, setXeroAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl = `${window.location.origin}/api/webhooks/receiver`;

  const handleXeroConnect = () => {
    if (xeroTenantId && xeroAccessToken) {
      setXeroConnected(true);
      setSyncResult(null);
    }
  };

  const handleXeroSync = async () => {
    if (!xeroConnected) return;
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await base44.functions.invoke('syncInventoryToXero', {
        xeroTenantId,
        xeroAccessToken,
      });
      setSyncResult({ success: true, ...response.data });
    } catch (err) {
      setSyncResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(field);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Xero Integration */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/70 border border-border">
              <PlugZap className="h-4 w-4 text-foreground" strokeWidth={1.9} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Xero Integration</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Sync inventory items and valuations</p>
            </div>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${
            xeroConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}>
            {xeroConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        <div className="p-4 space-y-3">
          {!xeroConnected ? (
            <>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Xero Tenant ID</label>
                <input
                  type="text"
                  value={xeroTenantId}
                  onChange={(e) => setXeroTenantId(e.target.value)}
                  placeholder="Paste your Xero Tenant ID"
                  className="w-full h-8 px-3 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Xero Access Token</label>
                <div className="flex gap-2">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={xeroAccessToken}
                    onChange={(e) => setXeroAccessToken(e.target.value)}
                    placeholder="Paste your access token"
                    className="flex-1 h-8 px-3 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="h-8 px-2 rounded border border-border hover:bg-muted transition-colors"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Get this from Xero API settings → OAuth Applications</p>
              </div>
              <button
                onClick={handleXeroConnect}
                disabled={!xeroTenantId || !xeroAccessToken}
                className="w-full h-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Connect to Xero
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-green-700">Connected to Xero</p>
                    <p className="text-xs text-green-600 mt-0.5">Tenant ID: {xeroTenantId.slice(0, 8)}…</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleXeroSync}
                disabled={syncing}
                className="w-full h-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-1.5"
              >
                {syncing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Syncing…
                  </>
                ) : (
                  'Sync Inventory to Xero'
                )}
              </button>
              {syncResult && (
                <div className={`rounded-xl p-3 text-xs ${
                  syncResult.success
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {syncResult.success ? (
                    <p>✓ {syncResult.message} ({syncResult.synced}/{syncResult.total})</p>
                  ) : (
                    <p>✗ Sync failed: {syncResult.error}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25">
          <h3 className="text-sm font-semibold text-foreground">Webhook Endpoints</h3>
          <p className="text-xs text-muted-foreground mt-0.5">For external systems to push data</p>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 h-8 px-3 text-xs border border-border rounded bg-background text-muted-foreground"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="h-8 px-2 rounded border border-border hover:bg-muted transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Webhook Secret (optional)</label>
            <div className="flex gap-2">
              <input
                type={showToken ? 'text' : 'password'}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Generate a secret key for validation"
                className="flex-1 h-8 px-3 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="h-8 px-2 rounded border border-border hover:bg-muted transition-colors"
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => copyToClipboard(webhookSecret, 'secret')}
                className="h-8 px-2 rounded border border-border hover:bg-muted transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-700 font-medium mb-2">Supported Events</p>
            <ul className="space-y-1 text-xs text-blue-600">
              <li>• <code className="font-mono">inventory.update</code> — External stock movements</li>
              <li>• <code className="font-mono">order.created</code> — New purchase orders from external system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}