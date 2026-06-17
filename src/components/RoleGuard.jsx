import { useAuth } from '@/lib/AuthContext';
import { canAccessRoute } from '@/lib/permissions';
import { resolveEffectiveRole } from '@/lib/devRoleOverride';
import AccessDenied from '@/components/AccessDenied';
import { useLocation } from 'react-router-dom';

/**
 * Wrap any Route element with this to enforce role-based access.
 * Usage: <RoleGuard><YourPage /></RoleGuard>
 */
export default function RoleGuard({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const userRole = resolveEffectiveRole(user?.role);

  if (!canAccessRoute(userRole, location.pathname)) {
    return <AccessDenied userRole={userRole} />;
  }

  return children;
}
