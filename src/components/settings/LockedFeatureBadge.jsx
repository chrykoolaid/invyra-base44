import { Lock } from 'lucide-react';

/**
 * LockedFeatureBadge — renders a consistent "Planned / Locked" indicator.
 * Use this for any Settings field or section that is not yet wired in v1.
 */
export default function LockedFeatureBadge({ label = 'Planned', reason = '' }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <Lock size={13} className="text-slate-400 flex-shrink-0" />
      <div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        {reason && (
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">{reason}</p>
        )}
      </div>
    </div>
  );
}