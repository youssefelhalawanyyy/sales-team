import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  BarChart3,
  ShoppingCart,
  MessageSquare,
  UserCheck,
  DollarSign,
  Briefcase,
  MapPin,
  Activity
} from 'lucide-react';

const MENU_ITEMS = [
  {
    category: 'Dashboard',
    items: [
      { label: 'Overview', icon: Home, path: '/dashboard' },
      { label: 'Analytics', icon: BarChart3, path: '/analytics' }
    ]
  },
  {
    category: 'Sales',
    items: [
      { label: 'Deals', icon: ShoppingCart, path: '/sales' },
      { label: 'Contacts', icon: Users, path: '/contacts' },
      { label: 'Reports', icon: FileText, path: '/reports' }
    ]
  },
  {
    category: 'CRM',
    items: [
      { label: 'Activities', icon: Activity, path: '/activities' },
      { label: 'Tasks', icon: Briefcase, path: '/tasks' },
      { label: 'Messages', icon: MessageSquare, path: '/messages' },
      { label: 'Visits', icon: MapPin, path: '/visits' }
    ]
  },
  {
    category: 'Finance',
    items: [
      { label: 'Financial', icon: DollarSign, path: '/finance' },
      { label: 'Commissions', icon: TrendingUp, path: '/commissions' }
    ]
  },
  {
    category: 'Team',
    items: [
      { label: 'Team Management', icon: UserCheck, path: '/team' },
      { label: 'Calendar', icon: Calendar, path: '/calendar' }
    ]
  }
];

export default function DesktopSidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(MENU_ITEMS.map((cat, idx) => [idx, true]))
  );

  const toggleCategory = (idx) => {
    setExpandedCategories(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className="fixed left-0 top-12 bottom-0 w-64 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 overflow-y-auto overflow-x-hidden pt-4">
      {/* User Profile Section */}
      <div className="px-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-100 truncate">User</p>
              <p className="text-xs text-gray-400 truncate">Sales Manager</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Categories */}
      <nav className="space-y-1 px-2">
        {MENU_ITEMS.map((category, catIdx) => (
          <div key={catIdx}>
            <button
              onClick={() => toggleCategory(catIdx)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors group"
            >
              <span>{category.category}</span>
              {expandedCategories[catIdx] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {expandedCategories[catIdx] && (
              <div className="space-y-1 mb-4">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-950 p-3 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-all">
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Settings</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-900/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Logout</span>
        </button>
      </div>
    </aside>
  );
}
