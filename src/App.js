import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TasksProvider } from './contexts/TasksContext';

import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import { FinancePage } from './pages/FinancePage';
import { FinanceReportsPage } from './pages/FinanceReportsPage';
import { OwnerSettlementsPage } from './pages/OwnerSettlementsPage';

import { CommissionPage } from './pages/comission';
import DescriptionPage from './pages/description';

import SalesDealsPage from './pages/SalesDealsPage';
import { SalesReportsPage } from './pages/SalesReportsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { TeamManagementPage } from './pages/TeamManagementPage';

/* ✅ JONIX AI */
import AIHelper from './pages/aiHelper';

/* ✅ NEW PAGES - FOLLOW-UPS & CLIENT PROFILE & VISITS & CONTACTS */
import FollowUpsPage from './pages/FollowUpsPage';
import ClientProfilePage from './pages/ClientProfilePage';
import VisitsPage from './pages/VisitsPage';
import ContactsPage from './pages/Contactspage';

/* ✅ NEW PAGES - TASKS & PERFORMANCE */
import TasksPage from './pages/TasksPage';
import CreateTaskPage from './pages/CreateTaskPage';
import PerformancePage from './pages/PerformancePage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';

import './App.css';

/* =============================
   APP CONTENT
============================= */

const AppContent = () => {

  const { currentUser, userRole, loading } = useAuth();

  /* Loading Screen */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
                <DescriptionPage />
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
                <AdminUsersPage />
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= FINANCE ================= */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute requiredRoles={['admin', 'finance_manager']}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FinancePage />
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= COMMISSIONS ================= */}
        <Route
          path="/finance/commissions"
          element={
            <ProtectedRoute requiredRoles={['admin', 'finance_manager']}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CommissionPage />
              </div>
            </ProtectedRoute>
          }
        />

        {/* ================= FINANCE REPORTS ================= */}
        <Route
          path="/finance/reports"
          element={
            <ProtectedRoute requiredRoles={['admin', 'finance_manager']}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FinanceReportsPage />
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
                <OwnerSettlementsPage />
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
                <ContactsPage />
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
                <SalesDealsPage />
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
                <FollowUpsPage />
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
                <VisitsPage />
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
                <ClientProfilePage />
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
                <AchievementsPage />
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
                <TeamManagementPage />
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
                <SalesReportsPage />
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
                <AIHelper />
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
              <TasksPage />
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
              <CreateTaskPage />
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
              <PerformancePage />
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
};

/* =============================
   ROOT
============================= */

function App() {
  return (
    <Router>
      <AuthProvider>
        <TasksProvider>
          <AppContent />
        </TasksProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;