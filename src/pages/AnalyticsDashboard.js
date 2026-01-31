import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Calendar, Download } from 'lucide-react';

export const AnalyticsDashboard = () => {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year

  // Real-time deals listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    const isAdmin = userRole === 'admin' || userRole === 'sales_manager';
    const q = isAdmin
      ? query(collection(db, 'deals'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'deals'),
          where('salesPersonId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dealsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setDeals(dealsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser?.uid, userRole]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (timeRange === 'quarter') startDate.setMonth(now.getMonth() - 3);
    else startDate.setFullYear(now.getFullYear() - 1);

    const periodDeals = deals.filter(d => new Date(d.createdAt) >= startDate);
    const closedDeals = periodDeals.filter(d => d.status === 'closed');

    const totalRevenue = closedDeals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const totalCommission = closedDeals.reduce((sum, d) => sum + (parseFloat(d.commission) || 0), 0);
    const avgDealValue = closedDeals.length > 0 ? totalRevenue / closedDeals.length : 0;
    const winRate = periodDeals.length > 0 ? ((closedDeals.length / periodDeals.length) * 100).toFixed(1) : 0;

    return {
      totalDeals: periodDeals.length,
      closedDeals: closedDeals.length,
      openDeals: periodDeals.filter(d => d.status !== 'closed').length,
      totalRevenue,
      totalCommission,
      avgDealValue,
      winRate
    };
  }, [deals, timeRange]);

  // Monthly revenue chart data
  const monthlyData = useMemo(() => {
    const data = {};
    deals.forEach(deal => {
      if (deal.status === 'closed') {
        const month = new Date(deal.createdAt).toLocaleString('default', { month: 'short' });
        data[month] = (data[month] || 0) + parseFloat(deal.amount || 0);
      }
    });
    return Object.entries(data).map(([month, revenue]) => ({ month, revenue })).slice(-12);
  }, [deals]);

  // Deal status distribution
  const statusData = useMemo(() => {
    const statuses = {};
    deals.forEach(deal => {
      statuses[deal.status] = (statuses[deal.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: {
        'closed': '#10b981',
        'won': '#3b82f6',
        'lost': '#ef4444',
        'pending': '#f59e0b',
        'negotiation': '#8b5cf6'
      }[status] || '#6b7280'
    }));
  }, [deals]);

  // Deal value distribution
  const valueDistribution = useMemo(() => {
    const ranges = {
      'Under €1K': 0,
      '€1K - €5K': 0,
      '€5K - €10K': 0,
      'Over €10K': 0
    };

    deals.forEach(deal => {
      const amount = parseFloat(deal.amount || 0);
      if (amount < 1000) ranges['Under €1K']++;
      else if (amount < 5000) ranges['€1K - €5K']++;
      else if (amount < 10000) ranges['€5K - €10K']++;
      else ranges['Over €10K']++;
    });

    return Object.entries(ranges).map(([range, count]) => ({ range, count }));
  }, [deals]);

  const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

  const StatCard = ({ icon: Icon, label, value, change, format = 'text' }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {format === 'currency' ? `€${value.toLocaleString()}` : format === 'percent' ? `${value}%` : value}
          </p>
          {change !== undefined && (
            <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {change >= 0 ? '+' : ''}{change}% vs last period
            </p>
          )}
        </div>
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-blue-100">Real-time sales performance insights</p>
          </div>
          <button className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2 mb-6">
        {['month', 'quarter', 'year'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              timeRange === range
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Total Revenue" value={metrics.totalRevenue} format="currency" />
        <StatCard icon={Target} label="Total Deals" value={metrics.totalDeals} />
        <StatCard icon={TrendingUp} label="Closed Deals" value={metrics.closedDeals} />
        <StatCard icon={Users} label="Win Rate" value={metrics.winRate} format="percent" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Revenue */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Deal Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Deal Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Deal Value Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Deal Value Distribution</h3>
        {valueDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
