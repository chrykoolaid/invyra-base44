import { useState } from 'react';
import { ScanLine, AlertTriangle } from 'lucide-react';

const zones = ['Pool Deck', 'Guest Rooms Floor 1', 'Guest Rooms Floor 2', 'Spa', 'Gym'];

const gaps = [
  { zone: 'Pool Deck',          item: 'Pool Towel 30×60', expected: 120, actual: 44, gap: -76 },
  { zone: 'Guest Rooms Floor 1',item: 'Bath Towel 27×54', expected: 200, actual: 187, gap: -13 },
  { zone: 'Guest Rooms Floor 2',item: 'Bath Towel 27×54', expected: 200, actual: 91, gap: -109 },
  { zone: 'Guest Rooms Floor 2',item: 'Pillow Case Std',  expected: 160, actual: 140, gap: -20 },
  { zone: 'Spa',                item: 'Bath Mat 20×30',   expected: 40,  actual: 12, gap: -28 },
  { zone: 'Gym',                item: 'Hand Towel 16×28', expected: 80,  actual: 75, gap: -5 },
];

export default function GapScan() {
  const [zone, setZone] = useState('All');
  const filtered = zone === 'All' ? gaps : gaps.filter(g => g.zone === zone);

  return (
    <div className="px-8 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-5">Gap Scan</h1>

      <div className="flex items-center gap-3 mb-5">
        <select
          value={zone}
          onChange={e => setZone(e.target.value)}
          className="text-sm border border-border rounded px-3 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="All">All Zones</option>
          {zones.map(z => <option key={z}>{z}</option>)}
        </select>
        <button className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition-opacity">
          <ScanLine size={14} /> Run Scan
        </button>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Zone','Item','Expected','Actual','Gap','Severity'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const pct = Math.abs(r.gap) / r.expected;
              const severity = pct > 0.4 ? 'High' : pct > 0.1 ? 'Medium' : 'Low';
              const sevColor = severity === 'High' ? 'text-red-600 bg-red-50' : severity === 'Medium' ? 'text-amber-600 bg-amber-50' : 'text-green-700 bg-green-50';
              return (
                <tr key={i} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent/40`}>
                  <td className="px-4 py-2.5">{r.zone}</td>
                  <td className="px-4 py-2.5 font-medium">{r.item}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.expected}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.actual}</td>
                  <td className="px-4 py-2.5 font-medium text-destructive">{r.gap}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sevColor}`}>{severity}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}