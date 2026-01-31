import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle, Filter, Calendar, BarChart3 } from 'lucide-react';

export default function WinLossAnalysisPage() {
  const { currentUser, userRole } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('year');
  const [selectedReason, setSelectedReason] = useState('all');

  useEffect(() => {
    loadWinLossAnalysis();
  }, [currentUser, userRole, timeframe]);

  async function loadWinLossAnalysis() {
    try {
      setLoading(true);

      let dealsQuery;
      if (userRole === 'admin') {
        dealsQuery = query(collection(db, 'sales'));
      } else {
        dealsQuery = query(
          collection(db, 'sales'),
          where('createdBy', '==', currentUser.uid)
        );
      }

      const dealsSnap = await getDocs(dealsQuery);
      let deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter by timeframe
      const now = new Date();
      deals = deals.filter(deal => {
        const dealDate = deal.createdAt?.toDate?.() || new Date();
        let startDate = new Date();

        if (timeframe === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else if (timeframe === 'quarter') {
          startDate.setMonth(now.getMonth() - 3);
        } else {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        return dealDate >= startDate;
      });

      // Separate wins and losses
      const wins = deals.filter(d => d.stage === 'closed' || d.status === 'closed');
      const losses = deals.filter(d => d.stage === 'lost' || d.status === 'lost');

      // Calculate metrics
      const totalDeals = deals.length;
      const totalRevenue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);
      const winCount = wins.length;
      const lossCount = losses.length;
      const winRate = totalDeals > 0 ? (winCount / totalDeals) * 100 : 0;
      const avgWinValue = winCount > 0 ? wins.reduce((sum, d) => sum + (d.amount || 0), 0) / winCount : 0;
      const avgLossValue = lossCount > 0 ? losses.reduce((sum, d) => sum + (d.amount || 0), 0) / lossCount : 0;

      // Loss reasons analysis
      const lossReasons = {};
      losses.forEach(loss => {
        const reason = loss.lossReason || 'Not specified';
        if (!lossReasons[reason]) {
          lossReasons[reason] = { reason, count: 0, revenue: 0, percentage: 0 };
        }
        lossReasons[reason].count += 1;
        lossReasons[reason].revenue += loss.amount || 0;
      });

      Object.keys(lossReasons).forEach(reason => {
        lossReasons[reason].percentage = lossCount > 0 ? (lossReasons[reason].count / lossCount) * 100 : 0;
      });

      // Win reasons analysis
      const winReasons = {};
      wins.forEach(win => {
        const reason = win.winReason || 'Strong fit';
        if (!winReasons[reason]) {
          winReasons[reason] = { reason, count: 0, revenue: 0, percentage: 0 };
        }
        winReasons[reason].count += 1;
        winReasons[reason].revenue += win.amount || 0;
      });

      Object.keys(winReasons).forEach(reason => {
        winReasons[reason].percentage = winCount > 0 ? (winReasons[reason].count / winCount) * 100 : 0;
      });

      // Monthly trend
      const monthlyData = {};
      deals.forEach(deal => {
        const date = deal.createdAt?.toDate?.() || new Date();
        const monthStr = date.toLocaleDateString('default', { month: 'short', year: '2-digit' });

        if (!monthlyData[monthStr]) {
          monthlyData[monthStr] = { month: monthStr, wins: 0, losses: 0, winRate: 0 };
        }

        if (deal.stage === 'closed' || deal.status === 'closed') {
          monthlyData[monthStr].wins += 1;
        } else if (deal.stage === 'lost' || deal.status === 'lost') {
          monthlyData[monthStr].losses += 1;
        }
      });

      const monthlyTrend = Object.values(monthlyData).map(m => {
        const total = m.wins + m.losses;
        return {
          ...m,
          winRate: total > 0 ? Math.round((m.wins / total) * 100) : 0
        };
      });

      setAnalysis({
        totalDeals,
        totalRevenue,
        winCount,
        lossCount,
        winRate,
        avgWinValue,
        avgLossValue,
        lossReasons: Object.values(lossReasons).sort((a, b) => b.count - a.count),
        winReasons: Object.values(winReasons).sort((a, b) => b.count - a.count),
        monthlyTrend,
        largestWin: wins.reduce((max, d) => (d.amount || 0) > (max.amount || 0) ? d : max, wins[0] || {}),
        largestLoss: losses.reduce((max, d) => (d.amount || 0) > (max.amount || 0) ? d : max, losses[0] || {})
      });
    } catch (e) {
      console.error('Error loading analysis:', e);
    } finally {
      setLoading(false);
    }
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-500">{loading ? 'Loading analysis...' : 'No data available'}</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Wins', value: analysis.winCount, fill: '#10b981' },
    { name: 'Losses', value: analysis.lossCount, fill: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-xl">
              <BarChart3 className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Win/Loss Analysis</h1>
              <p className="text-gray-500">Understand what's winning and why deals are lost</p>
            </div>
          </div>
        </div>

        {/* Timeframe Filter */}
        <div className="flex gap-2">
          {['month', 'quarter', 'year'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeframe === tf
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf === 'month' ? 'Last Month' : tf === 'quarter' ? 'Last Quarter' : 'Last Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium mb-2">Total Deals</p>
          <p className="text-3xl font-bold text-blue-900">{analysis.totalDeals}</p>
          <p className="text-xs text-blue-600 mt-2">Analyzed deals</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium mb-2">Win Rate</p>
          <p className="text-3xl font-bold text-green-900">{analysis.winRate.toFixed(0)}%</p>
          <p className="text-xs text-green-600 mt-2">{analysis.winCount} wins</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-xl p-6 border border-red-200">
          <p className="text-sm text-red-700 font-medium mb-2">Loss Rate</p>
          <p className="text-3xl font-bold text-red-900">{(100 - analysis.winRate).toFixed(0)}%</p>
          <p className="text-xs text-red-600 mt-2">{analysis.lossCount} losses</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-xl p-6 border border-purple-200">
          <p className="text-sm text-purple-700 font-medium mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-purple-900">${(analysis.totalRevenue / 1000).toFixed(0)}k</p>
          <p className="text-xs text-purple-600 mt-2">From won deals</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Win/Loss Pie */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Win vs Loss Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Win Rate Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analysis.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="winRate" stroke="#10b981" name="Win Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Largest Win/Loss */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl border-2 border-green-300 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-green-600" size={28} />
            <h3 className="text-xl font-bold text-green-900">Largest Win</h3>
          </div>
          <p className="text-sm text-green-700 mb-2">{analysis.largestWin?.businessName || analysis.largestWin?.clientName || 'N/A'}</p>
          <p className="text-3xl font-bold text-green-900">${(analysis.largestWin?.amount || 0 / 1000).toFixed(1)}k</p>
          {analysis.largestWin?.winReason && (
            <p className="text-sm text-green-700 mt-2">Reason: {analysis.largestWin.winReason}</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-xl border-2 border-red-300 p-6">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="text-red-600" size={28} />
            <h3 className="text-xl font-bold text-red-900">Largest Loss</h3>
          </div>
          <p className="text-sm text-red-700 mb-2">{analysis.largestLoss?.businessName || analysis.largestLoss?.clientName || 'N/A'}</p>
          <p className="text-3xl font-bold text-red-900">${(analysis.largestLoss?.amount || 0 / 1000).toFixed(1)}k</p>
          {analysis.largestLoss?.lossReason && (
            <p className="text-sm text-red-700 mt-2">Reason: {analysis.largestLoss.lossReason}</p>
          )}
        </div>
      </div>

      {/* Loss Reasons */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Why Deals Are Lost</h2>
        <div className="space-y-3">
          {analysis.lossReasons.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No losses to analyze</p>
          ) : (
            analysis.lossReasons.map((reason, idx) => (
              <div key={idx} className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-red-900">{reason.reason}</p>
                    <p className="text-xs text-red-600">{reason.count} deals • ${(reason.revenue / 1000).toFixed(1)}k lost</p>
                  </div>
                  <span className="text-lg font-bold text-red-600">{reason.percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-red-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full" style={{ width: `${reason.percentage}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Win Reasons */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Why Deals Are Won</h2>
        <div className="space-y-3">
          {analysis.winReasons.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No wins to analyze</p>
          ) : (
            analysis.winReasons.map((reason, idx) => (
              <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-green-900">{reason.reason}</p>
                    <p className="text-xs text-green-600">{reason.count} deals • ${(reason.revenue / 1000).toFixed(1)}k revenue</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">{reason.percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-600 h-full rounded-full" style={{ width: `${reason.percentage}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
