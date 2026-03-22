import { UserCheck, Clock, AlertCircle } from 'lucide-react';

const kpis = [
  { icon: UserCheck, label: 'Staff Clocked In',  value: '—' },
  { icon: Clock,     label: 'Late Arrivals',      value: '—' },
  { icon: AlertCircle, label: 'Missed Punches',   value: '—' },
];

const sampleRows = [
  { staff: 'Alan M.',  shift: 'Morning — 06:00–14:00', status: 'Clocked In'  },
  { staff: 'Tracy L.', shift: 'Morning — 06:00–14:00', status: 'Clocked In'  },
  { staff: 'Ben O.',   shift: 'Afternoon — 14:00–22:00', status: 'Not Started' },
  { staff: 'Sara K.',  shift: 'Morning — 06:00–14:00', status: 'Late'        },
  { staff: 'James R.', shift: 'Afternoon — 14:00–22:00', status: 'Not Started' },
];

const statusStyle = {
  'Clocked In':  'text-emerald-600',
  'Not Started': 'text-muted-foreground',
  'Late':        'text-amber-600',
};

export default function TimeTracking() {
  return (
    <div className="p-6 max-w-[1000px]">

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Time Tracking</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Staff clock-in, clock-out, and attendance monitoring</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {kpis.map(({ icon: Icon, label, value }) => (
          <div key={label} className="border border-border rounded bg-card px-5 py-4 flex items-center gap-4">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.8} />
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
              <p className="text-2xl font-bold text-foreground leading-tight mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sample table */}
      <div className="border border-border rounded overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Today's Attendance</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Staff', 'Shift', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={row.staff} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                <td className="px-5 py-2.5 font-medium">{row.staff}</td>
                <td className="px-5 py-2.5 text-muted-foreground">{row.shift}</td>
                <td className={`px-5 py-2.5 text-xs font-semibold ${statusStyle[row.status]}`}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground px-1">Time tracking integration will be added in a future build.</p>

    </div>
  );
}