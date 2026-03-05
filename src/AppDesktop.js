import React, { useState, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import {
  LogOut,
  ChevronDown,
  Home,
  Users,
  ShoppingCart,
  FileText,
  TrendingUp,
  MapPin,
  AlertCircle,
  DollarSign,
  Zap,
  Trophy,
  Calendar,
  Heart,
  MessageCircle,
  BarChart3,
  Clock,
  Mail,
  BookOpen,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Sun,
  Moon,
  Grid,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

// Import pages directly (they all work with this app)
import { Dashboard } from './pages/Dashboard';
const ContactsPage = React.lazy(() => import('./pages/Contactspage'));
const SalesDealsPage = React.lazy(() => import('./pages/SalesDealsPage'));
const SalesReportsPage = React.lazy(() => import('./pages/SalesReportsPage'));
const FollowUpsPage = React.lazy(() => import('./pages/FollowUpsPage'));
const PerformancePage = React.lazy(() => import('./pages/PerformancePage'));
const AnalyticsDashboard = React.lazy(() => import('./pages/AnalyticsDashboard'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));
const VisitsPage = React.lazy(() => import('./pages/VisitsPage'));
const QuoteGeneratorPage = React.lazy(() => import('./pages/QuoteGeneratorPage'));
const TeamPerformanceLeaderboardPage = React.lazy(() => import('./pages/TeamPerformanceLeaderboardPage'));
const AdminUsersPage = React.lazy(() => import('./pages/AdminUsersPage'));
const AuditLog = React.lazy(() => import('./pages/AuditLog'));
const TasksPageV2 = React.lazy(() => import('./pages/TasksPageV2'));
const CalendarView = React.lazy(() => import('./pages/CalendarView'));
const EmailTemplatesPage = React.lazy(() => import('./pages/EmailTemplatesPage'));
const ClientHealthScoringPage = React.lazy(() => import('./pages/ClientHealthScoringPage'));
const ClientCommunicationHistoryPage = React.lazy(() => import('./pages/ClientCommunicationHistoryPage'));
const RevenuePipelineForecastPage = React.lazy(() => import('./pages/RevenuePipelineForecastPage'));
const WinLossAnalysisPage = React.lazy(() => import('./pages/WinLossAnalysisPage'));
const SalesVelocityMetricsPage = React.lazy(() => import('./pages/SalesVelocityMetricsPage'));
const PlaybooksPage = React.lazy(() => import('./pages/PlaybooksPage'));
const CommissionPage = React.lazy(() => import('./pages/comission'));
const FinanceReportsPage = React.lazy(() => import('./pages/FinanceReportsPage'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600 font-semibold">Loading...</p>
    </div>
  </div>
);

const MENU_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', path: 'dashboard', icon: Home, color: 'from-indigo-500 to-purple-500' },
    ]
  },
  {
    title: 'SALES',
    items: [
      { label: 'Contacts', path: 'contacts', icon: Users, color: 'from-blue-500 to-cyan-500' },
      { label: 'Deals', path: 'deals', icon: ShoppingCart, color: 'from-green-500 to-emerald-500' },
      { label: 'Follow-Ups', path: 'followups', icon: Bell, color: 'from-orange-500 to-red-500' },
      { label: 'Quotes', path: 'quotes', icon: FileText, color: 'from-pink-500 to-rose-500' },
    ]
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Reports', path: 'reports', icon: BarChart3, color: 'from-violet-500 to-purple-500' },
      { label: 'Performance', path: 'performance', icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
      { label: 'Analytics', path: 'analytics', icon: Grid, color: 'from-fuchsia-500 to-pink-500' },
      { label: 'Leaderboard', path: 'leaderboard', icon: Trophy, color: 'from-yellow-500 to-amber-500' },
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Visits', path: 'visits', icon: MapPin, color: 'from-teal-500 to-cyan-500' },
      { label: 'Tasks', path: 'tasks', icon: AlertCircle, color: 'from-lime-500 to-green-500' },
      { label: 'Calendar', path: 'calendar', icon: Calendar, color: 'from-sky-500 to-blue-500' },
      { label: 'Communication', path: 'communication', icon: MessageCircle, color: 'from-rose-500 to-pink-500' },
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Finance', path: 'finance', icon: DollarSign, color: 'from-green-600 to-emerald-600' },
      { label: 'Finance Reports', path: 'finance-reports', icon: FileText, color: 'from-emerald-500 to-teal-500' },
      { label: 'Commissions', path: 'commissions', icon: Zap, color: 'from-yellow-600 to-amber-600' },
    ]
  },
  {
    title: 'INSIGHTS',
    items: [
      { label: 'Client Health', path: 'health', icon: Heart, color: 'from-red-500 to-pink-500' },
      { label: 'Win/Loss', path: 'winloss', icon: TrendingUp, color: 'from-indigo-600 to-blue-600' },
      { label: 'Sales Velocity', path: 'velocity', icon: Zap, color: 'from-orange-600 to-red-600' },
      { label: 'Revenue Forecast', path: 'revenue', icon: BarChart3, color: 'from-purple-600 to-indigo-600' },
    ]
  },
  {
    title: 'TOOLS',
    items: [
      { label: 'Email Templates', path: 'email', icon: Mail, color: 'from-blue-600 to-cyan-600' },
      { label: 'Playbooks', path: 'playbooks', icon: BookOpen, color: 'from-slate-600 to-gray-600' },
      { label: 'Admin', path: 'admin', icon: Settings, color: 'from-gray-600 to-slate-600' },
      { label: 'Audit Log', path: 'audit', icon: Clock, color: 'from-cyan-600 to-blue-600' },
    ]
  }
];

function renderPageComponent(page) {
  try {
    switch (page) {
      case 'dashboard':
        return <Dashboard />;
      case 'contacts':
        return <React.Suspense fallback={<LoadingFallback />}><ContactsPage /></React.Suspense>;
      case 'deals':
        return <React.Suspense fallback={<LoadingFallback />}><SalesDealsPage /></React.Suspense>;
      case 'reports':
        return <React.Suspense fallback={<LoadingFallback />}><SalesReportsPage /></React.Suspense>;
      case 'followups':
        return <React.Suspense fallback={<LoadingFallback />}><FollowUpsPage /></React.Suspense>;
      case 'visits':
        return <React.Suspense fallback={<LoadingFallback />}><VisitsPage /></React.Suspense>;
      case 'performance':
        return <React.Suspense fallback={<LoadingFallback />}><PerformancePage /></React.Suspense>;
      case 'finance':
        return <React.Suspense fallback={<LoadingFallback />}><FinancePage /></React.Suspense>;
      case 'finance-reports':
        return <React.Suspense fallback={<LoadingFallback />}><FinanceReportsPage /></React.Suspense>;
      case 'analytics':
        return <React.Suspense fallback={<LoadingFallback />}><AnalyticsDashboard /></React.Suspense>;
      case 'quotes':
        return <React.Suspense fallback={<LoadingFallback />}><QuoteGeneratorPage /></React.Suspense>;
      case 'leaderboard':
        return <React.Suspense fallback={<LoadingFallback />}><TeamPerformanceLeaderboardPage /></React.Suspense>;
      case 'admin':
        return <React.Suspense fallback={<LoadingFallback />}><AdminUsersPage /></React.Suspense>;
      case 'audit':
        return <React.Suspense fallback={<LoadingFallback />}><AuditLog /></React.Suspense>;
      case 'tasks':
        return <React.Suspense fallback={<LoadingFallback />}><TasksPageV2 /></React.Suspense>;
      case 'calendar':
        return <React.Suspense fallback={<LoadingFallback />}><CalendarView /></React.Suspense>;
      case 'email':
        return <React.Suspense fallback={<LoadingFallback />}><EmailTemplatesPage /></React.Suspense>;
      case 'health':
        return <React.Suspense fallback={<LoadingFallback />}><ClientHealthScoringPage /></React.Suspense>;
      case 'communication':
        return <React.Suspense fallback={<LoadingFallback />}><ClientCommunicationHistoryPage /></React.Suspense>;
      case 'winloss':
        return <React.Suspense fallback={<LoadingFallback />}><WinLossAnalysisPage /></React.Suspense>;
      case 'velocity':
        return <React.Suspense fallback={<LoadingFallback />}><SalesVelocityMetricsPage /></React.Suspense>;
      case 'revenue':
        return <React.Suspense fallback={<LoadingFallback />}><RevenuePipelineForecastPage /></React.Suspense>;
      case 'playbooks':
        return <React.Suspense fallback={<LoadingFallback />}><PlaybooksPage /></React.Suspense>;
      case 'commissions':
        return <React.Suspense fallback={<LoadingFallback />}><CommissionPage /></React.Suspense>;
      default:
        return <Dashboard />;
    }
  } catch (error) {
    console.error('Error rendering page:', error);
    return <Dashboard />;
  }
}

function ModernAppLayout({ currentUser, logout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Find current page title
  const currentPageTitle = useMemo(() => {
    for (const section of MENU_SECTIONS) {
      const item = section.items.find(i => i.path === currentPage);
      if (item) return item.label;
    }
    return 'Dashboard';
  }, [currentPage]);

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Left Sidebar - Modern Navigation */}
      <aside className={`w-64 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-r shadow-lg overflow-y-auto transition-colors duration-300`}>
        {/* Logo & Branding */}
        <div className={`sticky top-0 z-50 p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border-b`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              J
            </div>
            <div>
              <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>J-System</h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enterprise Sales</p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="px-3 py-6 space-y-6">
          {MENU_SECTIONS.map((section, secIdx) => (
            <div key={secIdx}>
              <h3 className={`px-3 py-2 text-xs font-bold tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.path;
                  return (
                    <button
                      key={itemIdx}
                      onClick={() => setCurrentPage(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-md font-medium`
                          : darkMode
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Card - Bottom */}
        <div className={`sticky bottom-0 p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border-t mt-auto`}>
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-100'} rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'} truncate`}>
                  {currentUser?.email?.split('@')[0]}
                </p>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} truncate`}>
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                darkMode
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b shadow-sm`}>
          <div className="flex items-center justify-between px-8 py-4">
            {/* Left: Page Title */}
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {currentPageTitle}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2.5 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-slate-800 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-slate-800 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <button
                className={`p-2.5 rounded-lg transition-colors relative ${
                  darkMode
                    ? 'hover:bg-slate-800 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 overflow-auto ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
          <div className="h-full">
            {renderPageComponent(currentPage)}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppDesktop() {
  const { currentUser, logout, loading } = useAuth();

  // Loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Initializing J-System...</p>
        </div>
      </div>
    );
  }

  // Login screen (no sidebar)
  if (!currentUser) {
    return <LoginPage />;
  }

  // Main app with navigation
  return <ModernAppLayout currentUser={currentUser} logout={logout} />;
}
