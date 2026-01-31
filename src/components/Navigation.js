import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationsPanel } from './NotificationsPanel';
import { GlobalSearch } from './GlobalSearch';

import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  DollarSign,
  BarChart3,
  Trophy,
  Users2,
  ChevronDown,
  Info,
  Calculator,
  Bell,
  MapPin,
  CheckSquare,
  TrendingUp,
  BarChart2,
  Calendar,
  Settings,
  History,
  Database,
  FileText,
  Mail,
  Heart,
  MessageSquare,
  Zap
} from 'lucide-react';

export const Navigation = React.memo(({ userRole }) => {

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [mobileOpenGroup, setMobileOpenGroup] = useState(null);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenGroup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
    setMobileOpenGroup(null);
  }, [location.pathname]);

  /* =============================
     NAV ITEMS
  ============================= */

  const dashboardItem = {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    iconOnly: true
  };

  const calculatorItem = {
    label: 'Calculator',
    path: '/sales/ai-helper',
    icon: Calculator
  };

  const informationItem = {
    label: 'Info',
    path: '/description',
    icon: Info
  };

  /* =============================
     ROLE MENU
  ============================= */

  const roleBasedItems = {

    /* ADMIN */
    admin: [
      dashboardItem,
      calculatorItem,

      {
        label: 'Sales',
        icon: Users2,
        children: [
          { label: 'Contacts', path: '/sales/contacts', icon: Users },
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Visits', path: '/sales/visits', icon: MapPin },
          { label: 'Follow-Ups', path: '/sales/followups', icon: Bell },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Teams', path: '/sales/teams', icon: Users2 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
      },

      {
        label: 'Finance',
        icon: DollarSign,
        children: [
          { label: 'Finance', path: '/finance', icon: DollarSign },
          { label: 'Commissions', path: '/finance/commissions', icon: Users },
          { label: 'Reports', path: '/finance/reports', icon: BarChart3 },
          { label: 'Settlements', path: '/finance/settlements', icon: DollarSign }
        ]
      },

      {
        label: 'Tasks',
        icon: CheckSquare,
        children: [
          { label: 'Tasks', path: '/tasks', icon: CheckSquare },
          { label: 'Performance', path: '/admin/performance', icon: TrendingUp }
        ]
      },

      {
        label: 'Advanced',
        icon: TrendingUp,
        children: [
          { label: 'Quote Generator', path: '/quotes', icon: FileText },
          { label: 'Email Templates', path: '/email-templates', icon: Mail },
          { label: 'Client Health', path: '/client-health', icon: Heart },
          { label: 'Communication History', path: '/communication-history', icon: MessageSquare },
          { label: 'Team Leaderboard', path: '/team-leaderboard', icon: Trophy },
          { label: 'Revenue Forecast', path: '/revenue-forecast', icon: TrendingUp },
          { label: 'Win/Loss Analysis', path: '/win-loss', icon: BarChart3 },
          { label: 'Sales Velocity', path: '/sales-velocity', icon: Zap }
        ]
      },

      {
        label: 'Admin',
        icon: Settings,
        children: [
          { label: 'Users', path: '/admin/users', icon: Users },
          { label: 'Audit Log', path: '/admin/audit-log', icon: History },
          { label: 'Data Import/Export', path: '/admin/data', icon: Database },
          { label: 'Analytics', path: '/analytics', icon: BarChart2 },
          { label: 'Forecasting', path: '/forecasting', icon: TrendingUp },
          { label: 'Calendar', path: '/calendar', icon: Calendar }
        ]
      },

      informationItem
    ],

    /* FINANCE MANAGER */
    finance_manager: [
      dashboardItem,
      calculatorItem,

      {
        label: 'Finance',
        icon: DollarSign,
        children: [
          { label: 'Finance', path: '/finance', icon: DollarSign },
          { label: 'Commissions', path: '/finance/commissions', icon: Users },
          { label: 'Reports', path: '/finance/reports', icon: BarChart3 }
        ]
      },

      informationItem
    ],

    /* SALES MANAGER */
    sales_manager: [
      dashboardItem,
      calculatorItem,

      {
        label: 'Sales',
        icon: Users2,
        children: [
          { label: 'Contacts', path: '/sales/contacts', icon: Users },
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Visits', path: '/sales/visits', icon: MapPin },
          { label: 'Follow-Ups', path: '/sales/followups', icon: Bell },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Teams', path: '/sales/teams', icon: Users2 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
      },

      {
        label: 'Finance',
        icon: DollarSign,
        children: [
          { label: 'Finance', path: '/finance', icon: DollarSign },
          { label: 'Commissions', path: '/finance/commissions', icon: Users },
          { label: 'My Commissions', path: '/my/commissions', icon: DollarSign },
          { label: 'Reports', path: '/finance/reports', icon: BarChart3 },
          { label: 'Settlements', path: '/finance/settlements', icon: DollarSign }
        ]
      },

      {
        label: 'Calendar',
        path: '/calendar',
        icon: Calendar
      },

      informationItem
    ],

    /* TEAM LEADER */
    team_leader: [
      dashboardItem,
      calculatorItem,

      {
        label: 'Sales',
        icon: Users2,
        children: [
          { label: 'Contacts', path: '/sales/contacts', icon: Users },
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Visits', path: '/sales/visits', icon: MapPin },
          { label: 'Follow-Ups', path: '/sales/followups', icon: Bell },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Teams', path: '/sales/teams', icon: Users2 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
      },

      {
        label: 'Commissions',
        path: '/my/commissions',
        icon: DollarSign
      },

      {
        label: 'Tasks',
        icon: CheckSquare,
        children: [
          { label: 'Tasks', path: '/tasks', icon: CheckSquare },
          { label: 'Performance', path: '/admin/performance', icon: TrendingUp }
        ]
      },

      {
        label: 'Calendar',
        path: '/calendar',
        icon: Calendar
      },

      informationItem
    ],

    /* SALES MEMBER */
    sales_member: [
      dashboardItem,
      calculatorItem,

      {
        label: 'Sales',
        icon: Users2,
        children: [
          { label: 'Contacts', path: '/sales/contacts', icon: Users },
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Visits', path: '/sales/visits', icon: MapPin },
          { label: 'Follow-Ups', path: '/sales/followups', icon: Bell }
        ]
      },

      {
        label: 'Commissions',
        path: '/my/commissions',
        icon: DollarSign
      },

      {
        label: 'Tasks',
        path: '/tasks',
        icon: CheckSquare
      },

      {
        label: 'Calendar',
        path: '/calendar',
        icon: Calendar
      },

      informationItem
    ]
  };

  const navItems = roleBasedItems[userRole] || [];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const isGroupActive = (item) => {
    if (item.children) {
      return item.children.some(child => isActive(child.path));
    }
    return false;
  };

  /* =============================
     RENDER
  ============================= */

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95 safe-area-top">

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">

        {/* TOP BAR - Perfect size */}
        <div className="flex items-center justify-between h-12 sm:h-14 lg:h-14">

          {/* LOGO */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:rotate-6">
                <span className="text-sm sm:text-base lg:text-lg">J</span>
              </div>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight leading-none">
                JONIX
              </h1>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
                Management System
              </p>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-4xl mx-6">

            {navItems.map((item, i) => {

              const Icon = item.icon;
              const groupActive = isGroupActive(item);

              if (!item.children) {
                // Icon-only button for dashboard
                if (item.iconOnly) {
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        navigate(item.path);
                        setOpenGroup(null);
                      }}
                      className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 group relative
                        ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600'
                        }`}
                      title={item.label}
                    >
                      <Icon size={17} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-12" />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[11px] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                        {item.label}
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(item.path);
                      setOpenGroup(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-300 whitespace-nowrap transform hover:scale-105 active:scale-95
                      ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600'
                      }`}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <div key={i} className="relative" ref={openGroup === i ? dropdownRef : null}>

                  <button
                    onClick={() =>
                      setOpenGroup(openGroup === i ? null : i)
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-300 whitespace-nowrap transform hover:scale-105 active:scale-95
                      ${
                        openGroup === i || groupActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600'
                      }`}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                    <span>{item.label}</span>

                    <ChevronDown
                      size={14}
                      strokeWidth={2.5}
                      className={`transition-transform duration-300 ${openGroup === i ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openGroup === i && (

                    <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-dropdownFadeIn">

                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 pointer-events-none"></div>

                      {item.children.map((child, c) => {

                        const ChildIcon = child.icon;

                        return (
                          <button
                            key={c}
                            onClick={() => {
                              navigate(child.path);
                              setOpenGroup(null);
                            }}
                            className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-left transition-all duration-200
                              ${
                                isActive(child.path)
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border-l-4 border-transparent hover:border-blue-200'
                              }`}
                            style={{ animationDelay: `${c * 30}ms` }}
                          >
                            <ChildIcon size={16} strokeWidth={2} />
                            <span>{child.label}</span>
                          </button>
                        );
                      })}

                    </div>
                  )}

                </div>
              );
            })}

          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2 lg:gap-2.5">

            {/* Global Search - Desktop */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Notifications */}
            <NotificationsPanel />

            {/* User Info - Desktop */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-xs shadow-md">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold text-gray-900 leading-tight">
                  {currentUser?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-gray-500 capitalize leading-tight font-medium">
                  {userRole?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Logout - Icon only */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center justify-center p-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg shadow-lg shadow-red-500/30 transition-all duration-300 hover:shadow-red-500/50 hover:scale-110 active:scale-95 group relative"
              title="Logout"
            >
              <LogOut size={16} strokeWidth={2.5} />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[11px] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                Logout
              </div>
            </button>

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md shadow-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <LogOut size={20} strokeWidth={2.5} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-600 transition-all duration-300"
            >
              {mobileOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>

          </div>

        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (

          <div className="lg:hidden border-t border-gray-200 bg-white animate-mobileSlideDown">

            {/* User Info - Mobile */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg animate-pulse-slow">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                    {currentUser?.email}
                  </p>
                  <p className="text-xs text-gray-600 capitalize mt-0.5 font-medium">
                    {userRole?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="py-1 max-h-[calc(100vh-180px)] overflow-y-auto mobile-nav-scroll">

              {navItems.map((item, i) => {

                const Icon = item.icon;
                const groupActive = isGroupActive(item);

                if (!item.children) {
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 animate-menuItemFadeIn
                        ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-l-4 border-blue-600 shadow-sm'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border-l-4 border-transparent hover:border-blue-200'
                        }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <Icon size={20} strokeWidth={2.5} />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <div key={i} className="border-b border-gray-100 last:border-0 animate-menuItemFadeIn" style={{ animationDelay: `${i * 50}ms` }}>

                    <button
                      onClick={() =>
                        setMobileOpenGroup(mobileOpenGroup === i ? null : i)
                      }
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all duration-200
                        ${
                          mobileOpenGroup === i || groupActive
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} strokeWidth={2.5} />
                        <span>{item.label}</span>
                      </div>

                      <ChevronDown
                        size={18}
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 ${mobileOpenGroup === i ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {mobileOpenGroup === i && (

                      <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-t border-gray-200 animate-mobileDropdownSlide">

                        {item.children.map((child, c) => {

                          const ChildIcon = child.icon;

                          return (
                            <button
                              key={c}
                              onClick={() => {
                                navigate(child.path);
                                setMobileOpen(false);
                                setMobileOpenGroup(null);
                              }}
                              className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 text-sm transition-all duration-200 animate-submenuItemFadeIn
                                ${
                                  isActive(child.path)
                                    ? 'bg-white text-blue-600 font-semibold border-l-4 border-blue-600 shadow-sm'
                                    : 'text-gray-700 hover:bg-white border-l-4 border-transparent hover:border-blue-200'
                                }`}
                              style={{ animationDelay: `${c * 40}ms` }}
                            >
                              <ChildIcon size={18} strokeWidth={2} />
                              <span>{child.label}</span>
                            </button>
                          );
                        })}

                      </div>
                    )}

                  </div>
                );
              })}

            </nav>

          </div>
        )}

      </div>

      {/* Animations & Styles */}
      <style>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }

        .mobile-nav-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes mobileSlideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            max-height: 1000px;
            transform: translateY(0);
          }
        }

        @keyframes mobileDropdownSlide {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }

        @keyframes menuItemFadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes submenuItemFadeIn {
          from {
            opacity: 0;
            transform: translateX(-15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        .animate-dropdownFadeIn {
          animation: dropdownFadeIn 0.2s ease-out;
        }

        .animate-mobileSlideDown {
          animation: mobileSlideDown 0.25s ease-out;
        }

        .animate-mobileDropdownSlide {
          animation: mobileDropdownSlide 0.25s ease-out;
          overflow: hidden;
        }

        .animate-menuItemFadeIn {
          animation: menuItemFadeIn 0.3s ease-out forwards;
          opacity: 0;
        }

        .animate-submenuItemFadeIn {
          animation: submenuItemFadeIn 0.3s ease-out forwards;
          opacity: 0;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .mobile-nav-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .mobile-nav-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .mobile-nav-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }

        .mobile-nav-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }

        body.menu-open {
          position: fixed;
          width: 100%;
          overflow: hidden;
        }

        button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
      `}</style>

    </header>
  );
});