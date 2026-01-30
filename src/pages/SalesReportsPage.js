import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Sparkles
} from 'lucide-react';
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
  AreaChart
} from 'recharts';

// Mock data for demonstration - replace with your actual Firebase data
const mockDeals = [
  { id: '1', businessName: 'Tech Corp', contactPerson: 'John Doe', createdBy: 'user1', teamId: 'team1', status: 'closed', price: 50000, date: '2025-01-15', createdAt: new Date('2025-01-15') },
  { id: '2', businessName: 'Design Studio', contactPerson: 'Jane Smith', createdBy: 'user2', teamId: 'team1', status: 'closed', price: 35000, date: '2025-01-20', createdAt: new Date('2025-01-20') },
  { id: '3', businessName: 'Marketing Inc', contactPerson: 'Bob Johnson', createdBy: 'user1', teamId: 'team2', status: 'open', price: 42000, date: '2025-01-25', createdAt: new Date('2025-01-25') },
  { id: '4', businessName: 'Retail Plus', contactPerson: 'Alice Brown', createdBy: 'user3', teamId: 'team2', status: 'lost', price: 28000, date: '2025-01-10', createdAt: new Date('2025-01-10') },
  { id: '5', businessName: 'Finance Pro', contactPerson: 'Charlie Wilson', createdBy: 'user2', teamId: 'team1', status: 'closed', price: 65000, date: '2024-12-20', createdAt: new Date('2024-12-20') },
];

const mockUsers = [
  { id: 'user1', firstName: 'Michael', lastName: 'Chen', role: 'sales_member' },
  { id: 'user2', firstName: 'Sarah', lastName: 'Williams', role: 'sales_member' },
  { id: 'user3', firstName: 'David', lastName: 'Martinez', role: 'sales_member' },
];

const mockTeams = [
  { id: 'team1', name: 'Enterprise Sales' },
  { id: 'team2', name: 'SMB Sales' },
];

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPDFDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const SalesReportsPage = () => {
  // Replace with your actual auth context
  const currentUser = { uid: 'current-user' };
  const userRole = 'admin'; // or 'sales_manager' or 'team_leader'
  
  const [deals, setDeals] = useState(mockDeals);
  const [users, setUsers] = useState(mockUsers);
  const [teams, setTeams] = useState(mockTeams);
  const [loading, setLoading] = useState(false);
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

  // Replace this with your actual Firebase fetch
  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setDeals(mockDeals);
      setUsers(mockUsers);
      setTeams(mockTeams);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [hasAccess]);

  const getFilteredDeals = () => {
    let filtered = deals;

    // Filter by date range
    filtered = filtered.filter(deal => {
      const dealDate = new Date(deal.date || deal.createdAt || new Date());
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
      const date = new Date(deal.date || deal.createdAt || new Date());
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
    alert('PDF export would be triggered here. Install html2pdf.js library for full functionality.');
  };

  const exportDetailedReport = (type) => {
    alert(`${type} report export would be triggered here.`);
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="bg-white p-12 text-center rounded-3xl shadow-2xl max-w-md transform hover:scale-105 transition-transform">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-600" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 text-lg">You don't have permission to view sales reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="relative">
          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-6" />
          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" size={32} />
        </div>
        <p className="text-white font-semibold text-xl">Loading sales data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Outfit', sans-serif;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="glass-effect p-8 rounded-3xl shadow-xl animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Sales Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Real-time insights into your sales performance
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl font-semibold transition-all shadow-md hover-lift border-2 border-gray-200"
              >
                <RefreshCw size={20} />
                <span>Refresh</span>
              </button>

              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-2xl font-semibold transition-all shadow-lg hover-lift"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <Download size={20} />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="glass-effect p-6 rounded-3xl shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Filter className="text-white" size={20} />
            </div>
            <h3 className="font-bold text-xl text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setSelectedUser('');
                  setSelectedTeam('');
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
              >
                <option value="all">All Sales</option>
                <option value="individual">Individual Sales Rep</option>
                <option value="team">By Team</option>
              </select>
            </div>

            {reportType === 'individual' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sales Rep
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
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
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
              />
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600 w-full px-4 py-3 bg-purple-50 rounded-xl border-2 border-purple-200">
                <span className="font-bold text-purple-700 text-lg">{filteredDeals.length}</span> deals found
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div ref={reportRef}>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <KPICard
              title="Total Revenue"
              value={totalDealValue}
              icon={DollarSign}
              trend="up"
              color="emerald"
              subtitle={`${closedDeals.length} closed deals`}
              delay="0.2s"
            />

            <KPICard
              title="Total Commission"
              value={totalCommission}
              icon={Award}
              trend="up"
              color="purple"
              subtitle="20% of revenue"
              delay="0.3s"
            />

            <KPICard
              title="Pipeline Value"
              value={pipelineValue}
              icon={Target}
              trend="neutral"
              color="blue"
              subtitle={`${openDeals.length} open deals`}
              delay="0.4s"
            />

            <KPICard
              title="Conversion Rate"
              value={`${conversionRate.toFixed(1)}%`}
              icon={TrendingUp}
              trend={conversionRate > 50 ? 'up' : 'down'}
              color="orange"
              subtitle={`${closedDeals.length}/${filteredDeals.length} deals`}
              isPercentage
              delay="0.5s"
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
                      borderRadius: '12px',
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
                    strokeWidth={3}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="#8b5cf6"
                    fill="url(#commissionGradient)"
                    strokeWidth={3}
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
                      borderRadius: '12px',
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
                    <Bar dataKey="revenue" fill="#667eea" radius={[0, 8, 8, 0]} />
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
                <div className="space-y-3">
                  {salesRepPerformance.slice(0, 10).map((rep, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl hover:shadow-lg transition-all border-2 border-gray-100 hover-lift">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-md ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                          'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{rep.name}</p>
                          <p className="text-sm text-gray-500">{rep.closed} closed / {rep.deals} total deals</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-xl">{formatCurrency(rep.revenue)}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(rep.commission)} commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* TEAM PERFORMANCE */}
            {teamPerformance.length > 0 && (
              <Section title="Team Performance" icon={Users}>
                <div className="space-y-3">
                  {teamPerformance.map((team, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl hover:shadow-lg transition-all border-2 border-purple-100 hover-lift">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{team.name}</p>
                        <p className="text-sm text-gray-500">{team.closed} closed / {team.deals} total deals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600 text-xl">{formatCurrency(team.revenue)}</p>
                        <p className="text-sm text-gray-500">
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
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-green-700 flex items-center gap-2 text-lg">
                      <CheckCircle size={22} />
                      Closed Deals ({closedDeals.length})
                    </h4>
                    <p className="text-base font-bold text-green-700">
                      Total: {formatCurrency(totalDealValue)}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {closedDeals.slice(0, 10).map((deal) => (
                      <DealCard key={deal.id} deal={deal} status="closed" users={users} />
                    ))}
                    {closedDeals.length > 10 && (
                      <p className="text-sm text-gray-500 text-center py-3 font-medium">
                        ... and {closedDeals.length - 10} more closed deals
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* OPEN DEALS */}
              {openDeals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-blue-700 flex items-center gap-2 text-lg">
                      <Clock size={22} />
                      Open Deals ({openDeals.length})
                    </h4>
                    <p className="text-base font-bold text-blue-700">
                      Pipeline: {formatCurrency(pipelineValue)}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {openDeals.slice(0, 10).map((deal) => (
                      <DealCard key={deal.id} deal={deal} status="open" users={users} />
                    ))}
                    {openDeals.length > 10 && (
                      <p className="text-sm text-gray-500 text-center py-3 font-medium">
                        ... and {openDeals.length - 10} more open deals
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* LOST DEALS */}
              {lostDeals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-red-700 flex items-center gap-2 text-lg">
                      <XCircle size={22} />
                      Lost Deals ({lostDeals.length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {lostDeals.slice(0, 10).map((deal) => (
                      <DealCard key={deal.id} deal={deal} status="lost" users={users} />
                    ))}
                    {lostDeals.length > 10 && (
                      <p className="text-sm text-gray-500 text-center py-3 font-medium">
                        ... and {lostDeals.length - 10} more lost deals
                      </p>
                    )}
                  </div>
                </div>
              )}

              {filteredDeals.length === 0 && (
                <div className="text-center py-16">
                  <AlertCircle className="mx-auto text-gray-400 mb-4" size={56} />
                  <p className="text-gray-500 text-lg font-medium">No deals found for the selected filters</p>
                </div>
              )}

            </div>
          </Section>

        </div>

      </div>
    </div>
  );
};


/* ===============================
   UI COMPONENTS
================================ */

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color, isPercentage, delay }) => {
  const colorClasses = {
    emerald: { bg: 'from-emerald-400 to-emerald-600', text: 'text-emerald-600' },
    purple: { bg: 'from-purple-400 to-purple-600', text: 'text-purple-600' },
    blue: { bg: 'from-blue-400 to-blue-600', text: 'text-blue-600' },
    orange: { bg: 'from-orange-400 to-orange-600', text: 'text-orange-600' }
  };

  const trendIcons = {
    up: <TrendingUp className="text-green-500" size={24} />,
    down: <TrendingDown className="text-red-500" size={24} />,
    neutral: null
  };

  return (
    <div className="glass-effect p-6 rounded-3xl shadow-lg hover-lift animate-slide-up" style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${colorClasses[color].bg} shadow-lg`}>
          <Icon className="text-white" size={28} />
        </div>
        {trendIcons[trend]}
      </div>
      
      <h3 className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">
        {title}
      </h3>
      
      <p className="text-4xl font-bold text-gray-900 mb-2">
        {isPercentage ? value : typeof value === 'string' ? value : formatCurrency(value)}
      </p>

      {subtitle && (
        <p className="text-sm text-gray-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: { bg: 'from-blue-400 to-blue-600', ring: 'ring-blue-200' },
    green: { bg: 'from-green-400 to-green-600', ring: 'ring-green-200' },
    purple: { bg: 'from-purple-400 to-purple-600', ring: 'ring-purple-200' },
    red: { bg: 'from-red-400 to-red-600', ring: 'ring-red-200' }
  };

  return (
    <div className={`glass-effect p-5 rounded-2xl shadow-md hover-lift ring-2 ${colorClasses[color].ring}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color].bg} shadow-md`}>
          <Icon className="text-white" size={24} />
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, icon: Icon, children }) => (
  <div className="glass-effect p-6 rounded-3xl shadow-lg hover-lift">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Icon className="text-white" size={20} />
      </div>
      <h2 className="font-bold text-xl text-gray-900">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="glass-effect p-6 rounded-3xl shadow-lg">
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Icon className="text-white" size={20} />
        </div>
      )}
      <h2 className="font-bold text-xl text-gray-900">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const DealCard = ({ deal, status, users }) => {
  const statusColors = {
    closed: { bg: 'from-green-50 to-emerald-50', border: 'border-green-300', text: 'text-green-700' },
    open: { bg: 'from-blue-50 to-cyan-50', border: 'border-blue-300', text: 'text-blue-700' },
    lost: { bg: 'from-red-50 to-pink-50', border: 'border-red-300', text: 'text-red-700' }
  };

  const creator = users.find(u => u.id === deal.createdBy);
  const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown';

  return (
    <div className={`p-5 rounded-2xl border-2 bg-gradient-to-r ${statusColors[status].bg} ${statusColors[status].border} hover:shadow-md transition-all hover-lift`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-lg">{deal.businessName}</p>
          <p className="text-sm text-gray-600 font-medium">{deal.contactPerson}</p>
          <p className="text-xs text-gray-500 mt-2">
            Sales Rep: <span className="font-semibold">{creatorName}</span> • {formatPDFDate(deal.date)}
          </p>
        </div>
        <div className="text-right">
          {status === 'closed' ? (
            <>
              <p className={`font-bold text-xl ${statusColors[status].text}`}>
                {formatCurrency(deal.price || 0)}
              </p>
              <p className="text-xs text-gray-600 font-medium mt-1">
                Commission: {formatCurrency((deal.price || 0) * 0.2)}
              </p>
            </>
          ) : status === 'open' ? (
            <>
              <p className={`font-bold text-lg ${statusColors[status].text}`}>
                {formatCurrency(deal.price || 0)}
              </p>
              <p className="text-xs text-gray-600 capitalize font-medium mt-1">
                {deal.status}
              </p>
            </>
          ) : (
            <p className={`text-base font-bold ${statusColors[status].text}`}>
              Lost Deal
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
    className="p-6 bg-gradient-to-br from-gray-50 to-white hover:from-purple-50 hover:to-blue-50 border-2 border-gray-200 hover:border-purple-300 rounded-2xl transition-all text-left group shadow-sm hover:shadow-lg"
  >
    <div className="flex items-start justify-between mb-3">
      <FileText className="text-gray-400 group-hover:text-purple-600 transition-colors" size={28} />
      <Download className="text-gray-300 group-hover:text-purple-500 transition-colors" size={20} />
    </div>
    <h3 className="font-bold text-gray-900 mb-2 text-lg">
      {title}
    </h3>
    <p className="text-sm text-gray-600">
      {description}
    </p>
  </button>
);

export default SalesReportsPage;