/**
 * TrainingShell
 * Persistent wrapper for all training pages.
 * Shows a prominent TRAINING MODE banner so users always know they're sandboxed.
 */
import { FlaskConical, RotateCcw, LogOut } from 'lucide-react';
import { useTraining } from '@/lib/TrainingContext';
import { useNavigate } from 'react-router-dom';
import { roleBadgeClass, roleLabel } from '@/lib/permissions';

export default function TrainingShell({ role, children }) {
  const { reset, log } = useTraining();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Banner */}
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical size={15} />
          <span className="text-sm font-semibold tracking-wide">TRAINING MODE — SANDBOX ENVIRONMENT</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${roleBadgeClass(role)} ml-2`}>
            {roleLabel(role)} View
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-100">No live data is read or written in this environment.</span>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 h-7 px-3 text-xs rounded bg-amber-600 hover:bg-amber-700 transition-colors font-medium"
          >
            <RotateCcw size={11} /> Reset
          </button>
          <button
            onClick={() => navigate('/Dashboard')}
            className="flex items-center gap-1.5 h-7 px-3 text-xs rounded bg-white/20 hover:bg-white/30 transition-colors font-medium"
          >
            <LogOut size={11} /> Exit Training
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto p-5">
          {children}
        </div>

        {/* Activity log sidebar */}
        <aside className="w-64 border-l border-amber-200 bg-amber-50 flex flex-col flex-shrink-0">
          <div className="px-3 py-2.5 border-b border-amber-200">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest">Training Event Log</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {log.length === 0 && (
              <p className="text-xs text-amber-500 px-1 pt-2">No events yet. Complete a training task to see entries here.</p>
            )}
            {log.map(entry => (
              <div key={entry.id} className="bg-white rounded border border-amber-100 px-2 py-1.5">
                <p className="text-[10px] text-amber-400 font-mono">{entry.ts}</p>
                <p className="text-xs text-slate-700 mt-0.5 leading-snug">{entry.msg}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}