import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  ScanSearch, 
  Factory, 
  ClipboardList, 
  ShoppingCart, 
  PackageCheck, 
  Truck 
} from 'lucide-react';

const navItems = [
  { path: '/Inventory', label: 'Inventory', icon: Package },
  { path: '/GapScan', label: 'Gap Scan', icon: ScanSearch },
  { path: '/Suppliers', label: 'Suppliers', icon: Factory },
  { path: '/ReorderReview', label: 'Reorder Review', icon: ClipboardList },
  { path: '/Orders', label: 'Orders', icon: ShoppingCart },
  { path: '/Receiving', label: 'Receiving', icon: PackageCheck },
  { path: '/DeliveryPortal', label: 'Delivery Portal', icon: Truck },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground">Invyra</h1>
          <p className="text-xs text-muted-foreground">Laundry Inventory</p>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}