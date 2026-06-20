import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { TrainingProvider } from '@/lib/TrainingContext';
import TrainingStaff from './pages/training/TrainingStaff';
import TrainingSupervisor from './pages/training/TrainingSupervisor';
import TrainingManager from './pages/training/TrainingManager';

import Layout from './components/Layout';
import RoleGuard from './components/RoleGuard';
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
import POSMode from './pages/POSMode.jsx';
import Payroll from './pages/Payroll';
import TimeTracking from './pages/TimeTracking';
import InventoryAdmin from './pages/InventoryAdmin';
import ReceivingWorkspace from './pages/ReceivingWorkspace';
import ReceivingLog from './pages/ReceivingLog';
import ExportsIntegrations from './pages/ExportsIntegrations';
import SupplierPortal from './pages/SupplierPortal';
import Stocktake from './pages/Stocktake';
import Transfers from './pages/Transfers';
import Adjustments from './pages/Adjustments';
import Movements from './pages/Movements';
import Exceptions from './pages/Exceptions';
import InventoryRoadmap from './pages/InventoryRoadmap';
import LocalForecastVerification from './pages/LocalForecastVerification';
import InventorySettings from './pages/InventorySettings';
import Locations from './pages/Locations';
import Markdown from './pages/Markdown';
import MarkdownBatches from './pages/MarkdownBatches';
import MarkdownReviewQueuePage from './pages/MarkdownReviewQueuePage';
import MarkdownMonitor from './pages/MarkdownMonitor';
import MarkdownReports from './pages/MarkdownReports';
import MarkdownAcceptanceTests from './pages/MarkdownAcceptanceTests';
import ExpiryTracking from './pages/ExpiryTracking';

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
        <Route path="/Dashboard"             element={<RoleGuard><Dashboard /></RoleGuard>} />
        <Route path="/Inventory"             element={<RoleGuard><Inventory /></RoleGuard>} />
        <Route path="/Reports"               element={<RoleGuard><Reports /></RoleGuard>} />
        <Route path="/Wastage"               element={<RoleGuard><Wastage /></RoleGuard>} />
        <Route path="/GapScan"               element={<RoleGuard><GapScan /></RoleGuard>} />
        <Route path="/GapScan/floor"         element={<RoleGuard><GapScanFloor /></RoleGuard>} />
        <Route path="/Suppliers"             element={<RoleGuard><Suppliers /></RoleGuard>} />
        <Route path="/ReorderReview"         element={<RoleGuard><ReorderReview /></RoleGuard>} />
        <Route path="/Orders"                element={<RoleGuard><Orders /></RoleGuard>} />
        <Route path="/Receiving"             element={<RoleGuard><Receiving /></RoleGuard>} />
        <Route path="/Receiving/workspace"   element={<RoleGuard><ReceivingWorkspace /></RoleGuard>} />
        <Route path="/Receiving/log"         element={<RoleGuard><ReceivingLog /></RoleGuard>} />
        <Route path="/DeliveryPortal"        element={<RoleGuard><DeliveryPortal /></RoleGuard>} />
        <Route path="/POSMode"               element={<RoleGuard><POSMode /></RoleGuard>} />
        <Route path="/Payroll"               element={<RoleGuard><Payroll /></RoleGuard>} />
        <Route path="/TimeTracking"          element={<RoleGuard><TimeTracking /></RoleGuard>} />
        <Route path="/InventoryAdmin"        element={<RoleGuard><InventoryAdmin /></RoleGuard>} />
        <Route path="/ExportsIntegrations"   element={<RoleGuard><ExportsIntegrations /></RoleGuard>} />
        <Route path="/InventoryRoadmap"      element={<RoleGuard><InventoryRoadmap /></RoleGuard>} />
        <Route path="/SupplierPortal"        element={<RoleGuard><SupplierPortal /></RoleGuard>} />
        <Route path="/Stocktake"             element={<RoleGuard><Stocktake /></RoleGuard>} />
        <Route path="/Transfers"             element={<RoleGuard><Transfers /></RoleGuard>} />
        <Route path="/Adjustments"           element={<RoleGuard><Adjustments /></RoleGuard>} />
        <Route path="/Movements"             element={<RoleGuard><Movements /></RoleGuard>} />
        <Route path="/Exceptions"            element={<RoleGuard><Exceptions /></RoleGuard>} />
        <Route path="/LocalForecastVerification" element={<RoleGuard><LocalForecastVerification /></RoleGuard>} />
        <Route path="/InventorySettings"        element={<RoleGuard><InventorySettings /></RoleGuard>} />
        <Route path="/Locations"             element={<RoleGuard><Locations /></RoleGuard>} />
        <Route path="/Markdown"               element={<RoleGuard><Markdown /></RoleGuard>} />
        <Route path="/Markdown/Batches"       element={<RoleGuard><MarkdownBatches /></RoleGuard>} />
        <Route path="/Markdown/ReviewQueue"   element={<RoleGuard><MarkdownReviewQueuePage /></RoleGuard>} />
        <Route path="/Markdown/Monitor"       element={<RoleGuard><MarkdownMonitor /></RoleGuard>} />
        <Route path="/Markdown/Reports"       element={<RoleGuard><MarkdownReports /></RoleGuard>} />
        <Route path="/Markdown/Tests"         element={<RoleGuard><MarkdownAcceptanceTests /></RoleGuard>} />
        <Route path="/ExpiryTracking"          element={<RoleGuard><ExpiryTracking /></RoleGuard>} />
        {/* Training routes — RoleGuard enforces RBAC; TrainingProvider scopes DB to environment:"TRAINING" */}
        <Route path="/Training/Staff"      element={<RoleGuard><TrainingProvider><TrainingStaff /></TrainingProvider></RoleGuard>} />
        <Route path="/Training/Supervisor" element={<RoleGuard><TrainingProvider><TrainingSupervisor /></TrainingProvider></RoleGuard>} />
        <Route path="/Training/Manager"    element={<RoleGuard><TrainingProvider><TrainingManager /></TrainingProvider></RoleGuard>} />
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