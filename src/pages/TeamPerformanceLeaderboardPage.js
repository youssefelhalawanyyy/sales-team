import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  Trophy,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  Medal,
  Crown,
  Calendar,
  Filter
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function TeamPerformanceLeaderboardPage() {
  const { currentUser, userRole } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // month, quarter, year
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    loadTeamPerformance();
  }, [currentUser, userRole, timeframe]);

  async function loadTeamPerformance() {
    try {
      setLoading(true);

      // Only admin and team_leader can see team performance
      if (userRole !== 'admin' && userRole !== 'team_leader') {
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Fetch all deals from the system
      const dealsSnap = await getDocs(collection(db, 'sales'));
      const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch all users to get real names
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap = {};
      usersSnap.docs.forEach(doc => {
        const userData = doc.data();
        usersMap[doc.id] = {
          name: userData.name || userData.email?.split('@')[0] || 'Unknown User',
          email: userData.email,
          role: userData.role
        };
      });

      // Filter by timeframe
      const now = new Date();
      const filteredDeals = deals.filter(deal => {
        const dealDate = deal.createdAt?.toDate?.() || new Date();
        let startDate = new Date();

        if (timeframe === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else if (timeframe === 'quarter') {
          startDate.setMonth(now.getMonth() - 3);
        } else if (timeframe === 'year') {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        return dealDate >= startDate;
      });

      // Group by sales rep
      const repMap = {};

      filteredDeals.forEach(deal => {
        const repId = deal.createdBy;
        if (!repId) return; // Skip deals without a creator

        if (!repMap[repId]) {
          const userData = usersMap[repId] || {};
          repMap[repId] = {
            repId,
            repName: userData.name || `User ${repId.slice(0, 8)}`,
            repEmail: userData.email || '',
            repRole: userData.role || '',
            deals: [],
            totalRevenue: 0,
            closedDeals: 0,
            openDeals: 0,
            lostDeals: 0,
            avgDealValue: 0,
            winRate: 0,
            closeRate: 0
          };
        }

        repMap[repId].deals.push(deal);
        
        // Calculate total revenue from deal amount
        const dealAmount = parseFloat(deal.amount) || 0;
        repMap[repId].totalRevenue += dealAmount;

        // Count deals by status/stage
        const dealStatus = (deal.status || deal.stage || '').toLowerCase();
        if (dealStatus === 'closed' || dealStatus === 'won' || dealStatus === 'closed won') {
          repMap[repId].closedDeals += 1;
        } else if (dealStatus === 'lost' || dealStatus === 'closed lost') {
          repMap[repId].lostDeals += 1;
        } else {
          repMap[repId].openDeals += 1;
        }
      });

      // Calculate metrics for each rep
      const members = Object.values(repMap).map(rep => {
        const totalDeals = rep.deals.length;
        const decisiveDeals = rep.closedDeals + rep.lostDeals; // Deals that have been closed (won or lost)
        
        return {
          ...rep,
          avgDealValue: totalDeals > 0 ? Math.round(rep.totalRevenue / totalDeals) : 0,
          winRate: decisiveDeals > 0 ? Math.round((rep.closedDeals / decisiveDeals) * 100) : 0,
          closeRate: totalDeals > 0 ? Math.round((rep.closedDeals / totalDeals) * 100) : 0,
          dealCount: totalDeals
        };
      });

      // Sort by revenue (highest first)
      members.sort((a, b) => b.totalRevenue - a.totalRevenue);
      setTeamMembers(members);
    } catch (e) {
      console.error('Error loading team performance:', e);
    } finally {
      setLoading(false);
    }
  }

  const metrics = [
    { key: 'revenue', label: 'Total Revenue', icon: DollarSign, color: 'from-green-500 to-emerald-600' },
    { key: 'deals', label: 'Total Deals', icon: Target, color: 'from-blue-500 to-cyan-600' },
    { key: 'closed', label: 'Closed Deals', icon: Trophy, color: 'from-yellow-500 to-orange-600' },
    { key: 'winrate', label: 'Win Rate %', icon: Zap, color: 'from-red-500 to-pink-600' }
  ];

  const getMetricValue = (member, metric) => {
    switch(metric) {
      case 'revenue': return `$${(member.totalRevenue / 1000).toFixed(0)}k`;
      case 'deals': return member.dealCount;
      case 'closed': return member.closedDeals;
      case 'winrate': return `${member.winRate}%`;
      default: return 0;
    }
  };

  const getMedalColor = (rank) => {
    if (rank === 0) return 'from-yellow-300 to-yellow-500';
    if (rank === 1) return 'from-gray-300 to-gray-400';
    if (rank === 2) return 'from-orange-300 to-orange-400';
    return 'from-gray-200 to-gray-300';
  };

  const getMedalIcon = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return rank + 4;
  };

  // Prepare chart data
  const chartData = teamMembers.map((member, idx) => ({
    name: member.repName.split(' ')[0],
    revenue: member.totalRevenue / 1000,
    deals: member.dealCount,
    closed: member.closedDeals,
    rank: idx + 1
  }));

  // Check if user has access
  if (userRole !== 'admin' && userRole !== 'team_leader') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Team Performance Leaderboard</p>
          <p className="text-gray-400 text-sm mt-1">Admin or Team Leader access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-xl">
              <Trophy className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Performance Leaderboard</h1>
              <p className="text-gray-500">Compare sales metrics across your team</p>
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
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf === 'month' ? 'Last Month' : tf === 'quarter' ? 'Last Quarter' : 'Last Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(metric => {
          const topRep = teamMembers[0];
          const MetricIcon = metric.icon;
          let topValue = '';

          if (metric.key === 'revenue') topValue = `$${(topRep?.totalRevenue / 1000 || 0).toFixed(0)}k`;
          else if (metric.key === 'deals') topValue = topRep?.dealCount || 0;
          else if (metric.key === 'closed') topValue = topRep?.closedDeals || 0;
          else if (metric.key === 'winrate') topValue = `${topRep?.winRate || 0}%`;

          return (
            <div key={metric.key} className={`bg-gradient-to-br ${metric.color} rounded-2xl shadow-xl p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold opacity-90">{metric.label}</span>
                <MetricIcon size={24} />
              </div>
              <p className="text-3xl font-bold">{topValue}</p>
              <p className="text-sm opacity-75 mt-2">Led by {topRep?.repName || 'Team'}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Rep</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue ($k)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deals Chart */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Total Deals by Rep</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deals" fill="#3b82f6" name="Total Deals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Leaderboard</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading team performance...</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No team data yet for this timeframe</p>
            <p className="text-gray-400 text-sm mt-2">Try selecting a different time period</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div
                key={member.repId}
                className={`bg-gradient-to-r ${getMedalColor(index)} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className="text-4xl font-bold opacity-75 min-w-[60px]">
                    {getMedalIcon(index)}
                  </div>

                  {/* Rep Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{member.repName}</h3>
                    <p className="text-sm opacity-90">{member.dealCount} total deals</p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-4 lg:gap-6">
                    <div className="text-center bg-white/20 rounded-lg p-3">
                      <p className="text-xs opacity-75 mb-1">Revenue</p>
                      <p className="text-lg font-bold">${(member.totalRevenue / 1000).toFixed(0)}k</p>
                    </div>

                    <div className="text-center bg-white/20 rounded-lg p-3">
                      <p className="text-xs opacity-75 mb-1">Avg Deal</p>
                      <p className="text-lg font-bold">${(member.avgDealValue / 1000).toFixed(1)}k</p>
                    </div>

                    <div className="text-center bg-white/20 rounded-lg p-3">
                      <p className="text-xs opacity-75 mb-1">Closed</p>
                      <p className="text-lg font-bold">{member.closedDeals}</p>
                    </div>

                    <div className="text-center bg-white/20 rounded-lg p-3">
                      <p className="text-xs opacity-75 mb-1">Win Rate</p>
                      <p className="text-lg font-bold">{member.winRate}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="hidden lg:block w-32">
                    <div className="bg-white/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full"
                        style={{ width: `${(member.totalRevenue / (teamMembers[0]?.totalRevenue || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Statistics</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-900">Rank</th>
                <th className="px-6 py-3 text-left font-bold text-gray-900">Rep Name</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Total Revenue</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Deals</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Closed</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Open</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Lost</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Avg Deal</th>
                <th className="px-6 py-3 text-right font-bold text-gray-900">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamMembers.map((member, index) => (
                <tr key={member.repId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">#{index + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{member.repName}</td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600">${(member.totalRevenue / 1000).toFixed(1)}k</td>
                  <td className="px-6 py-4 text-right text-gray-900">{member.dealCount}</td>
                  <td className="px-6 py-4 text-right font-semibold text-blue-600">{member.closedDeals}</td>
                  <td className="px-6 py-4 text-right text-gray-900">{member.openDeals}</td>
                  <td className="px-6 py-4 text-right text-red-600">{member.lostDeals}</td>
                  <td className="px-6 py-4 text-right text-gray-900">${(member.avgDealValue / 1000).toFixed(1)}k</td>
                  <td className="px-6 py-4 text-right font-bold text-yellow-600">{member.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}