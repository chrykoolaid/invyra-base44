import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Archive,
  ScanLine,
  Truck,
  RefreshCcw,
  ShoppingCart,
  PackageCheck,
  Globe,
} from 'lucide-react';

const nav = [
  { label: 'Inventory',       path: '/Inventory',      icon: Archive },
  { label: 'Gap Scan',        path: '/GapScan',         icon: ScanLine },
  { label: 'Suppliers',       path: '/Suppliers',       icon: Truck },
  { label: 'Reorder Review',  path: '/ReorderReview',   icon: RefreshCcw },
  { label: 'Orders',          path: '/Orders',          icon: ShoppingCart },
  { label: 'Receiving',       path: '/Receiving',       icon: PackageCheck },
  { label: 'Delivery Portal', path: '/DeliveryPortal',  icon: Globe },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden font-inter">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-sidebar-bg flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-white font-semibold text-base tracking-tight">Invyra</span>
          <span className="text-sidebar-fg text-xs ml-1">Laundry</span>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map(({ label, path, icon: Icon }) => {
            const active = pathname === path || pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-sidebar-activeBg text-sidebar-activeFg font-medium'
                    : 'text-sidebar-fg hover:bg-sidebar-hoverBg hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs text-sidebar-fg/60">
          v0.1 prototype
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}