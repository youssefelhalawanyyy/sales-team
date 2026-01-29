import React, { useState } from 'react';
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
  Bot
} from 'lucide-react';

export const Navigation = ({ userRole }) => {

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /* =============================
     NAV ITEMS
  ============================= */

  const priceListItem = {
    label: 'Price List',
    path: '/description',
    icon: List
  };

  const aiHelperItem = {
    label: 'AI Helper',
    path: '/sales/ai-helper',
    icon: Bot
  };

  /* =============================
     ROLE MENU
  ============================= */

  const roleBasedItems = {

    /* ADMIN */
    admin: [
      priceListItem,
      aiHelperItem,

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
      aiHelperItem,

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
      aiHelperItem,

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
      aiHelperItem,

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
      aiHelperItem,

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

  const isActive = (path) => location.pathname.startsWith(path);

  /* =============================
     RENDER
  ============================= */

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* TOP BAR */}
        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow">
              J
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">Jonix</h1>
              <p className="text-xs text-gray-500 -mt-1">System</p>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-2">

            {navItems.map((item, i) => {

              const Icon = item.icon;

              if (!item.children) {
                return (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(item.path);
                      setOpenGroup(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                      ${
                        isActive(item.path)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              }

              return (
                <div key={i} className="relative">

                  <button
                    onClick={() =>
                      setOpenGroup(openGroup === i ? null : i)
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                      ${
                        openGroup === i
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                  >
                    <Icon size={18} />
                    {item.label}

                    <ChevronDown
                      size={14}
                      className={`transition ${openGroup === i ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openGroup === i && (

                    <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50">

                      {item.children.map((child, c) => {

                        const ChildIcon = child.icon;

                        return (
                          <button
                            key={c}
                            onClick={() => {
                              navigate(child.path);
                              setOpenGroup(null);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-blue-50
                              ${
                                isActive(child.path)
                                  ? 'text-blue-600 font-semibold'
                                  : 'text-gray-700'
                              }`}
                          >
                            <ChildIcon size={16} />
                            {child.label}
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
          <div className="flex items-center gap-3">

            <div className="hidden md:flex flex-col items-end">

              <span className="text-sm font-medium text-gray-700">
                {currentUser?.email}
              </span>

              <span className="text-xs text-gray-400 capitalize">
                {userRole?.replace('_', ' ')}
              </span>

            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow"
            >
              <LogOut size={16} />
              Logout
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

          </div>

        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (

          <div className="lg:hidden border-t border-gray-200 bg-white">

            <div className="px-4 py-3 border-b">

              <p className="text-sm font-medium text-gray-700">
                {currentUser?.email}
              </p>

              <p className="text-xs text-gray-400 capitalize">
                {userRole?.replace('_', ' ')}
              </p>

            </div>

            <nav className="py-2">

              {navItems.map((item, i) => {

                const Icon = item.icon;

                if (!item.children) {
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                }

                return (
                  <div key={i}>

                    <button
                      onClick={() =>
                        setOpenGroup(openGroup === i ? null : i)
                      }
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        {item.label}
                      </div>

                      <ChevronDown
                        size={16}
                        className={`transition ${openGroup === i ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {openGroup === i && (

                      <div className="bg-gray-50">

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
                              className="w-full flex items-center gap-3 pl-12 pr-4 py-2 text-sm hover:bg-blue-50"
                            >
                              <ChildIcon size={16} />
                              {child.label}
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

    </header>
  );
};
