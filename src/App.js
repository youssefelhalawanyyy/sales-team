import React, { Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TasksProvider } from './contexts/TasksContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import './App.css';

import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';

// Lazy load heavy pages for faster initial load on mobile
const AdminUsersPage = React.lazy(() => import('./pages/AdminUsersPage'));
const FinancePage = React.lazy(() => import('./pages/FinancePage').then(m => ({ default: m.FinancePage })));
const FinanceReportsPage = React.lazy(() => import('./pages/FinanceReportsPage').then(m => ({ default: m.FinanceReportsPage })));
const OwnerSettlementsPage = React.lazy(() => import('./pages/OwnerSettlementsPage').then(m => ({ default: m.OwnerSettlementsPage })));
const CommissionPage = React.lazy(() => import('./pages/comission'));
const DescriptionPage = React.lazy(() => import('./pages/description'));
const SalesDealsPage = React.lazy(() => import('./pages/SalesDealsPage'));
const SalesReportsPage = React.lazy(() => import('./pages/SalesReportsPage'));
const AchievementsPage = React.lazy(() => import('./pages/AchievementsPage'));
const TeamManagementPage = React.lazy(() => import('./pages/TeamManagementPage'));
const AIHelper = React.lazy(() => import('./pages/aiHelper'));
const FollowUpsPage = React.lazy(() => import('./pages/FollowUpsPage'));
const ClientProfilePage = React.lazy(() => import('./pages/ClientProfilePage'));
const VisitsPage = React.lazy(() => import('./pages/VisitsPage'));
const ContactsPage = React.lazy(() => import('./pages/Contactspage'));
const TasksPageV2 = React.lazy(() => import('./pages/TasksPageV2'));
const CreateTaskPage = React.lazy(() => import('./pages/CreateTaskPage'));
const PerformancePage = React.lazy(() => import('./pages/PerformancePage'));
const AnalyticsDashboard = React.lazy(() => import('./pages/AnalyticsDashboard'));
const CalendarView = React.lazy(() => import('./pages/CalendarView'));
const UserSettings = React.lazy(() => import('./pages/UserSettings'));
const AuditLog = React.lazy(() => import('./pages/AuditLog'));
const DataImportExport = React.lazy(() => import('./pages/DataImportExport'));
const SalesForecasting = React.lazy(() => import('./pages/SalesForecasting'));

// Loading fallback component - lightweight for fast rendering
const LoadingFallback = React.memo(() => (
  <div className="flex items-center justify-center h-screen bg-white">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" style={{ animationDuration: '0.8s' }}></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
));

/* =============================
   APP CONTENT
============================= */

const AppContent = React.memo(() => {

  const { currentUser, userRole, loading } = useAuth();

  // Initialize push notifications
  useEffect(() => {
    if (currentUser && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(err => {
        console.log('Service Worker registration failed:', err);
      });
    }
  }, [currentUser]);

  /* Loading Screen */
  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <>

      {/* Navigation */}
      {currentUser && <Navigation userRole={userRole} />}

      <Routes>

        {/* ================= LOGIN ================= */}
        <Route path="/login" element={<LoginPage />} />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Dashboard />
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= DESCRIPTION ================= */}
        <Route
          path="/description"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'finance_manager',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <DescriptionPage />
                </Suspense>
              </div>

            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <AdminUsersPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= FINANCE ================= */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <FinancePage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= COMMISSIONS ================= */}
        <Route
          path="/finance/commissions"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <CommissionPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= FINANCE REPORTS ================= */}
        <Route
          path="/finance/reports"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <FinanceReportsPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= OWNER SETTLEMENTS ================= */}
        <Route
          path="/finance/settlements"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <OwnerSettlementsPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= SALES CONTACTS ================= */}
        <Route
          path="/sales/contacts"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <ContactsPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= SALES DEALS ================= */}
        <Route
          path="/sales/deals"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <SalesDealsPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= FOLLOW-UPS ================= */}
        <Route
          path="/sales/followups"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <FollowUpsPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= CLIENT VISITS ================= */}
        <Route
          path="/sales/visits"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <VisitsPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= CLIENT PROFILE ================= */}
        <Route
          path="/sales/client/:dealId"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <ClientProfilePage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= SALES ACHIEVEMENTS ================= */}
        <Route
          path="/sales/achievements"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <AchievementsPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= TEAM MANAGEMENT ================= */}
        <Route
          path="/sales/teams"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <TeamManagementPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= SALES REPORTS ================= */}
        <Route
          path="/sales/reports"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <SalesReportsPage />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= JONIX AI ASSISTANT ================= */}
        <Route
          path="/sales/ai-helper"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <AIHelper />
                </Suspense>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= TASKS ================= */}
        <Route
          path="/tasks"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <Suspense fallback={<LoadingFallback />}>
                <TasksPageV2 />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= CREATE TASK ================= */}
        <Route
          path="/tasks/create"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader'
            ]}>
              <Suspense fallback={<LoadingFallback />}>
                <CreateTaskPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= PERFORMANCE ================= */}
        <Route
          path="/admin/performance"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'team_leader'
            ]}>
              <Suspense fallback={<LoadingFallback />}>
                <PerformancePage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= ANALYTICS ================= */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Suspense fallback={<LoadingFallback />}>
                <AnalyticsDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= CALENDAR ================= */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <Suspense fallback={<LoadingFallback />}>
                <CalendarView />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= FORECASTING ================= */}
        <Route
          path="/forecasting"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Suspense fallback={<LoadingFallback />}>
                <SalesForecasting />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= SETTINGS ================= */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRoles={[
              'admin',
              'sales_manager',
              'team_leader',
              'sales_member'
            ]}>
              <Suspense fallback={<LoadingFallback />}>
                <UserSettings />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= AUDIT LOG ================= */}
        <Route
          path="/admin/audit-log"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Suspense fallback={<LoadingFallback />}>
                <AuditLog />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= DATA IMPORT/EXPORT ================= */}
        <Route
          path="/admin/data"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Suspense fallback={<LoadingFallback />}>
                <DataImportExport />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ================= SALES DEFAULT ================= */}
        <Route
          path="/sales"
          element={<Navigate to="/sales/deals" replace />}
        />

        {/* ================= ROOT ================= */}
        <Route
          path="/"
          element={
            <Navigate
              to={currentUser ? '/dashboard' : '/login'}
              replace
            />
          }
        />

      </Routes>
    </>
  );
});

/* =============================
   ROOT
============================= */

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <NotificationProvider>
            <TasksProvider>
              <AppContent />
            </TasksProvider>
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;