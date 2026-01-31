import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Zap, TrendingUp, Clock, Target, BarChart3, AlertCircle, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';

export default function SalesVelocityMetricsPage() {
  const { currentUser, userRole } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stageBreakdown, setStageBreakdown] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    loadSalesVelocity();
  }, [currentUser, userRole]);

  async function loadSalesVelocity() {
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
      const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Calculate average deal cycle time
      const closedDeals = deals.filter(d => d.stage === 'closed' || d.status === 'closed');
      const cycleTimes = [];

      closedDeals.forEach(deal => {
        const createdDate = deal.createdAt?.toDate?.();
        const closedDate = deal.closedDate?.toDate?.();

        if (createdDate && closedDate) {
          const cycleDays = Math.floor((closedDate - createdDate) / (1000 * 60 * 60 * 24));
          cycleTimes.push(cycleDays);
        }
      });

      const avgCycleTime = cycleTimes.length > 0 ? 
        Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) : 0;
      const minCycleTime = cycleTimes.length > 0 ? Math.min(...cycleTimes) : 0;
      const maxCycleTime = cycleTimes.length > 0 ? Math.max(...cycleTimes) : 0;

      // Calculate deals per month closed
      const monthlyClosures = {};
      closedDeals.forEach(deal => {
        const closedDate = deal.closedDate?.toDate?.() || new Date();
        const monthStr = closedDate.toLocaleDateString('default', { month: 'short', year: '2-digit' });

        if (!monthlyClosures[monthStr]) {
          monthlyClosures[monthStr] = 0;
        }
        monthlyClosures[monthStr] += 1;
      });

      const closuresPerMonth = Object.values(monthlyClosures);
      const avgClosuresPerMonth = closuresPerMonth.length > 0 ? 
        Math.round(closuresPerMonth.reduce((a, b) => a + b, 0) / closuresPerMonth.length) : 0;

      // Calculate stage velocity
      const stages = ['contacted', 'qualified', 'proposal', 'negotiation', 'closed'];
      const stageData = [];

      stages.forEach(stage => {
        const stageDeals = deals.filter(d => (d.stage || '').toLowerCase() === stage);
        if (stageDeals.length > 0) {
          // Get average days in this stage
          let daysInStage = [];

          stageDeals.forEach(deal => {
            if (deal.stageEnteredDate?.toDate?.()) {
              const stageDate = deal.stageEnteredDate.toDate();
              const nextStageDate = deal.closedDate?.toDate?.() || new Date();
              const days = Math.floor((nextStageDate - stageDate) / (1000 * 60 * 60 * 24));
              daysInStage.push(Math.max(1, days));
            }
          });

          const avgDays = daysInStage.length > 0 ? 
            Math.round(daysInStage.reduce((a, b) => a + b, 0) / daysInStage.length) : 5;

          stageData.push({
            stage: stage.charAt(0).toUpperCase() + stage.slice(1),
            deals: stageDeals.length,
            avgDays,
            revenue: stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
          });
        }
      });

      // Calculate conversion rates by stage
      const conversionRates = [];
      stages.forEach((stage, idx) => {
        const stageDeals = deals.filter(d => (d.stage || '').toLowerCase() === stage);
        const closedFromStage = stageDeals.filter(d => d.stage === 'closed' || d.status === 'closed');
        const rate = stageDeals.length > 0 ? (closedFromStage.length / stageDeals.length) * 100 : 0;

        conversionRates.push({
          stage: stage.charAt(0).toUpperCase() + stage.slice(1),
          conversionRate: Math.round(rate),
          deals: stageDeals.length
        });
      });

      // Build historical data
      const historical = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toLocaleDateString('default', { month: 'short' });

        const monthDeals = deals.filter(d => {
          const dealDate = d.createdAt?.toDate?.() || new Date();
          return dealDate.getMonth() === date.getMonth() && dealDate.getFullYear() === date.getFullYear();
        });

        const closedInMonth = monthDeals.filter(d => d.stage === 'closed' || d.status === 'closed').length;
        const avgDealValue = monthDeals.length > 0 ? 
          monthDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / monthDeals.length : 0;

        historical.push({
          month: monthStr,
          deals: monthDeals.length,
          closed: closedInMonth,
          avgDealValue: Math.round(avgDealValue)
        });
      }

      setMetrics({
        avgCycleTime,
        minCycleTime,
        maxCycleTime,
        avgClosuresPerMonth,
        totalClosed: closedDeals.length,
        totalDeals: deals.length,
        conversionRate: deals.length > 0 ? Math.round((closedDeals.length / deals.length) * 100) : 0,
        avgDealValue: deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + (d.amount || 0), 0) / deals.length) : 0,
        deals: deals.length,
        closed: closedDeals.length,
        open: deals.filter(d => d.stage !== 'closed' && d.stage !== 'lost').length
      });

      setStageBreakdown(stageData);
      setHistoricalData(historical);
    } catch (e) {
      console.error('Error loading metrics:', e);
    } finally {
      setLoading(false);
    }
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">{loading ? 'Loading metrics...' : 'No data available'}</p>
        </div>
      </div>
    );
  }

  const cycleTimeStatus = metrics.avgCycleTime <= 30 ? 'excellent' : 
                          metrics.avgCycleTime <= 60 ? 'good' : 
                          metrics.avgCycleTime <= 90 ? 'fair' : 'slow';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl">
            <Zap className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Velocity Metrics</h1>
            <p className="text-gray-500">Track deal cycle times and sales efficiency</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium mb-2">Avg Deal Cycle</p>
          <p className="text-3xl font-bold text-blue-900">{metrics.avgCycleTime}</p>
          <p className="text-xs text-blue-600 mt-2">days from creation to close</p>
          <div className="mt-3 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              cycleTimeStatus === 'excellent' ? 'bg-green-500' :
              cycleTimeStatus === 'good' ? 'bg-blue-500' :
              cycleTimeStatus === 'fair' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}></div>
            <span className="text-xs font-semibold text-blue-700 capitalize">{cycleTimeStatus}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium mb-2">Avg Closures/Month</p>
          <p className="text-3xl font-bold text-green-900">{metrics.avgClosuresPerMonth}</p>
          <p className="text-xs text-green-600 mt-2">deals closed per month</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-xl p-6 border border-purple-200">
          <p className="text-sm text-purple-700 font-medium mb-2">Conversion Rate</p>
          <p className="text-3xl font-bold text-purple-900">{metrics.conversionRate}%</p>
          <p className="text-xs text-purple-600 mt-2">of deals won</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-xl p-6 border border-orange-200">
          <p className="text-sm text-orange-700 font-medium mb-2">Avg Deal Value</p>
          <p className="text-3xl font-bold text-orange-900">${(metrics.avgDealValue / 1000).toFixed(0)}k</p>
          <p className="text-xs text-orange-600 mt-2">average deal size</p>
        </div>
      </div>

      {/* Summary Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Target className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Deals</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.deals}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Closed:</span>
              <span className="font-semibold text-green-600">{metrics.closed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Open:</span>
              <span className="font-semibold text-orange-600">{metrics.open}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Cycle Time Range</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.minCycleTime}-{metrics.maxCycleTime}d</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-semibold">{metrics.minCycleTime} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-semibold">{metrics.maxCycleTime} days</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Sales Health</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.conversionRate > 40 ? '✓ Strong' : metrics.conversionRate > 20 ? '~ Normal' : '⚠ Low'}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">Conversion and cycle time are within expectations</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Stage Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Deal Days by Stage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} days`} />
              <Bar dataKey="avgDays" fill="#3b82f6" name="Avg Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Historical Trend */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Deals Closed per Month</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="closed" stroke="#10b981" name="Closed" />
              <Line type="monotone" dataKey="deals" stroke="#3b82f6" name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Details */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pipeline Stage Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Time in Each Stage</h3>
            <div className="space-y-3">
              {stageBreakdown.map(stage => (
                <div key={stage.stage} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-gray-900">{stage.stage}</span>
                    <span className="text-xs font-bold text-gray-600">{stage.avgDays} days</span>
                  </div>
                  <p className="text-xs text-gray-600">{stage.deals} deals in this stage</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Average Deal Value by Stage</h3>
            <div className="space-y-3">
              {stageBreakdown.map(stage => (
                <div key={stage.stage} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{stage.stage}</span>
                    <span className="text-lg font-bold text-blue-600">${(stage.revenue / 1000).toFixed(1)}k</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Total: ${(stage.revenue / stage.deals / 1000).toFixed(1)}k per deal</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
