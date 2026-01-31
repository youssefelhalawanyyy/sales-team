import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar, DollarSign, Target, Zap, ArrowUp, ArrowDown } from 'lucide-react';

export default function RevenuePipelineForecastPage() {
  const { currentUser, userRole } = useAuth();
  const [forecastData, setForecastData] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('12'); // 3, 6, 12 months

  useEffect(() => {
    loadForecastData();
  }, [currentUser, userRole, timeframe]);

  async function loadForecastData() {
    try {
      setLoading(true);

      let dealsQuery;
      if (userRole === 'admin') {
        dealsQuery = query(collection(db, 'sales'), where('archived', '==', false));
      } else {
        dealsQuery = query(
          collection(db, 'sales'),
          where('createdBy', '==', currentUser.uid),
          where('archived', '==', false)
        );
      }

      const dealsSnap = await getDocs(dealsQuery);
      const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Build monthly forecast
      const months = [];
      const now = new Date();
      const monthsToForecast = parseInt(timeframe);

      for (let i = 0; i < monthsToForecast; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthStr = date.toLocaleDateString('default', { month: 'short', year: '2-digit' });

        // Calculate expected revenue for this month
        let expectedRevenue = 0;
        let closedRevenue = 0;
        let dealCount = 0;

        deals.forEach(deal => {
          const expectedClose = deal.expectedCloseDate?.toDate?.() || deal.createdAt?.toDate?.();
          if (!expectedClose) return;

          const dealMonth = new Date(expectedClose.getFullYear(), expectedClose.getMonth(), 1);
          const forecastMonth = new Date(date.getFullYear(), date.getMonth(), 1);

          if (dealMonth.getTime() === forecastMonth.getTime()) {
            dealCount += 1;
            const amount = deal.amount || deal.price || deal.dealValue || 0;

            if (deal.stage === 'closed' || deal.status === 'closed') {
              closedRevenue += amount;
            } else if (deal.stage === 'proposal' || deal.stage === 'negotiation') {
              // Apply probability based on stage
              const probability = deal.stage === 'proposal' ? 0.5 : 0.7;
              expectedRevenue += amount * probability;
            } else if (deal.stage === 'qualified' || deal.stage === 'contacted') {
              expectedRevenue += amount * 0.3;
            }
          }
        });

        months.push({
          month: monthStr,
          expected: Math.round(expectedRevenue),
          closed: Math.round(closedRevenue),
          deals: dealCount,
          total: Math.round(expectedRevenue + closedRevenue)
        });
      }

      setForecastData(months);

      // Build pipeline by stage
      const stagePipeline = {};
      deals.forEach(deal => {
        const stage = deal.stage || 'new';
        if (!stagePipeline[stage]) {
          stagePipeline[stage] = { stage, revenue: 0, deals: 0 };
        }
        stagePipeline[stage].revenue += deal.amount || 0;
        stagePipeline[stage].deals += 1;
      });

      const pipelineArray = Object.values(stagePipeline)
        .sort((a, b) => b.revenue - a.revenue);
      setPipelineData(pipelineArray);
    } catch (e) {
      console.error('Error loading forecast:', e);
    } finally {
      setLoading(false);
    }
  }

  const totalExpected = forecastData.reduce((sum, m) => sum + m.expected, 0);
  const totalClosed = forecastData.reduce((sum, m) => sum + m.closed, 0);
  const avgMonthly = forecastData.length > 0 ? Math.round(totalExpected / forecastData.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl">
              <TrendingUp className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Pipeline Forecast</h1>
              <p className="text-gray-500">Predict future revenue based on deal pipeline</p>
            </div>
          </div>
        </div>

        {/* Timeframe Filter */}
        <div className="flex gap-2">
          {['3', '6', '12'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeframe === tf
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf} Months
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-xl p-6 border border-purple-200">
          <p className="text-sm text-purple-700 font-medium mb-2">Total Expected Revenue</p>
          <p className="text-3xl font-bold text-purple-900">${(totalExpected / 1000).toFixed(0)}k</p>
          <p className="text-xs text-purple-600 mt-2">Next {timeframe} months</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium mb-2">Already Closed</p>
          <p className="text-3xl font-bold text-green-900">${(totalClosed / 1000).toFixed(0)}k</p>
          <p className="text-xs text-green-600 mt-2">Confirmed revenue</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium mb-2">Average Monthly</p>
          <p className="text-3xl font-bold text-blue-900">${(avgMonthly / 1000).toFixed(0)}k</p>
          <p className="text-xs text-blue-600 mt-2">Expected per month</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-xl p-6 border border-orange-200">
          <p className="text-sm text-orange-700 font-medium mb-2">Confidence Level</p>
          <p className="text-3xl font-bold text-orange-900">65%</p>
          <p className="text-xs text-orange-600 mt-2">Weighted forecast</p>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Forecast</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading forecast...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
              <Legend />
              <Area type="monotone" dataKey="expected" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorExpected)" name="Expected Revenue" />
              <Area type="monotone" dataKey="closed" stroke="#10b981" fillOpacity={1} fill="url(#colorClosed)" name="Closed Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pipeline by Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pipeline by Stage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip formatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
              <Bar dataKey="revenue" fill="#a855f7" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Stage Breakdown</h2>
          <div className="space-y-3">
            {pipelineData.map(stage => {
              const totalPipeline = pipelineData.reduce((sum, s) => sum + s.revenue, 0);
              const percentage = totalPipeline > 0 ? (stage.revenue / totalPipeline) * 100 : 0;

              return (
                <div key={stage.stage} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{stage.stage}</p>
                      <p className="text-xs text-gray-600">{stage.deals} deals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${(stage.revenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-gray-600">{percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Detail Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Forecast Detail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-900">Month</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Deals</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Expected</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Closed</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {forecastData.map(month => (
                <tr key={month.month} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{month.month}</td>
                  <td className="px-6 py-4 text-right text-gray-900">{month.deals}</td>
                  <td className="px-6 py-4 text-right font-semibold text-purple-600">${(month.expected / 1000).toFixed(1)}k</td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600">${(month.closed / 1000).toFixed(1)}k</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">${(month.total / 1000).toFixed(1)}k</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
