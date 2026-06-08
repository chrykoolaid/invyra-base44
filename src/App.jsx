import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Wastage from './pages/Wastage';
import GapScan from './pages/GapScan';
import GapScanFloor from './pages/GapScanFloor';
import Suppliers from './pages/Suppliers';
import ReorderReview from './pages/ReorderReview';
import Orders from './pages/Orders';
import Receiving from './pages/Receiving';
import DeliveryPortal from './pages/DeliveryPortal';
import POSMode from './pages/POSMode';
import Payroll from './pages/Payroll';
import TimeTracking from './pages/TimeTracking';
import InventoryAdmin from './pages/InventoryAdmin';
import ReceivingWorkspace from './pages/ReceivingWorkspace';
import WastageWorkspace from './pages/WastageWorkspace';
import ReceivingLog from './pages/ReceivingLog';
import ExportsIntegrations from './pages/ExportsIntegrations';
import SupplierPortal from './pages/SupplierPortal';
import Stocktake from './pages/Stocktake';
import Transfers from './pages/Transfers';
import Adjustments from './pages/Adjustments';
import Movements from './pages/Movements';
import Exceptions from './pages/Exceptions';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Inventory" element={<Inventory />} />
        <Route path="/Reports" element={<Reports />} />
        <Route path="/Wastage" element={<Wastage />} />
        <Route path="/GapScan" element={<GapScan />} />
        <Route path="/GapScan/floor" element={<GapScanFloor />} />
        <Route path="/Suppliers" element={<Suppliers />} />
        <Route path="/ReorderReview" element={<ReorderReview />} />
        <Route path="/Orders" element={<Orders />} />
        <Route path="/Receiving" element={<Receiving />} />
        <Route path="/Wastage/workspace" element={<WastageWorkspace />} />
        <Route path="/Receiving/workspace" element={<ReceivingWorkspace />} />
        <Route path="/Receiving/log" element={<ReceivingLog />} />
        <Route path="/DeliveryPortal" element={<DeliveryPortal />} />
        <Route path="/POSMode" element={<POSMode />} />
        <Route path="/Payroll" element={<Payroll />} />
        <Route path="/TimeTracking" element={<TimeTracking />} />
        <Route path="/InventoryAdmin" element={<InventoryAdmin />} />
        <Route path="/ExportsIntegrations" element={<ExportsIntegrations />} />
        <Route path="/SupplierPortal" element={<SupplierPortal />} />
        <Route path="/Stocktake" element={<Stocktake />} />
        <Route path="/Transfers" element={<Transfers />} />
        <Route path="/Adjustments" element={<Adjustments />} />
        <Route path="/Movements" element={<Movements />} />
        <Route path="/Exceptions" element={<Exceptions />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App