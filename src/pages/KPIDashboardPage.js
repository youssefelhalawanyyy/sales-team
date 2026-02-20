import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Zap,
  Calendar,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function KPIDashboardPage() {
  const { currentUser, userRole } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [dateRange, setDateRange] = useState('month');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [loading, setLoading] = useState(true);

  const platforms = ['Meta', 'Google', 'TikTok', 'LinkedIn'];

  useEffect(() => {
    if (currentUser?.uid) {
      fetchCampaigns();
    }
  }, [currentUser, userRole]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      let q;

      if (userRole === 'admin' || userRole === 'finance_manager') {
        q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db, 'campaigns'),
          where('createdBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    let filtered = campaigns;

    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(c => c.platform === selectedPlatform);
    }

    const totalSpend = filtered.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
    const totalRevenue = filtered.reduce((sum, c) => {
      const roas = c.performanceMetrics?.roas || 0;
      return sum + (Number(c.budget) || 0) * roas;
    }, 0);
    const avgROAS = filtered.length > 0
      ? filtered.reduce((sum, c) => sum + (c.performanceMetrics?.roas || 0), 0) / filtered.length
      : 0;

    const totalConversions = filtered.reduce((sum, c) => sum + (c.performanceMetrics?.conversions || 0), 0);
    const totalLeads = filtered.reduce((sum, c) => sum + (Number(c.budget) || 0), 0); // Placeholder
    
    const avgCPL = totalLeads > 0
      ? totalSpend / totalLeads
      : 0;

    const avgCPA = totalConversions > 0
      ? totalSpend / totalConversions
      : 0;

    const conversionRate = filtered.reduce((sum, c) => {
      const rate = c.performanceMetrics?.conversions || 0;
      return sum + rate;
    }, 0) / Math.max(filtered.length, 1);

    const totalImpressions = filtered.reduce((sum, c) => sum + (c.performanceMetrics?.impressions || 0), 0);
    const avgCPM = totalImpressions > 0
      ? (totalSpend / totalImpressions) * 1000
      : 0;

    return {
      totalSpend,
      totalRevenue,
      avgROAS,
      conversionRate,
      totalConversions,
      avgCPA,
      avgCPL,
      avgCPM,
      totalImpressions,
      totalCampaigns: filtered.length
    };
  }, [campaigns, selectedPlatform]);

  // Platform breakdown
  const platformBreakdown = useMemo(() => {
    const breakdown = {};
    platforms.forEach(platform => {
      const platformCampaigns = campaigns.filter(c => c.platform === platform);
      breakdown[platform] = {
        campaigns: platformCampaigns.length,
        spend: platformCampaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0),
        roas: platformCampaigns.length > 0
          ? platformCampaigns.reduce((sum, c) => sum + (c.performanceMetrics?.roas || 0), 0) / platformCampaigns.length
          : 0
      };
    });
    return breakdown;
  }, [campaigns]);

  const StatCard = ({ title, value, icon: Icon, color, suffix = '', decimals = 0 }) => {
    const colorClasses = {
      purple: 'from-purple-500 to-purple-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-600 text-sm font-semibold mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {typeof value === 'number'
                ? (value >= 1000000 ? (value / 1000000).toFixed(decimals) + 'M' : value >= 1000 ? (value / 1000).toFixed(decimals) + 'K' : value.toFixed(decimals))
                : value}
              <span className="text-lg text-gray-600 ml-1">{suffix}</span>
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg shadow-${color}-500/30`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Performance Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Real-time KPI tracking and analytics</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white font-semibold text-gray-700"
        >
          <option value="all">All Platforms</option>
          {platforms.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white font-semibold text-gray-700"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* MAIN KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Ad Spend"
          value={kpis.totalSpend}
          icon={DollarSign}
          color="purple"
          suffix="EGP"
          decimals={0}
        />
        <StatCard
          title="Total Revenue"
          value={kpis.totalRevenue}
          icon={TrendingUp}
          color="green"
          suffix="EGP"
          decimals={0}
        />
        <StatCard
          title="Average ROAS"
          value={kpis.avgROAS}
          icon={Target}
          color="blue"
          suffix="x"
          decimals={2}
        />
        <StatCard
          title="Conversion Rate"
          value={kpis.conversionRate}
          icon={Zap}
          color="orange"
          suffix="%"
          decimals={1}
        />
      </div>

      {/* SECONDARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Conversions"
          value={kpis.totalConversions}
          icon={Users}
          color="pink"
          decimals={0}
        />
        <StatCard
          title="Cost Per Acquisition"
          value={kpis.avgCPA}
          icon={DollarSign}
          color="indigo"
          suffix="EGP"
          decimals={2}
        />
        <StatCard
          title="Cost Per Lead"
          value={kpis.avgCPL}
          icon={Target}
          color="blue"
          suffix="EGP"
          decimals={2}
        />
        <StatCard
          title="Cost Per Thousand Impressions"
          value={kpis.avgCPM}
          icon={BarChart3}
          color="purple"
          suffix="EGP"
          decimals={2}
        />
      </div>

      {/* PLATFORM BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Platform Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Campaigns</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Spend</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Avg ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {platforms.map(platform => (
                  <tr key={platform} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg">
                        {platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {platformBreakdown[platform]?.campaigns || 0}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {platformBreakdown[platform]?.spend?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 0} EGP
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">
                        {(platformBreakdown[platform]?.roas || 0).toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Campaign Summary */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Summary</h2>

          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <p className="text-xs text-blue-600 font-semibold mb-1">ACTIVE CAMPAIGNS</p>
              <p className="text-2xl font-bold text-blue-900">
                {campaigns.filter(c => c.status === 'Active').length}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <p className="text-xs text-green-600 font-semibold mb-1">TOTAL IMPRESSIONS</p>
              <p className="text-2xl font-bold text-green-900">
                {kpis.totalImpressions.toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <p className="text-xs text-purple-600 font-semibold mb-1">AVG SPEND PER CAMPAIGN</p>
              <p className="text-2xl font-bold text-purple-900">
                {kpis.totalCampaigns > 0 ? (kpis.totalSpend / kpis.totalCampaigns).toFixed(0) : 0} EGP
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
              <p className="text-xs text-orange-600 font-semibold mb-1">PROFIT MARGIN</p>
              <p className="text-2xl font-bold text-orange-900">
                {kpis.totalSpend > 0 ? (((kpis.totalRevenue - kpis.totalSpend) / kpis.totalRevenue) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MONTH VS MONTH COMPARISON */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Trend</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-blue-600 font-semibold mb-2">SPEND TREND</p>
            <p className="text-3xl font-bold text-blue-900">{(kpis.totalSpend / campaigns.length).toFixed(0)} EGP</p>
            <p className="text-xs text-blue-600 mt-2">Avg per campaign</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-green-600 font-semibold mb-2">REVENUE TREND</p>
            <p className="text-3xl font-bold text-green-900">{(kpis.totalRevenue / campaigns.length).toFixed(0)} EGP</p>
            <p className="text-xs text-green-600 mt-2">Avg per campaign</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-purple-600 font-semibold mb-2">ROI</p>
            <p className="text-3xl font-bold text-purple-900">{kpis.totalSpend > 0 ? (((kpis.totalRevenue - kpis.totalSpend) / kpis.totalSpend) * 100).toFixed(1) : 0}%</p>
            <p className="text-xs text-purple-600 mt-2">Overall return on investment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
