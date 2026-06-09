/**
 * TrainingShell — v2
 * Persistent wrapper for all training pages.
 * Event log now shows full formal audit fields: actor, role, before/after, environment.
 */
import { FlaskConical, RotateCcw, LogOut, Database } from 'lucide-react';
import { useTraining } from '@/lib/TrainingContext';
import { useNavigate } from 'react-router-dom';
import { roleBadgeClass, roleLabel } from '@/lib/permissions';

export default function TrainingShell({ role, children }) {
  const { reset, log, loading, actor, actorRole } = useTraining();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Banner */}
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <FlaskConical size={15} />
          <span className="text-sm font-semibold tracking-wide">TRAINING MODE — SANDBOX ENVIRONMENT</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${roleBadgeClass(role)} ml-1`}>
            {roleLabel(role)} View
          </span>
          <span className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
            <Database size={9} /> DB-persisted · env=TRAINING
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-amber-100 hidden sm:block">LIVE data is never touched.</span>
          <button
            onClick={reset}
            disabled={loading}
            className="flex items-center gap-1.5 h-7 px-3 text-xs rounded bg-amber-600 hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
          >
            <RotateCcw size={11} className={loading ? 'animate-spin' : ''} /> Reset
          </button>
          <button
            onClick={() => navigate('/Dashboard')}
            className="flex items-center gap-1.5 h-7 px-3 text-xs rounded bg-white/20 hover:bg-white/30 transition-colors font-medium"
          >
            <LogOut size={11} /> Exit Training
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-700">
          <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Loading training environment from database…
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto p-5">
          {children}
        </div>

        {/* Activity log sidebar — formal audit fields */}
        <aside className="w-72 border-l border-amber-200 bg-amber-50 flex flex-col flex-shrink-0">
          <div className="px-3 py-2.5 border-b border-amber-200">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest">Training Audit Log</p>
            <p className="text-[9px] text-amber-500 mt-0.5">Persisted · env=TRAINING · actor={actor?.email ?? '…'}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {log.length === 0 && !loading && (
              <p className="text-xs text-amber-500 px-1 pt-2">No events yet. Complete a training task to see entries here.</p>
            )}
            {log.map(entry => (
              <div key={entry.id} className={`rounded border px-2 py-1.5 ${entry.details?.type === 'ERROR' ? 'bg-red-50 border-red-200' : 'bg-white border-amber-100'}`}>
                <p className="text-[10px] text-amber-400 font-mono">{entry.ts}</p>
                <p className={`text-xs mt-0.5 leading-snug font-medium ${entry.details?.type === 'ERROR' ? 'text-red-700' : 'text-slate-700'}`}>{entry.msg}</p>
                {entry.details && entry.details.type !== 'ERROR' && entry.details.type !== 'RESET' && (
                  <div className="mt-1 space-y-0.5">
                    {entry.details.actor && (
                      <p className="text-[9px] text-slate-400 font-mono">actor: {entry.details.actor} [{entry.details.role}]</p>
                    )}
                    {entry.details.before !== undefined && (
                      <p className="text-[9px] text-slate-400 font-mono">before: {entry.details.before} → after: {entry.details.after}</p>
                    )}
                    {entry.details.movement_id && (
                      <p className="text-[9px] text-slate-400 font-mono">mov_id: {entry.details.movement_id.slice(-8)}</p>
                    )}
                    <p className="text-[9px] text-amber-400 font-mono">env: {entry.details.environment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}