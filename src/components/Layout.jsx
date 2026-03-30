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
  Share2,
} from 'lucide-react';

const primaryNav = [
  { path: '/Dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const operationsNav = [
  { path: '/Inventory',      label: 'Inventory',       icon: Package },
  { path: '/Wastage',        label: 'Wastage',         icon: Trash2 },
  { path: '/GapScan',        label: 'Gap Scan',        icon: ScanSearch },
  { path: '/Suppliers',      label: 'Suppliers',       icon: Factory },
  { path: '/ReorderReview',  label: 'Reorder Review',  icon: ClipboardList },
  { path: '/Orders',         label: 'Orders',          icon: ShoppingCart },
  { path: '/Receiving',      label: 'Receiving',       icon: PackageCheck },
  { path: '/DeliveryPortal', label: 'Delivery Portal', icon: Truck },
];

const workspaceNav = [
  { path: '/POSMode',             label: 'POS Mode',                    icon: Monitor },
  { path: '/Payroll',             label: 'Payroll & Rostering',         icon: Users },
  { path: '/TimeTracking',        label: 'Time Tracking',               icon: Clock },
  { path: '/InventoryAdmin',      label: 'Inventory Admin & Reporting', icon: BarChart2 },
  { path: '/ExportsIntegrations', label: 'Exports & Integrations',      icon: Share2 },
];

function NavGroup({ label, items, location }) {
  return (
    <div className="mb-4">
      {label && (
        <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">{label}</p>
      )}
      {items.map((item) => {
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

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 bg-card border-r border-border flex flex-col flex-shrink-0">
        <div className="px-4 py-3.5 border-b border-border">
          <h1 className="text-base font-semibold text-foreground">Invyra</h1>
          <p className="text-[11px] text-muted-foreground">Laundry Operations</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 pt-3">
          <NavGroup items={primaryNav} location={location} />
          <NavGroup label="Operations" items={operationsNav} location={location} />
          <NavGroup label="Admin & Optional" items={workspaceNav} location={location} />
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
