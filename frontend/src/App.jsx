import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeRequest from './pages/employee/EmployeeRequest';
import EmployeeRequests from './pages/employee/EmployeeRequests';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerRequests from './pages/manager/ManagerRequests';
import ManagerApprovals from './pages/manager/ManagerApprovals';
import HrDashboard from './pages/hr/HrDashboard';
import HrUsers from './pages/hr/HrUsers';
import HrRequests from './pages/hr/HrRequests';
import HrPooling from './pages/hr/HrPooling';

const HrAnalytics = lazy(() => import('./pages/hr/HrAnalytics'));

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7] p-6"><div className="w-full max-w-sm rounded-xl border border-[#e3e4e8] bg-white p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#51245f] text-xs font-bold text-white">MI</span><span className="text-sm font-semibold text-[#33333c]">Mondelez Mobility</span></div><div className="skeleton mb-3 h-5 w-2/3 rounded" /><div className="skeleton h-4 w-full rounded" /></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace /> : <LoginPage />} />

      <Route path="/employee/dashboard" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/employee/request" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeRequest /></ProtectedRoute>} />
      <Route path="/employee/requests" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeRequests /></ProtectedRoute>} />

      <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['MANAGER']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/requests" element={<ProtectedRoute allowedRoles={['MANAGER']}><ManagerRequests /></ProtectedRoute>} />
      <Route path="/manager/approvals" element={<ProtectedRoute allowedRoles={['MANAGER']}><ManagerApprovals /></ProtectedRoute>} />

      <Route path="/hr/dashboard" element={<ProtectedRoute allowedRoles={['HR']}><HrDashboard /></ProtectedRoute>} />
      <Route path="/hr/users" element={<ProtectedRoute allowedRoles={['HR']}><HrUsers /></ProtectedRoute>} />
      <Route path="/hr/requests" element={<ProtectedRoute allowedRoles={['HR']}><HrRequests /></ProtectedRoute>} />
      <Route path="/hr/pending-requests" element={<ProtectedRoute allowedRoles={['HR']}><HrRequests view="pending" /></ProtectedRoute>} />
      <Route path="/hr/all-requests" element={<ProtectedRoute allowedRoles={['HR']}><HrRequests view="all" /></ProtectedRoute>} />
      <Route path="/hr/pooling" element={<ProtectedRoute allowedRoles={['HR']}><HrPooling /></ProtectedRoute>} />
      <Route path="/hr/analytics" element={<ProtectedRoute allowedRoles={['HR']}><Suspense fallback={<div className="p-6"><div className="skeleton h-8 w-48 rounded" /><div className="skeleton mt-4 h-64 rounded-xl" /></div>}><HrAnalytics /></Suspense></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={user ? `/${user.role.toLowerCase()}/dashboard` : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
