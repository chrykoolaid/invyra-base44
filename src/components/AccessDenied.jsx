import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { roleLabel } from '@/lib/permissions';

export default function AccessDenied({ userRole }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldOff size={26} className="text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Your current role <span className="font-medium text-foreground">({roleLabel(userRole)})</span> does not
        have permission to view this page. Contact your manager or admin to request access.
      </p>
      <Link
        to="/Dashboard"
        className="h-9 px-5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}