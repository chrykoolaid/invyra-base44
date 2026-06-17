/**
 * SettingsSectionShell — consistent card wrapper for each Settings section tab.
 * Handles the per-section save button, saving state, and result feedback.
 */
export default function SettingsSectionShell({
  title,
  description,
  children,
  onSave,
  saving,
  saveResult,
  saveLabel = 'Save',
  hideSave = false,
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      {/* Section header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Section body */}
      <div className="px-5 py-5 space-y-5">
        {children}
      </div>

      {/* Footer — save per section, never Save All */}
      {!hideSave && (
        <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {saveResult?.saved && (
              <span className="text-green-600 font-medium">
                ✓ Saved — {saveResult.changedFields?.length ?? 0} field{saveResult.changedFields?.length !== 1 ? 's' : ''} updated
              </span>
            )}
            {saveResult?.unchanged && (
              <span className="text-muted-foreground">No changes detected.</span>
            )}
            {saveResult?.error && (
              <span className="text-red-600 font-medium">⚠ {saveResult.error}</span>
            )}
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="h-9 px-4 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
          >
            {saving ? 'Saving…' : saveLabel}
          </button>
        </div>
      )}
    </div>
  );
}