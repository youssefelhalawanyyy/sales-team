import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
  Bell
} from 'lucide-react';

export const Navigation = ({ userRole }) => {

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
    icon: LayoutDashboard
  };

  const calculatorItem = {
    label: 'JONIX Calculator',
    path: '/sales/ai-helper',
    icon: Calculator
  };

  const informationItem = {
    label: 'Information',
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
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
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

      informationItem,

      {
        label: 'Users',
        path: '/admin/users',
        icon: Users
      }
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
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Follow-Ups', path: '/sales/followups', icon: Bell },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Teams', path: '/sales/teams', icon: Users2 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
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
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Follow-Ups', path: '/sales/followups', icon: Bell },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Teams', path: '/sales/teams', icon: Users2 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
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
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Follow-Ups', path: '/sales/followups', icon: Bell },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* TOP BAR */}
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* LOGO */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:scale-105"
          >
            <div className="relative w-11 h-11 lg:w-12 lg:h-12">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:rotate-6">
                <span className="text-lg lg:text-xl">J</span>
              </div>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">JONIX</h1>
              <p className="text-xs text-gray-500 -mt-0.5 font-medium">Management System</p>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-5xl mx-8">

            {navItems.map((item, i) => {

              const Icon = item.icon;
              const groupActive = isGroupActive(item);

              if (!item.children) {
                return (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(item.path);
                      setOpenGroup(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap transform hover:scale-105 active:scale-95
                      ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600'
                      }`}
                  >
                    <Icon size={18} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-12" />
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap transform hover:scale-105 active:scale-95
                      ${
                        openGroup === i || groupActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600'
                      }`}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                    <span>{item.label}</span>

                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`transition-transform duration-300 ${openGroup === i ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openGroup === i && (

                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-dropdownFadeIn">

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
                            className={`relative w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all duration-200
                              ${
                                isActive(child.path)
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border-l-4 border-transparent hover:border-blue-200'
                              }`}
                            style={{ animationDelay: `${c * 30}ms` }}
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

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3 lg:gap-4">

            {/* User Info - Desktop */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-900 leading-tight">
                  {currentUser?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-gray-500 capitalize leading-tight font-medium">
                  {userRole?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 transition-all duration-300 hover:shadow-red-500/50 hover:scale-105 active:scale-95"
            >
              <LogOut size={18} strokeWidth={2.5} />
              <span>Logout</span>
            </button>

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <LogOut size={20} strokeWidth={2.5} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-600 transition-all duration-300"
            >
              {mobileOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>

          </div>

        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (

          <div className="lg:hidden border-t border-gray-200 bg-white animate-mobileSlideDown">

            {/* User Info - Mobile */}
            <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg animate-pulse-slow">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.email}
                  </p>
                  <p className="text-xs text-gray-600 capitalize mt-0.5 font-medium">
                    {userRole?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="py-2 max-h-[calc(100vh-250px)] overflow-y-auto">

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
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-all duration-200 animate-menuItemFadeIn
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
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold transition-all duration-200
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
                              className={`w-full flex items-center gap-3 pl-14 pr-4 py-3 text-sm transition-all duration-200 animate-submenuItemFadeIn
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

      {/* Animations */}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
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
            transform: translateY(-20px);
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
            transform: translateX(-20px);
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
            opacity: 0.8;
          }
        }

        .animate-dropdownFadeIn {
          animation: dropdownFadeIn 0.2s ease-out;
        }

        .animate-mobileSlideDown {
          animation: mobileSlideDown 0.3s ease-out;
        }

        .animate-mobileDropdownSlide {
          animation: mobileDropdownSlide 0.3s ease-out;
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

        /* Smooth scrolling for mobile menu */
        nav {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar for mobile menu */
        nav::-webkit-scrollbar {
          width: 6px;
        }

        nav::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        nav::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        nav::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

    </header>
  );
};