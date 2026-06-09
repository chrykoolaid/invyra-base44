import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ScanSearch,
  Factory,
  ClipboardList,
  ShoppingCart,
  PackageCheck,
  Trash2,
  Truck,
  Monitor,
  Users,
  Clock,
  BarChart2,
  BarChart3,
  Share2,
  ClipboardCheck,
  ArrowLeftRight,
  SlidersHorizontal,
  ScrollText,
  AlertTriangle,
  LogOut,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { hasAccess, roleLabel, roleBadgeClass, ROUTE_PERMISSIONS } from '@/lib/permissions';

// Nav items — each has a `minRole` that controls visibility
const primaryNav = [
  { path: '/Dashboard', label: 'Dashboard',    icon: LayoutDashboard, minRole: 'staff' },
  { path: '/POSMode',   label: 'Point of Sale', icon: Monitor,         minRole: 'staff' },
];

const operationsNav = [
  { path: '/GapScan',        label: 'Gap Scan',        icon: ScanSearch,       minRole: 'staff'      },
  { path: '/Wastage',        label: 'Wastage',          icon: Trash2,           minRole: 'staff'      },
  { path: '/Inventory',      label: 'Inventory',        icon: Package,          minRole: 'supervisor' },
  { path: '/Receiving',      label: 'Receiving',        icon: PackageCheck,     minRole: 'supervisor' },
  { path: '/Stocktake',      label: 'Stocktake',        icon: ClipboardCheck,   minRole: 'supervisor' },
  { path: '/Transfers',      label: 'Transfers',        icon: ArrowLeftRight,   minRole: 'supervisor' },
  { path: '/Adjustments',    label: 'Adjustments',      icon: SlidersHorizontal,minRole: 'supervisor' },
  { path: '/Movements',      label: 'Movements',        icon: ScrollText,       minRole: 'supervisor' },
  { path: '/Exceptions',     label: 'Exceptions',       icon: AlertTriangle,    minRole: 'supervisor' },
  { path: '/DeliveryPortal', label: 'Delivery Portal',  icon: Truck,            minRole: 'supervisor' },
  { path: '/Suppliers',      label: 'Suppliers',        icon: Factory,          minRole: 'manager'    },
  { path: '/ReorderReview',  label: 'Reorder Review',   icon: ClipboardList,    minRole: 'manager'    },
  { path: '/Orders',         label: 'Orders',           icon: ShoppingCart,     minRole: 'manager'    },
];

const adminNav = [
  { path: '/InventoryAdmin',       label: 'Inventory Admin',      icon: BarChart2, minRole: 'admin'   },
  { path: '/Reports',              label: 'Advanced Reports',     icon: BarChart3, minRole: 'manager' },
  { path: '/ExportsIntegrations',  label: 'Exports & Integrations',icon: Share2,   minRole: 'admin'   },
];

const optionalNav = [
  { path: '/Payroll',      label: 'Payroll & Rostering', icon: Users,  minRole: 'manager' },
  { path: '/TimeTracking', label: 'Time Tracking',       icon: Clock,  minRole: 'manager' },
];

const trainingNav = [
  { path: '/Training/Staff',      label: 'Staff Training',      icon: FlaskConical, minRole: 'staff'      },
  { path: '/Training/Supervisor', label: 'Supervisor Training', icon: FlaskConical, minRole: 'supervisor' },
  { path: '/Training/Manager',    label: 'Manager Training',    icon: FlaskConical, minRole: 'manager'    },
];

function NavGroup({ label, items, location, userRole }) {
  const visible = items.filter(item => hasAccess(userRole, item.minRole));
  if (visible.length === 0) return null;
  return (
    <div className="mb-4">
      {label && (
        <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">{label}</p>
      )}
      {visible.map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm mb-0.5 transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const userRole = user?.role ?? 'staff';

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 bg-card border-r border-border flex flex-col flex-shrink-0">
        <div className="px-4 py-3.5 border-b border-border">
          <h1 className="text-base font-semibold text-foreground">Invyra</h1>
          <p className="text-[11px] text-muted-foreground">Laundry Operations</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 pt-3">
          <NavGroup label="Main"       items={primaryNav}   location={location} userRole={userRole} />
          <NavGroup label="Operations" items={operationsNav} location={location} userRole={userRole} />
          <NavGroup label="Admin"      items={adminNav}      location={location} userRole={userRole} />
          <NavGroup label="Modules"    items={optionalNav}   location={location} userRole={userRole} />
          <NavGroup label="Training"   items={trainingNav}   location={location} userRole={userRole} />
        </nav>

        {/* User identity footer */}
        {user && (
          <div className="px-3 py-3 border-t border-border">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{user.full_name || user.email}</p>
                <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium ${roleBadgeClass(userRole)}`}>
                  {roleLabel(userRole)}
                </span>
              </div>
              <button
                onClick={() => logout()}
                title="Sign out"
                className="flex-shrink-0 p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}