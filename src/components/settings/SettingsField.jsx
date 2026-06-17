/**
 * SettingsField — consistent field wrapper for individual settings inputs.
 */
export default function SettingsField({ label, hint, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start">
      <div className="md:col-span-1 pt-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="md:col-span-2">
        {children}
      </div>
    </div>
  );
}