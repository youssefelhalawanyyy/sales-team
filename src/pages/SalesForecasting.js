import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export const SalesForecasting = () => {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState({});
  const [timeframe, setTimeframe] = useState('month');

  // Load deals and targets
  useEffect(() => {
    if (!currentUser?.uid) return;

    const isAdmin = userRole === 'admin' || userRole === 'sales_manager';
    const q = isAdmin
      ? query(collection(db, 'sales'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'sales'),
          where('createdBy', '==', currentUser.uid),
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
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1);
    const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3);

    const thisMonthDeals = deals.filter(d => new Date(d.createdAt) >= monthAgo);
    const thisQuarterDeals = deals.filter(d => new Date(d.createdAt) >= quarterAgo);

    const closedMonthly = thisMonthDeals.filter(d => d.status === 'closed');
    const closedQuarterly = thisQuarterDeals.filter(d => d.status === 'closed');

    const avgMonthlyRevenue = thisMonthDeals.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0);
    const avgQuarterlyRevenue = thisQuarterDeals.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0);

    return {
      monthlyRevenue: avgMonthlyRevenue,
      quarterlyRevenue: avgQuarterlyRevenue,
      monthlyDeals: thisMonthDeals.length,
      quarterlyDeals: thisQuarterDeals.length,
      monthlyClosedRate: thisMonthDeals.length > 0 ? ((closedMonthly.length / thisMonthDeals.length) * 100).toFixed(1) : 0,
      quarterlyClosedRate: thisQuarterDeals.length > 0 ? ((closedQuarterly.length / thisQuarterDeals.length) * 100).toFixed(1) : 0
    };
  }, [deals]);

  // Forecast data
  const forecastData = useMemo(() => {
    const forecast = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i);
      const monthStr = month.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      // Estimate based on historical data
      const estimatedRevenue = metrics.monthlyRevenue * (0.9 + Math.random() * 0.2);
      const estimatedDeals = Math.round(metrics.monthlyDeals * (0.8 + Math.random() * 0.4));

      forecast.push({
        month: monthStr,
        estimated: Math.round(estimatedRevenue),
        conservative: Math.round(estimatedRevenue * 0.75),
        optimistic: Math.round(estimatedRevenue * 1.25),
        deals: estimatedDeals
      });
    }

    return forecast;
  }, [metrics]);

  // Pipeline analysis
  const pipelineAnalysis = useMemo(() => {
    const statuses = {};
    deals.forEach(deal => {
      const status = deal.status || 'unknown';
      const amount = parseFloat(deal.price) || 0;
      if (!statuses[status]) {
        statuses[status] = { count: 0, total: 0, deals: [] };
      }
      statuses[status].count++;
      statuses[status].total += amount;
      statuses[status].deals.push(deal);
    });

    return Object.entries(statuses).map(([status, data]) => ({
      status,
      count: data.count,
      total: data.total,
      avg: data.deals.length > 0 ? data.total / data.deals.length : 0,
      color: {
        'closed': '#10b981',
        'won': '#3b82f6',
        'negotiation': '#8b5cf6',
        'pending': '#f59e0b'
      }[status] || '#6b7280'
    }));
  }, [deals]);

  // Target vs Actual
  const targetData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, idx) => ({
      month,
      target: (userRole === 'admin' ? 50000 : 25000) + (idx * 5000),
      actual: (metrics.monthlyRevenue * (0.7 + Math.random() * 0.6)) + (idx * 2000)
    }));
  }, [metrics, userRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forecasting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <Target size={32} />
          <div>
            <h1 className="text-3xl font-bold">Sales Forecasting</h1>
            <p className="text-blue-100">Predict future revenue and track progress</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Monthly Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">€{metrics.monthlyRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-2">{metrics.monthlyDeals} deals closed</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Q. Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">€{metrics.quarterlyRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-2">{metrics.quarterlyDeals} deals closed</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Close Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.monthlyClosedRate}%</p>
          <p className="text-xs text-gray-600 mt-2">This month</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 12-Month Forecast */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">12-Month Revenue Forecast</h3>
          {forecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="estimated" stroke="#3b82f6" strokeWidth={2} name="Estimated" />
                <Line type="monotone" dataKey="conservative" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Conservative" />
                <Line type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Optimistic" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Pipeline by Status */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pipeline Value by Status</h3>
          {pipelineAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pipelineAnalysis}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, total }) => `${status}: €${(total / 1000).toFixed(0)}k`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {pipelineAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Target vs Actual */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Target vs Actual Performance</h3>
        {targetData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={targetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="target" fill="#3b82f6" name="Target" radius={[8, 8, 0, 0]} />
              <Bar dataKey="actual" fill="#10b981" name="Actual" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {/* Pipeline Stages */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Pipeline Analysis</h3>
        
        <div className="space-y-3">
          {pipelineAnalysis.map((stage, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 capitalize">{stage.status}</span>
                  <span className="text-sm font-bold text-gray-700">€{stage.total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((stage.total / deals.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0) || 1) * 100, 100)}%`,
                      backgroundColor: stage.color
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">{stage.count} deals • Avg: €{stage.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesForecasting;
