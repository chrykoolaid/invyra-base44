import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import {
  buildItemDetailsForecastViewModel,
  forecastingApiBaseUrl,
  isForecastingApiConfigured,
  requestItemDetailsForecast,
} from '@/lib/forecastingItemDetails';
import { ENV_LIVE } from '@/lib/envFilter';

function toneClass(tone) {
  switch (tone) {
    case 'danger': return 'bg-red-50 text-red-700 border-red-200';
    case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'success': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: value % 1 === 0 ? 0 : 1 });
  }
  return String(value);
}

function ForecastField({ field }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground truncate">{field.label}</p>
        {field.chip && (
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${toneClass(field.chip.tone)}`}>
            {field.chip.label}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-foreground mt-1 truncate">{formatValue(field.value)}</p>
    </div>
  );
}

export default function ItemDetailsForecastPanel({ item, movements, loadingMovements }) {
  const [panel, setPanel] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadForecast = useCallback(async () => {
    if (!item || loadingMovements) return;
    setLoading(true);
    try {
      const response = await requestItemDetailsForecast({ item, movements, environment: ENV_LIVE });
      setPanel(response);
    } finally {
      setLoading(false);
    }
  }, [item, movements, loadingMovements]);

  useEffect(() => { loadForecast(); }, [loadForecast]);

  const viewModel = useMemo(() => buildItemDetailsForecastViewModel(panel), [panel]);
  const apiConfigured = isForecastingApiConfigured();
  const snapshotUrl = viewModel.snapshot?.available && apiConfigured
    ? `${forecastingApiBaseUrl()}/inventory/item-details/forecast/snapshots/${encodeURIComponent(viewModel.snapshot.snapshot_id)}`
    : null;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{viewModel.title}</h2>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneClass(viewModel.status_chip.tone)}`}>
              {viewModel.status_chip.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{viewModel.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {snapshotUrl && (
            <a
              href={snapshotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ExternalLink size={12} /> Evidence
            </a>
          )}
          <button
            type="button"
            onClick={loadForecast}
            disabled={loading || loadingMovements}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading || loadingMovements ? (
        <div className="rounded-lg border border-border bg-background px-3 py-6 text-center text-sm text-muted-foreground">
          Loading forecast intelligence…
        </div>
      ) : viewModel.fields.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {viewModel.fields.map(field => <ForecastField key={field.key} field={field} />)}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background px-3 py-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Forecast unavailable</p>
              <p className="mt-1 text-xs">Item Details and Stock History remain usable.</p>
              {!apiConfigured && (
                <p className="mt-1 text-xs">Configure VITE_INVYRA_FORECASTING_API_BASE_URL to enable live forecast calls.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {viewModel.warnings?.length > 0 && (
        <div className="mt-3 space-y-2">
          {viewModel.warnings.map((warning, index) => (
            <div key={`${warning}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {warning}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Sparkles size={11} /> Advisory only</span>
        <span>Ledger remains source of truth</span>
        <span>No stock adjustment</span>
        <span>No purchase order action</span>
      </div>
    </section>
  );
}
