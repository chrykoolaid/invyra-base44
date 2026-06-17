import { useEffect, useMemo, useState } from 'react';
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
  Map,
  LogOut,
  FlaskConical,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { hasAccess, roleLabel, roleBadgeClass } from '@/lib/permissions';
import { resolveEffectiveRole } from '@/lib/devRoleOverride';

// Nav items — each has a `minRole` that controls visibility
const primaryNav = [
  { path: '/Dashboard', label: 'Dashboard',    icon: LayoutDashboard, minRole: 'staff' },
  { path: '/POSMode',   label: 'Point of Sale', icon: Monitor,         minRole: 'staff' },
];

const operationsNav = [
  { path: '/Inventory',      label: 'Inventory',   icon: Package,           minRole: 'supervisor' },
  { path: '/Movements',      label: 'Movements',   icon: ScrollText,        minRole: 'supervisor' },
  { path: '/Adjustments',    label: 'Adjustments', icon: SlidersHorizontal, minRole: 'supervisor' },
  { path: '/Transfers',      label: 'Transfers',   icon: ArrowLeftRight,    minRole: 'supervisor' },
  { path: '/Stocktake',      label: 'Stocktake',   icon: ClipboardCheck,    minRole: 'supervisor' },
  { path: '/Wastage',        label: 'Wastage',     icon: Trash2,            minRole: 'staff'      },
];

const purchasingNav = [
  { path: '/Suppliers',      label: 'Suppliers',       icon: Factory,       minRole: 'manager'    },
  { path: '/ReorderReview',  label: 'Reorder Review',  icon: ClipboardList, minRole: 'manager'    },
  { path: '/Orders',         label: 'Orders',          icon: ShoppingCart,  minRole: 'manager'    },
  { path: '/Receiving',      label: 'Receiving',       icon: PackageCheck,  minRole: 'supervisor' },
  { path: '/DeliveryPortal', label: 'Delivery Portal', icon: Truck,         minRole: 'supervisor' },
];

const intelligenceNav = [
  { path: '/GapScan',    label: 'Gap Scan',   icon: ScanSearch,    minRole: 'staff'      },
  { path: '/Exceptions', label: 'Exceptions', icon: AlertTriangle, minRole: 'supervisor' },
];

const adminNav = [
  { path: '/InventoryAdmin',       label: 'Inventory Admin',      icon: BarChart2, minRole: 'admin'   },
  { path: '/Reports',              label: 'Advanced Reports',     icon: BarChart3, minRole: 'manager' },
  { path: '/ExportsIntegrations',  label: 'Exports & Integrations',icon: Share2,   minRole: 'admin'   },
  { path: '/InventoryRoadmap',      label: 'Inventory Roadmap',     icon: Map,      minRole: 'admin'   },
  { path: '/InventorySettings',    label: 'Inventory Settings',    icon: SlidersHorizontal, minRole: 'admin' },
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

const COLLAPSIBLE_NAV_GROUPS = new Set(['Admin', 'Modules', 'Training']);
const SIDEBAR_COLLAPSE_STORAGE_KEY = 'invyra.sidebar.collapsedGroups.v1';

function getInitialCollapsedGroups() {
  const defaults = { Admin: true, Modules: true, Training: true };
  if (typeof window === 'undefined') return defaults;

  try {
    const saved = window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch {
    return defaults;
  }
}

function isNavItemActive(location, item) {
  return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
}

function NavGroup({ label, items, location, userRole, isCollapsed = false, onToggle }) {
  const visible = items.filter(item => hasAccess(userRole, item.minRole));
  if (visible.length === 0) return null;

  const isCollapsible = Boolean(onToggle);
  const hasActiveItem = visible.some(item => isNavItemActive(location, item));
  const showItems = !isCollapsible || !isCollapsed || hasActiveItem;

  return (
    <div className="mb-4">
      {label && isCollapsible && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={showItems}
          className="w-full px-3 mb-1.5 flex items-center justify-between gap-2 text-left text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest hover:text-muted-foreground transition-colors"
        >
          <span>{label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showItems ? 'rotate-0' : '-rotate-90'}`} />
        </button>
      )}

      {label && !isCollapsible && (
        <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">{label}</p>
      )}

      {showItems && visible.map((item) => {
        const isActive = isNavItemActive(location, item);
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
  const userRole = resolveEffectiveRole(user?.role);
  const [collapsedGroups, setCollapsedGroups] = useState(getInitialCollapsedGroups);

  const navGroups = useMemo(() => [
    { label: 'Main', items: primaryNav },
    { label: 'Operations', items: operationsNav },
    { label: 'Purchasing', items: purchasingNav },
    { label: 'Intelligence', items: intelligenceNav },
    { label: 'Admin', items: adminNav },
    { label: 'Modules', items: optionalNav },
    { label: 'Training', items: trainingNav },
  ], []);

  useEffect(() => {
    setCollapsedGroups((current) => {
      let changed = false;
      const next = { ...current };

      navGroups.forEach((group) => {
        if (!COLLAPSIBLE_NAV_GROUPS.has(group.label)) return;
        const hasActiveItem = group.items.some(item => isNavItemActive(location, item));
        if (hasActiveItem && next[group.label]) {
          next[group.label] = false;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [location, navGroups]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, JSON.stringify(collapsedGroups));
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }
  }, [collapsedGroups]);

  const toggleGroup = (label) => {
    setCollapsedGroups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 bg-card border-r border-border flex flex-col flex-shrink-0">
        <div className="px-4 py-3.5 border-b border-border">
          <h1 className="text-base font-semibold text-foreground">Invyra</h1>
          <p className="text-[11px] text-muted-foreground">Laundry Operations</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 pt-3">
          {navGroups.map((group) => {
            const isCollapsible = COLLAPSIBLE_NAV_GROUPS.has(group.label);
            return (
              <NavGroup
                key={group.label}
                label={group.label}
                items={group.items}
                location={location}
                userRole={userRole}
                isCollapsed={isCollapsible ? collapsedGroups[group.label] : false}
                onToggle={isCollapsible ? () => toggleGroup(group.label) : undefined}
              />
            );
          })}
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