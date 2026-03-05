import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { NotificationsPanel } from './NotificationsPanel';
import {
  AlertCircle,
  BarChart2,
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Database,
  DollarSign,
  FileText,
  Heart,
  History,
  Info,
  LayoutDashboard,
  LifeBuoy,
  Link as LinkIcon,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Sun,
  TrendingUp,
  Trophy,
  Users,
  Users2,
  Zap,
  Calculator,
  Image as ImageIcon
} from 'lucide-react';

const DAILY_QUOTES = [
  'Every follow-up is a revenue opportunity.',
  'Pipeline discipline today creates closed deals tomorrow.',
  'The best reps don’t wait for perfect, they move the deal forward.',
  'A clear next step beats a long meeting.',
  'Consistent outreach wins more than occasional intensity.',
  'Great discovery questions create faster closes.',
  'Strong CRM hygiene is a sales superpower.',
  'Speed to response builds trust and conversion.',
  'When value is clear, objections get smaller.',
  'The deal you save is often better than the deal you chase.',
  'Execution closes. Ideas only support execution.',
  'Review the pipeline daily, not monthly.',
  'Most stalls are solved by better next actions.',
  'High-performing teams make priorities visible.',
  'Forecast quality improves when stage discipline improves.',
  'Small improvements in conversion compound fast.',
  'Prepare before every client call, win after every call.',
  'If it is not tracked, it is not managed.',
  'Momentum grows when decisions are made quickly.',
  'Close with confidence by leading with outcomes.'
];

const dashboardItem = { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard };
const calculatorItem = { label: 'Calculator', path: '/sales/ai-helper', icon: Calculator };
const informationItem = { label: 'Overview', path: '/description', icon: Info };
const emailTemplatesItem = { label: 'Email Templates', path: '/email-templates', icon: Mail };
const helpCenterItem = { label: 'Help Center', path: '/help', icon: LifeBuoy };
const playbooksItem = { label: 'Playbooks', path: '/admin/playbooks', icon: ClipboardList };
const revenueIntelligenceItem = {
  label: 'Revenue Intelligence',
  path: '/forecasting',
  icon: TrendingUp
};

const digitalMarketingGroup = {
  label: 'Digital Marketing',
  icon: Zap,
  children: [
    { label: 'Client Profiles', path: '/marketing/profiles', icon: Users },
    { label: 'Campaigns', path: '/marketing/campaigns', icon: FileText },
    { label: 'Creatives', path: '/marketing/creatives', icon: ImageIcon },
    { label: 'Analytics', path: '/marketing/analytics', icon: BarChart3 },
    { label: 'Leads', path: '/marketing/leads', icon: Users2 },
    { label: 'Content Calendar', path: '/digital-marketing/content-calendar', icon: Calendar },
    { label: 'Asset Library', path: '/digital-marketing/asset-library', icon: Database },
    { label: 'Reporting', path: '/digital-marketing/reporting', icon: Mail },
    { label: 'UTM Builder', path: '/digital-marketing/utm-builder', icon: LinkIcon }
  ]
};

const infoGroup = {
  label: 'Info',
  icon: Info,
  children: [informationItem, helpCenterItem]
};

const TIMEZONE_COORDINATE_FALLBACKS = {
  'Africa/Cairo': { latitude: 30.0444, longitude: 31.2357, city: 'Cairo' },
  'America/New_York': { latitude: 40.7128, longitude: -74.006, city: 'New York' },
  'America/Chicago': { latitude: 41.8781, longitude: -87.6298, city: 'Chicago' },
  'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles' },
  'Europe/London': { latitude: 51.5072, longitude: -0.1276, city: 'London' },
  UTC: { latitude: 40.7128, longitude: -74.006, city: 'New York' }
};

const ROLE_NAV_ITEMS = {
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
        revenueIntelligenceItem,
        playbooksItem,
        { label: 'SLA Dashboard', path: '/admin/sla', icon: AlertCircle },
        { label: 'Teams', path: '/sales/teams', icon: Users2 },
        { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
      ]
    },
    digitalMarketingGroup,
    { label: 'Pipeline', path: '/admin/pipeline', icon: TrendingUp },
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
        { label: 'Pipeline', path: '/admin/pipeline', icon: TrendingUp },
        { label: 'SLA Dashboard', path: '/admin/sla', icon: AlertCircle },
        { label: 'Audit Log', path: '/admin/audit-log', icon: History },
        { label: 'Data Import/Export', path: '/admin/data', icon: Database },
        { label: 'Analytics', path: '/analytics', icon: BarChart2 },
        { label: 'Revenue Intelligence', path: '/forecasting', icon: TrendingUp },
        { label: 'Calendar', path: '/calendar', icon: Calendar }
      ]
    },
    emailTemplatesItem,
    infoGroup
  ],
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
    digitalMarketingGroup,
    emailTemplatesItem,
    infoGroup
  ],
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
        revenueIntelligenceItem,
        playbooksItem,
        { label: 'SLA Dashboard', path: '/admin/sla', icon: AlertCircle },
        { label: 'Teams', path: '/sales/teams', icon: Users2 },
        { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
      ]
    },
    digitalMarketingGroup,
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
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    emailTemplatesItem,
    infoGroup
  ],
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
        revenueIntelligenceItem,
        playbooksItem,
        { label: 'SLA Dashboard', path: '/admin/sla', icon: AlertCircle },
        { label: 'Teams', path: '/sales/teams', icon: Users2 },
        { label: 'Achievements', path: '/sales/achievements', icon: Trophy }
      ]
    },
    { label: 'Commissions', path: '/my/commissions', icon: DollarSign },
    {
      label: 'Tasks',
      icon: CheckSquare,
      children: [
        { label: 'Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Performance', path: '/admin/performance', icon: TrendingUp }
      ]
    },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    emailTemplatesItem,
    infoGroup
  ],
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
        { label: 'Follow-Ups', path: '/sales/followups', icon: Bell },
        playbooksItem
      ]
    },
    { label: 'Commissions', path: '/my/commissions', icon: DollarSign },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    emailTemplatesItem,
    infoGroup
  ]
};

const getWeatherMeta = (code) => {
  if (code === 0) return { label: 'Clear', icon: Sun };
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: Cloud };
  if (code >= 45 && code <= 48) return { label: 'Fog', icon: Cloud };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Rain', icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: CloudSnow };
  if (code >= 95) return { label: 'Storm', icon: CloudLightning };
  return { label: 'Weather', icon: Cloud };
};

const getActiveLabel = (items, pathname) => {
  for (const item of items) {
    if (item.children) {
      const found = getActiveLabel(item.children, pathname);
      if (found) return found;
      continue;
    }
    if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
      return item.label;
    }
  }
  return 'Workspace';
};

const getTimezoneCoordinates = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return TIMEZONE_COORDINATE_FALLBACKS[timezone] || TIMEZONE_COORDINATE_FALLBACKS.UTC;
};

const getIpCoordinates = async () => {
  try {
    const ipapiResponse = await fetch('https://ipapi.co/json/');
    const ipapiData = await ipapiResponse.json();
    if (typeof ipapiData?.latitude === 'number' && typeof ipapiData?.longitude === 'number') {
      return {
        latitude: ipapiData.latitude,
        longitude: ipapiData.longitude,
        city: ipapiData.city || ipapiData.region || 'Current Location'
      };
    }
  } catch {}

  try {
    const ipwhoResponse = await fetch('https://ipwho.is/');
    const ipwhoData = await ipwhoResponse.json();
    if (ipwhoData?.success && typeof ipwhoData?.latitude === 'number' && typeof ipwhoData?.longitude === 'number') {
      return {
        latitude: ipwhoData.latitude,
        longitude: ipwhoData.longitude,
        city: ipwhoData.city || ipwhoData.region || 'Current Location'
      };
    }
  } catch {}

  return null;
};

const DesktopApp = ({ children }) => {
  const { currentUser, logout, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [now, setNow] = useState(new Date());
  const [weatherLocation, setWeatherLocation] = useState(null);
  const [weather, setWeather] = useState({
    loading: true,
    temperature: null,
    weatherCode: null,
    source: 'Loading',
    city: '--'
  });

  const navItems = useMemo(() => ROLE_NAV_ITEMS[userRole] || [], [userRole]);
  const dailyQuote = DAILY_QUOTES[0];
  const activePageLabel = useMemo(() => getActiveLabel(navItems, location.pathname), [navItems, location.pathname]);
  const weatherMeta = useMemo(() => getWeatherMeta(weather.weatherCode), [weather.weatherCode]);
  const WeatherIcon = weatherMeta.icon;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      navItems.forEach((item) => {
        if (item.children && typeof next[item.label] === 'undefined') {
          next[item.label] = true;
        }
      });
      return next;
    });
  }, [navItems]);

  useEffect(() => {
    let cancelled = false;

    const resolveLocation = async () => {
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              maximumAge: 15 * 60 * 1000
            });
          });
          if (cancelled) return;
          setWeatherLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: 'Current Location',
            source: 'GPS'
          });
          return;
        } catch {}
      }

      const ipLocation = await getIpCoordinates();
      if (cancelled) return;
      if (ipLocation) {
        setWeatherLocation({ ...ipLocation, source: 'IP' });
        return;
      }

      const timezoneLocation = getTimezoneCoordinates();
      setWeatherLocation({ ...timezoneLocation, source: 'Timezone' });
    };

    resolveLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!weatherLocation) return undefined;

    let cancelled = false;
    const loadWeather = async () => {
      try {
        setWeather(prev => ({ ...prev, loading: true }));
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${weatherLocation.latitude}&longitude=${weatherLocation.longitude}&current=temperature_2m,weather_code&timezone=auto`;
        const response = await fetch(url);
        const data = await response.json();
        if (cancelled) return;
        setWeather({
          loading: false,
          temperature: Math.round(data?.current?.temperature_2m ?? 0),
          weatherCode: data?.current?.weather_code ?? null,
          source: weatherLocation.source,
          city: weatherLocation.city || '--'
        });
      } catch {
        if (cancelled) return;
        setWeather({
          loading: false,
          temperature: null,
          weatherCode: null,
          source: weatherLocation.source,
          city: weatherLocation.city || '--'
        });
      }
    };

    loadWeather();
    const interval = setInterval(loadWeather, 20 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [weatherLocation]);

  const filteredNavItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return navItems;

    return navItems
      .map((item) => {
        if (item.children) {
          const children = item.children.filter((child) => child.label.toLowerCase().includes(query));
          if (children.length > 0 || item.label.toLowerCase().includes(query)) {
            return { ...item, children };
          }
          return null;
        }
        return item.label.toLowerCase().includes(query) ? item : null;
      })
      .filter(Boolean);
  }, [navItems, search]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isGroupActive = (item) => item.children?.some((child) => isActive(child.path));

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (location.pathname === '/login') {
    return children;
  }

  if (!currentUser && !loading) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 text-slate-700">
        <div className="rounded-2xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
          <p className="text-sm text-slate-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-shell flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,#d1fae5_0%,#ffffff_35%,#f8fafc_100%)] text-slate-800">
      <aside className={`relative flex h-full flex-col border-r border-slate-200 bg-white/95 shadow-[0_0_0_1px_rgba(15,23,42,0.02),0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-300 ${collapsed ? 'w-20' : 'w-[18.75rem]'}`}>
        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"></div>
        <div className="desktop-sidebar-header border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-black shadow-md">
                J
              </div>
              {!collapsed && (
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-slate-900">J-SYSTEM Desktop</p>
                  <p className="truncate text-xs text-slate-500">Professional Workspace</p>
                </div>
              )}
            </button>
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
          {!collapsed && (
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pages..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;

              if (!item.children) {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`sidebar-item group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              }

              const expanded = expandedGroups[item.label];
              const groupActive = isGroupActive(item);

              return (
                <div key={item.label} className="rounded-xl border border-transparent bg-transparent">
                  <button
                    onClick={() => setExpandedGroups((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                    className={`sidebar-item flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                      groupActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                  </button>

                  {!collapsed && expanded && (
                    <div className="mt-1 space-y-1 pl-4">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.path);
                        return (
                          <button
                            key={child.path}
                            onClick={() => handleNavigate(child.path)}
                            className={`sidebar-item flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                              childActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                          >
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 px-3 py-3">
          <button
            onClick={() => handleNavigate('/settings')}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            title={collapsed ? 'Settings' : ''}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="desktop-main-header border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Workspace</p>
              </div>
              <h1 className="truncate text-xl font-semibold leading-tight text-slate-900">{activePageLabel}</h1>
              <p className="mt-0.5 text-xs text-slate-400 capitalize">
                {userRole?.replace('_', ' ')} account
              </p>
              <div className="mt-1.5 inline-flex max-w-3xl items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Daily Quote</span>
                <span className="truncate text-[11px] font-medium text-slate-700">{dailyQuote}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="animate-pulse-soft rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right shadow-sm">
                <p className="text-[10px] text-slate-500">{now.toLocaleDateString()}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <WeatherIcon className="h-3.5 w-3.5 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-slate-500">{weather.city}</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {weather.loading ? 'Loading...' : weather.temperature !== null ? `${weather.temperature}°C` : '--'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <NotificationsPanel />
              </div>
              <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm lg:block">
                <p className="text-[10px] text-slate-500">Signed in as</p>
                <p className="max-w-[180px] truncate text-xs font-semibold text-slate-900">{currentUser?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {children}
          </div>
        </main>
      </section>
      <style>{`
        .desktop-shell {
          --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
        }

        .desktop-shell .max-w-7xl,
        .desktop-shell .max-w-6xl,
        .desktop-shell .max-w-5xl,
        .desktop-shell .max-w-4xl {
          max-width: 100% !important;
        }

        .desktop-shell .mx-auto {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .desktop-shell .desktop-sidebar-header,
        .desktop-shell .desktop-main-header {
          min-height: 8.5rem;
        }

        .desktop-shell main .min-h-screen {
          min-height: auto !important;
        }

        .desktop-shell button,
        .desktop-shell a {
          transition: background-color 220ms var(--ease-out), color 220ms var(--ease-out), border-color 220ms var(--ease-out), box-shadow 220ms var(--ease-out), transform 220ms var(--ease-out);
        }

        .sidebar-item {
          transition: transform 220ms var(--ease-out), background-color 220ms var(--ease-out), color 220ms var(--ease-out);
        }

        .sidebar-item:hover {
          transform: translateX(3px);
        }

        .desktop-shell [class*="rounded-2xl"],
        .desktop-shell [class*="rounded-xl"] {
          transform: translateZ(0);
        }

        .animate-fade-up {
          animation: fadeUp 480ms var(--ease-out) both;
        }

        .animate-pulse-soft {
          animation: pulseSoft 3.6s ease-in-out infinite;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseSoft {
          0%, 100% {
            box-shadow: 0 0 0 rgba(16, 185, 129, 0);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
          }
        }
      `}</style>
    </div>
  );
};

export default DesktopApp;
