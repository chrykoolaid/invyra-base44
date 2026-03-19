import { useTheme } from '@/lib/ThemeContext';

export default function Settings() {
  const { theme, changeTheme } = useTheme();

  const themeOptions = [
    { id: 'default', label: 'Default (Light)' },
    { id: 'dark', label: 'Dark' },
    { id: 'invyra', label: 'Invyra' }
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>

      <div className="max-w-2xl">
        <div className="border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Appearance</h2>

          <div className="space-y-3">
            <label className="text-sm text-muted-foreground mb-2 block">Theme</label>
            <div className="flex gap-3">
              {themeOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => changeTheme(option.id)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    theme === option.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}