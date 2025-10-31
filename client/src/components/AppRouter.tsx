import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/layout/AppLayout';

// Auth Pages
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const UnauthorizedPage = React.lazy(() => import('@/pages/auth/UnauthorizedPage'));

// Agent Pages
const AgentDashboardPage = React.lazy(() => import('@/pages/agent/DashboardPage'));
const AgentReimbursementsPage = React.lazy(() => import('@/pages/agent/ReimbursementsPage'));
const NewReimbursementPage = React.lazy(() => import('@/pages/agent/NewReimbursementPage'));
const ReimbursementDetailPage = React.lazy(() => import('@/pages/agent/ReimbursementDetailPage'));
const AgentReportsPage = React.lazy(() => import('@/pages/agent/ReportsPage'));
const AgentProfilePage = React.lazy(() => import('@/pages/agent/ProfilePage'));

// Admin Pages
const AdminDashboardPage = React.lazy(() => import('@/pages/admin/DashboardPage'));
const AdminSpreadsheetsPage = React.lazy(() => import('@/pages/admin/SpreadsheetsPage'));
const SpreadsheetEditorPage = React.lazy(() => import('@/pages/admin/SpreadsheetEditorPage'));
const AdminSettingsPage = React.lazy(() => import('@/pages/admin/SettingsPage'));
const SpreadsheetSummaryPage = React.lazy(() => import('@/pages/admin/SpreadsheetSummaryPage'));
const ReactSpreadsheetsPage = React.lazy(() => import('@/pages/admin/ReactSpreadsheetsPage'));

// Loading Component
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('admin' | 'agent')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

// Root Redirect Component
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          {/* Register route removed - accounts created by admin only */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Agent Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['agent']}>
                <AppLayout title="Dashboard">
                  <AgentDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reimbursements"
            element={
              <ProtectedRoute roles={['agent']}>
                <AppLayout title="My Reimbursements">
                  <AgentReimbursementsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reimbursements/new"
            element={
              <ProtectedRoute roles={['agent']}>
                <AppLayout title="New Reimbursement">
                  <NewReimbursementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reimbursements/:id"
            element={
              <ProtectedRoute roles={['agent']}>
                <AppLayout title="Reimbursement Details">
                  <ReimbursementDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['agent']}>
                <AppLayout title="My Reports">
                  <AgentReportsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['admin', 'agent']}>
                <AppLayout title="Profile">
                  <AgentProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout title="Admin Dashboard">
                  <AdminDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/spreadsheets"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout title="Spreadsheets">
                  <AdminSpreadsheetsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/react-spreadsheets"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout title="React Spreadsheets">
                  <ReactSpreadsheetsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/spreadsheets/summary"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout title="Spreadsheet Summary">
                  <SpreadsheetSummaryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/spreadsheets/:id"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout title="Spreadsheet Editor">
                  <SpreadsheetEditorPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout title="Settings">
                  <AdminSettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={['admin', 'agent']}>
                <AppLayout title="Settings">
                  <AdminSettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Redirects */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Page not found</p>
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
