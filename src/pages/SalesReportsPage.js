import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  CheckCircle, 
  XCircle,
  Clock,
  Users,
  DollarSign,
  Target,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Filter,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import { formatPDFDate } from '../utils/reportGenerator';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export const SalesReportsPage = () => {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const reportRef = useRef();

  const hasAccess = userRole === 'admin' || userRole === 'sales_manager' || userRole === 'team_leader';

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [hasAccess]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch deals
      const dealsSnap = await getDocs(collection(db, 'sales'));
      setDeals(dealsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch teams
      const teamsSnap = await getDocs(collection(db, 'teams'));
      setTeams(teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDeals = () => {
    let filtered = deals;

    // Filter by date range
    filtered = filtered.filter(deal => {
      const dealDate = new Date(deal.date || deal.createdAt?.toDate?.() || new Date());
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return dealDate >= startDate && dealDate <= endDate;
    });

    // Filter by user or team
    if (reportType === 'individual' && selectedUser) {
      filtered = filtered.filter(deal => deal.createdBy === selectedUser);
    } else if (reportType === 'team' && selectedTeam) {
      filtered = filtered.filter(deal => deal.teamId === selectedTeam);
    }

    return filtered;
  };

  const filteredDeals = getFilteredDeals();
  const closedDeals = filteredDeals.filter(d => d.status === 'closed');
  const openDeals = filteredDeals.filter(d => d.status !== 'closed' && d.status !== 'lost');
  const lostDeals = filteredDeals.filter(d => d.status === 'lost');

  const totalDealValue = closedDeals.reduce((sum, d) => sum + (d.price || 0), 0);
  const totalCommission = closedDeals.reduce((sum, d) => sum + ((d.price || 0) * 0.2), 0);
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.price || 0), 0);
  const averageDealSize = closedDeals.length > 0 ? totalDealValue / closedDeals.length : 0;
  const conversionRate = filteredDeals.length > 0 ? (closedDeals.length / filteredDeals.length) * 100 : 0;

  // Calculate monthly data
  const getMonthlyData = () => {
    const monthlyStats = {};
    
    filteredDeals.forEach(deal => {
      const date = new Date(deal.date || deal.createdAt?.toDate?.() || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          closed: 0,
          lost: 0,
          open: 0,
          revenue: 0,
          commission: 0
        };
      }
      
      if (deal.status === 'closed') {
        monthlyStats[monthKey].closed++;
        monthlyStats[monthKey].revenue += deal.price || 0;
        monthlyStats[monthKey].commission += (deal.price || 0) * 0.2;
      } else if (deal.status === 'lost') {
        monthlyStats[monthKey].lost++;
      } else {
        monthlyStats[monthKey].open++;
      }
    });

    return Object.values(monthlyStats)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        monthName: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));
  };

  const monthlyData = getMonthlyData();

  // Calculate sales rep performance
  const getSalesRepPerformance = () => {
    const repStats = {};
    
    filteredDeals.forEach(deal => {
      const repId = deal.createdBy;
      if (!repId) return;
      
      if (!repStats[repId]) {
        const user = users.find(u => u.id === repId);
        repStats[repId] = {
          name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          deals: 0,
          closed: 0,
          revenue: 0,
          commission: 0
        };
      }
      
      repStats[repId].deals++;
      if (deal.status === 'closed') {
        repStats[repId].closed++;
        repStats[repId].revenue += deal.price || 0;
        repStats[repId].commission += (deal.price || 0) * 0.2;
      }
    });

    return Object.values(repStats).sort((a, b) => b.revenue - a.revenue);
  };

  const salesRepPerformance = getSalesRepPerformance();

  // Status distribution
  const statusData = [
    { name: 'Closed', value: closedDeals.length, color: '#10b981' },
    { name: 'Open', value: openDeals.length, color: '#3b82f6' },
    { name: 'Lost', value: lostDeals.length, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Team performance
  const getTeamPerformance = () => {
    const teamStats = {};
    
    filteredDeals.forEach(deal => {
      const teamId = deal.teamId;
      if (!teamId) return;
      
      if (!teamStats[teamId]) {
        const team = teams.find(t => t.id === teamId);
        teamStats[teamId] = {
          name: team?.name || 'Unknown',
          deals: 0,
          revenue: 0,
          closed: 0
        };
      }
      
      teamStats[teamId].deals++;
      if (deal.status === 'closed') {
        teamStats[teamId].closed++;
        teamStats[teamId].revenue += deal.price || 0;
      }
    });

    return Object.values(teamStats).sort((a, b) => b.revenue - a.revenue);
  };

  const teamPerformance = getTeamPerformance();

  const downloadPDF = () => {
    if (!reportRef.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    
    script.onload = () => {
      const reportName = reportType === 'individual' 
        ? `sales-report-${users.find(u => u.id === selectedUser)?.firstName || 'user'}`
        : reportType === 'team'
        ? `team-report-${teams.find(t => t.id === selectedTeam)?.name || 'team'}`
        : 'company-sales-report';

      const opt = {
        margin: [10, 10],
        filename: `${reportName}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };
      
      window.html2pdf().set(opt).from(reportRef.current).save();
    };
    
    document.head.appendChild(script);
  };

  const exportDetailedReport = (type) => {
    setSelectedReport(type);
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      
      script.onload = () => {
        const element = document.getElementById('detailed-sales-report');
        const opt = {
          margin: [10, 10],
          filename: `${type}-sales-report-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        window.html2pdf().set(opt).from(element).save().then(() => {
          setSelectedReport(null);
        });
      };
      
      document.body.appendChild(script);
    }, 100);
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-12 text-center rounded-2xl shadow-lg max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view sales reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading sales data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Sales Reports & Analytics
              </h1>
              <p className="text-gray-500 text-sm">
                Comprehensive insights into your sales performance
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <RefreshCw size={18} />
                <span>Refresh</span>
              </button>

              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                <Download size={18} />
                <span>Export Overview</span>
              </button>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-gray-600" size={20} />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setSelectedUser('');
                  setSelectedTeam('');
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Sales</option>
                <option value="individual">Individual Sales Rep</option>
                <option value="team">By Team</option>
              </select>
            </div>

            {reportType === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Rep
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Sales Reps</option>
                  {users.filter(u => u.role === 'sales_member').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {reportType === 'team' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600 w-full">
                <span className="font-semibold text-gray-900">{filteredDeals.length}</span> deals found
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div ref={reportRef}>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Total Revenue"
              value={totalDealValue}
              icon={DollarSign}
              trend="up"
              color="emerald"
              subtitle={`${closedDeals.length} closed deals`}
            />

            <KPICard
              title="Total Commission"
              value={totalCommission}
              icon={Award}
              trend="up"
              color="purple"
              subtitle="20% of revenue"
            />

            <KPICard
              title="Pipeline Value"
              value={pipelineValue}
              icon={Target}
              trend="neutral"
              color="blue"
              subtitle={`${openDeals.length} open deals`}
            />

            <KPICard
              title="Conversion Rate"
              value={`${conversionRate.toFixed(1)}%`}
              icon={TrendingUp}
              trend={conversionRate > 50 ? 'up' : 'down'}
              color="orange"
              subtitle={`${closedDeals.length}/${filteredDeals.length} deals`}
              isPercentage
            />
          </div>

          {/* SECONDARY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Avg Deal Size"
              value={formatCurrency(averageDealSize)}
              icon={DollarSign}
              color="blue"
            />

            <MetricCard
              label="Win/Loss Ratio"
              value={lostDeals.length > 0 ? `${(closedDeals.length / lostDeals.length).toFixed(2)}:1` : `${closedDeals.length}:0`}
              icon={Target}
              color="green"
            />

            <MetricCard
              label="Active Deals"
              value={openDeals.length}
              icon={Clock}
              color="purple"
            />

            <MetricCard
              label="Lost Deals"
              value={lostDeals.length}
              icon={XCircle}
              color="red"
            />
          </div>

          {/* CHARTS ROW 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* MONTHLY REVENUE TREND */}
            <ChartCard title="Monthly Revenue Trend" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="monthName" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="#8b5cf6"
                    fill="url(#commissionGradient)"
                    strokeWidth={2}
                    name="Commission"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* DEALS BY STATUS */}
            <ChartCard title="Deals Distribution" icon={PieChartIcon}>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  No deals data available
                </div>
              )}
            </ChartCard>

          </div>

          {/* CHARTS ROW 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* MONTHLY DEALS COUNT */}
            <ChartCard title="Monthly Deals Performance" icon={BarChart3}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="monthName"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="closed" fill="#10b981" name="Closed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="lost" fill="#ef4444" name="Lost" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="open" fill="#3b82f6" name="Open" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* TOP SALES REPS */}
            <ChartCard title="Top Sales Representatives" icon={Users}>
              {salesRepPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesRepPerformance.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      width={120}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  No sales rep data available
                </div>
              )}
            </ChartCard>

          </div>

          {/* PERFORMANCE TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* SALES REP LEADERBOARD */}
            {salesRepPerformance.length > 0 && (
              <Section title="Sales Rep Leaderboard" icon={Award}>
                <div className="space-y-2">
                  {salesRepPerformance.slice(0, 10).map((rep, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                          idx === 1 ? 'bg-gray-100 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{rep.name}</p>
                          <p className="text-xs text-gray-500">{rep.closed} closed / {rep.deals} total deals</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(rep.revenue)}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(rep.commission)} commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* TEAM PERFORMANCE */}
            {teamPerformance.length > 0 && (
              <Section title="Team Performance" icon={Users}>
                <div className="space-y-2">
                  {teamPerformance.map((team, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{team.name}</p>
                        <p className="text-xs text-gray-500">{team.closed} closed / {team.deals} total deals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{formatCurrency(team.revenue)}</p>
                        <p className="text-xs text-gray-500">
                          {team.deals > 0 ? ((team.closed / team.deals) * 100).toFixed(1) : 0}% win rate
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>

          {/* DETAILED REPORTS */}
          <div className="mb-6">
            <Section title="Detailed Reports" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReportButton
                  title="Complete Deal Ledger"
                  description="All deals with full details"
                  onClick={() => exportDetailedReport('deal-ledger')}
                />

                <ReportButton
                  title="Performance Analysis"
                  description="Rep & team metrics breakdown"
                  onClick={() => exportDetailedReport('performance')}
                />

                <ReportButton
                  title="Monthly Summary"
                  description="Period-over-period comparison"
                  onClick={() => exportDetailedReport('monthly')}
                />
              </div>
            </Section>
          </div>

          {/* DEALS BREAKDOWN */}
          <Section title="Deals Summary" icon={CheckCircle}>
            <div className="space-y-6">

              {/* CLOSED DEALS */}
              {closedDeals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-700 flex items-center gap-2">
                      <CheckCircle size={18} />
                      Closed Deals ({closedDeals.length})
                    </h4>
                    <p className="text-sm font-semibold text-green-700">
                      Total: {formatCurrency(totalDealValue)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {closedDeals.slice(0, 10).map((deal) => (
                      <DealCard key={deal.id} deal={deal} status="closed" users={users} />
                    ))}
                    {closedDeals.length > 10 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        ... and {closedDeals.length - 10} more closed deals
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* OPEN DEALS */}
              {openDeals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                      <Clock size={18} />
                      Open Deals ({openDeals.length})
                    </h4>
                    <p className="text-sm font-semibold text-blue-700">
                      Pipeline: {formatCurrency(pipelineValue)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {openDeals.slice(0, 10).map((deal) => (
                      <DealCard key={deal.id} deal={deal} status="open" users={users} />
                    ))}
                    {openDeals.length > 10 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        ... and {openDeals.length - 10} more open deals
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* LOST DEALS */}
              {lostDeals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-red-700 flex items-center gap-2">
                      <XCircle size={18} />
                      Lost Deals ({lostDeals.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {lostDeals.slice(0, 10).map((deal) => (
                      <DealCard key={deal.id} deal={deal} status="lost" users={users} />
                    ))}
                    {lostDeals.length > 10 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        ... and {lostDeals.length - 10} more lost deals
                      </p>
                    )}
                  </div>
                </div>
              )}

              {filteredDeals.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No deals found for the selected filters</p>
                </div>
              )}

            </div>
          </Section>

        </div>

      </div>

      {/* DETAILED REPORT MODAL */}
      {selectedReport && (
        <DetailedReportModal
          reportType={selectedReport}
          deals={filteredDeals}
          closedDeals={closedDeals}
          openDeals={openDeals}
          lostDeals={lostDeals}
          monthlyData={monthlyData}
          salesRepPerformance={salesRepPerformance}
          teamPerformance={teamPerformance}
          totalDealValue={totalDealValue}
          totalCommission={totalCommission}
          pipelineValue={pipelineValue}
          conversionRate={conversionRate}
          users={users}
          dateRange={dateRange}
          onClose={() => setSelectedReport(null)}
        />
      )}

    </div>
  );
};


/* ===============================
   UI COMPONENTS
================================ */

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color, isPercentage }) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  const trendIcons = {
    up: <TrendingUp className="text-green-500" size={20} />,
    down: <TrendingDown className="text-red-500" size={20} />,
    neutral: null
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {trendIcons[trend]}
      </div>
      
      <h3 className="text-gray-600 text-sm font-medium mb-1">
        {title}
      </h3>
      
      <p className="text-3xl font-bold text-gray-900 mb-1">
        {isPercentage ? value : typeof value === 'string' ? value : formatCurrency(value)}
      </p>

      {subtitle && (
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-6">
      <Icon className="text-gray-600" size={20} />
      <h2 className="font-bold text-lg text-gray-900">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-6">
      {Icon && <Icon className="text-gray-600" size={20} />}
      <h2 className="font-bold text-lg text-gray-900">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const DealCard = ({ deal, status, users }) => {
  const statusColors = {
    closed: 'bg-green-50 border-green-200',
    open: 'bg-blue-50 border-blue-200',
    lost: 'bg-red-50 border-red-200'
  };

  const textColors = {
    closed: 'text-green-700',
    open: 'text-blue-700',
    lost: 'text-red-700'
  };

  const creator = users.find(u => u.id === deal.createdBy);
  const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown';

  return (
    <div className={`p-4 rounded-xl border ${statusColors[status]} hover:shadow-sm transition-shadow`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{deal.businessName}</p>
          <p className="text-sm text-gray-600">{deal.contactPerson}</p>
          <p className="text-xs text-gray-500 mt-1">
            Sales Rep: {creatorName} • {formatPDFDate(deal.date)}
          </p>
        </div>
        <div className="text-right">
          {status === 'closed' ? (
            <>
              <p className={`font-bold text-lg ${textColors[status]}`}>
                {formatCurrency(deal.price || 0)}
              </p>
              <p className="text-xs text-gray-600">
                Commission: {formatCurrency((deal.price || 0) * 0.2)}
              </p>
            </>
          ) : status === 'open' ? (
            <>
              <p className={`font-semibold ${textColors[status]}`}>
                {formatCurrency(deal.price || 0)}
              </p>
              <p className="text-xs text-gray-600 capitalize">
                {deal.status}
              </p>
            </>
          ) : (
            <p className={`text-sm font-medium ${textColors[status]}`}>
              Lost
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const ReportButton = ({ title, description, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all text-left group"
  >
    <div className="flex items-start justify-between mb-2">
      <FileText className="text-gray-400 group-hover:text-blue-600 transition-colors" size={24} />
      <Download className="text-gray-300 group-hover:text-blue-500 transition-colors" size={18} />
    </div>
    <h3 className="font-semibold text-gray-900 mb-1">
      {title}
    </h3>
    <p className="text-sm text-gray-600">
      {description}
    </p>
  </button>
);

const DetailedReportModal = ({
  reportType,
  deals,
  closedDeals,
  openDeals,
  lostDeals,
  monthlyData,
  salesRepPerformance,
  teamPerformance,
  totalDealValue,
  totalCommission,
  pipelineValue,
  conversionRate,
  users,
  dateRange,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Generating {reportType} report...
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          
          <div id="detailed-sales-report" className="space-y-6 bg-white p-8">
            
            {/* Report Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {reportType === 'deal-ledger' ? 'Complete Deal Ledger' :
                 reportType === 'performance' ? 'Sales Performance Analysis' :
                 'Monthly Sales Summary'}
              </h1>
              <p className="text-gray-600">
                Period: {formatPDFDate(dateRange.start)} to {formatPDFDate(dateRange.end)}
              </p>
              <p className="text-sm text-gray-500">
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDealValue)}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Commission</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCommission)}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pipeline Value</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(pipelineValue)}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-600">{conversionRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Report Content */}
            {reportType === 'deal-ledger' && (
              <div>
                <h3 className="text-xl font-bold mb-4">All Deals</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Business</th>
                      <th className="text-left py-2">Contact</th>
                      <th className="text-left py-2">Sales Rep</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-right py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map(deal => {
                      const creator = users.find(u => u.id === deal.createdBy);
                      const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown';
                      return (
                        <tr key={deal.id} className="border-b border-gray-200">
                          <td className="py-2">{formatPDFDate(deal.date)}</td>
                          <td className="py-2">{deal.businessName}</td>
                          <td className="py-2">{deal.contactPerson}</td>
                          <td className="py-2">{creatorName}</td>
                          <td className="py-2 capitalize">{deal.status}</td>
                          <td className="py-2 text-right font-semibold">
                            {formatCurrency(deal.price || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'performance' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Sales Representative Performance</h3>
                <table className="w-full text-sm border-collapse mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Rank</th>
                      <th className="text-left py-2">Sales Rep</th>
                      <th className="text-right py-2">Deals</th>
                      <th className="text-right py-2">Closed</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Commission</th>
                      <th className="text-right py-2">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRepPerformance.map((rep, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-2">{idx + 1}</td>
                        <td className="py-2">{rep.name}</td>
                        <td className="py-2 text-right">{rep.deals}</td>
                        <td className="py-2 text-right">{rep.closed}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(rep.revenue)}</td>
                        <td className="py-2 text-right">{formatCurrency(rep.commission)}</td>
                        <td className="py-2 text-right">
                          {rep.deals > 0 ? ((rep.closed / rep.deals) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {teamPerformance.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold mb-4 mt-8">Team Performance</h3>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-2">Team</th>
                          <th className="text-right py-2">Total Deals</th>
                          <th className="text-right py-2">Closed</th>
                          <th className="text-right py-2">Revenue</th>
                          <th className="text-right py-2">Win Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamPerformance.map((team, idx) => (
                          <tr key={idx} className="border-b border-gray-200">
                            <td className="py-2">{team.name}</td>
                            <td className="py-2 text-right">{team.deals}</td>
                            <td className="py-2 text-right">{team.closed}</td>
                            <td className="py-2 text-right font-semibold">{formatCurrency(team.revenue)}</td>
                            <td className="py-2 text-right">
                              {team.deals > 0 ? ((team.closed / team.deals) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            {reportType === 'monthly' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Monthly Performance Summary</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Month</th>
                      <th className="text-right py-2">Closed</th>
                      <th className="text-right py-2">Lost</th>
                      <th className="text-right py-2">Open</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Commission</th>
                      <th className="text-right py-2">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map(month => (
                      <tr key={month.month} className="border-b border-gray-200">
                        <td className="py-2">{month.monthName}</td>
                        <td className="py-2 text-right text-green-600 font-semibold">{month.closed}</td>
                        <td className="py-2 text-right text-red-600">{month.lost}</td>
                        <td className="py-2 text-right text-blue-600">{month.open}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(month.revenue)}</td>
                        <td className="py-2 text-right">{formatCurrency(month.commission)}</td>
                        <td className="py-2 text-right">
                          {(month.closed + month.lost) > 0 
                            ? ((month.closed / (month.closed + month.lost)) * 100).toFixed(1) 
                            : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};