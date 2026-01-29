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
  List,
  Calculator
} from 'lucide-react';

export const Navigation = ({ userRole }) => {

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
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
  }, [location.pathname]);

  /* =============================
     NAV ITEMS
  ============================= */

  const priceListItem = {
    label: 'Price List',
    path: '/description',
    icon: List
  };

  const calculatorItem = {
    label: 'JONIX Calculator',
    path: '/sales/ai-helper',
    icon: Calculator
  };

  /* =============================
     ROLE MENU
  ============================= */

  const roleBasedItems = {

    /* ADMIN */
    admin: [
      priceListItem,
      calculatorItem,

      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard
      },

      {
        label: 'Users',
        path: '/admin/users',
        icon: Users
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
        label: 'Sales',
        icon: Users2,
        children: [
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Teams', path: '/sales/teams', icon: Users2 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
      }
    ],

    /* FINANCE MANAGER */
    finance_manager: [
      priceListItem,
      calculatorItem,

      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard
      },

      {
        label: 'Finance',
        icon: DollarSign,
        children: [
          { label: 'Finance', path: '/finance', icon: DollarSign },
          { label: 'Commissions', path: '/finance/commissions', icon: Users },
          { label: 'Reports', path: '/finance/reports', icon: BarChart3 }
        ]
      }
    ],

    /* SALES MANAGER */
    sales_manager: [
      priceListItem,
      calculatorItem,

      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard
      },

      {
        label: 'Sales',
        icon: Users2,
        children: [
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Teams', path: '/sales/teams', icon: Users2 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
      }
    ],

    /* TEAM LEADER */
    team_leader: [
      priceListItem,
      calculatorItem,

      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard
      },

      {
        label: 'Sales',
        icon: Users2,
        children: [
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Teams', path: '/sales/teams', icon: Users2 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
      }
    ],

    /* SALES MEMBER */
    sales_member: [
      priceListItem,
      calculatorItem,

      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard
      },

      {
        label: 'Sales',
        icon: Users2,
        children: [
          { label: 'Deals', path: '/sales/deals', icon: Users2 },
          { label: 'Reports', path: '/sales/reports', icon: BarChart3 },
          { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
        ]
      }
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* TOP BAR */}
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* LOGO */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 cursor-pointer group transition-transform hover:scale-105"
          >
            <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <span className="text-lg lg:text-xl">J</span>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 tracking-tight">JONIX</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Management System</p>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-4xl mx-8">

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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                      ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                  >
                    <Icon size={18} strokeWidth={2.5} />
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                      ${
                        openGroup === i || groupActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                    <span>{item.label}</span>

                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`transition-transform duration-200 ${openGroup === i ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openGroup === i && (

                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">

                      {item.children.map((child, c) => {

                        const ChildIcon = child.icon;

                        return (
                          <button
                            key={c}
                            onClick={() => {
                              navigate(child.path);
                              setOpenGroup(null);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                              ${
                                isActive(child.path)
                                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                              }`}
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
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-sm">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-900 leading-tight">
                  {currentUser?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-gray-500 capitalize leading-tight">
                  {userRole?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 transition-all hover:shadow-red-500/50"
            >
              <LogOut size={18} strokeWidth={2.5} />
              <span>Logout</span>
            </button>

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30 transition-all"
            >
              <LogOut size={20} strokeWidth={2.5} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
            >
              {mobileOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>

          </div>

        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (

          <div className="lg:hidden border-t border-gray-200 bg-white animate-slideDown">

            {/* User Info - Mobile */}
            <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.email}
                  </p>
                  <p className="text-xs text-gray-600 capitalize mt-0.5">
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
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors
                        ${
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                    >
                      <Icon size={20} strokeWidth={2.5} />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <div key={i} className="border-b border-gray-100 last:border-0">

                    <button
                      onClick={() =>
                        setOpenGroup(openGroup === i ? null : i)
                      }
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors
                        ${
                          openGroup === i || groupActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} strokeWidth={2.5} />
                        <span>{item.label}</span>
                      </div>

                      <ChevronDown
                        size={18}
                        strokeWidth={2.5}
                        className={`transition-transform duration-200 ${openGroup === i ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {openGroup === i && (

                      <div className="bg-gray-50 border-t border-gray-200">

                        {item.children.map((child, c) => {

                          const ChildIcon = child.icon;

                          return (
                            <button
                              key={c}
                              onClick={() => {
                                navigate(child.path);
                                setMobileOpen(false);
                                setOpenGroup(null);
                              }}
                              className={`w-full flex items-center gap-3 pl-14 pr-4 py-3 text-sm transition-colors
                                ${
                                  isActive(child.path)
                                    ? 'bg-white text-blue-600 font-semibold border-l-4 border-blue-600'
                                    : 'text-gray-700 hover:bg-white border-l-4 border-transparent'
                                }`}
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>

    </header>
  );
};