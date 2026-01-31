import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Phone,
  BarChart3,
  Filter,
  Search,
  Activity
} from 'lucide-react';

export default function ClientHealthScoringPage() {
  const { currentUser, userRole } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHealth, setFilterHealth] = useState('all'); // all, healthy, at-risk, critical

  useEffect(() => {
    loadClientsWithHealthScore();
  }, [currentUser, userRole]);

  async function loadClientsWithHealthScore() {
    try {
      setLoading(true);

      // Get all deals
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

      // Group deals by client and calculate health scores
      const clientMap = {};

      deals.forEach(deal => {
        const clientName = deal.clientName || deal.businessName || 'Unknown';
        if (!clientMap[clientName]) {
          clientMap[clientName] = {
            name: clientName,
            email: deal.email,
            phone: deal.phone,
            deals: [],
            revenue: 0,
            openDeals: 0,
            closedDeals: 0,
            lastContact: null
          };
        }

        clientMap[clientName].deals.push(deal);
        clientMap[clientName].revenue += deal.amount || 0;
        if (deal.stage === 'closed' || deal.status === 'closed') {
          clientMap[clientName].closedDeals += 1;
        } else {
          clientMap[clientName].openDeals += 1;
        }

        // Track last contact
        const dealDate = deal.createdAt?.toDate?.() || new Date();
        if (!clientMap[clientName].lastContact || dealDate > clientMap[clientName].lastContact) {
          clientMap[clientName].lastContact = dealDate;
        }
      });

      // Calculate health scores
      const clientsWithScores = Object.values(clientMap).map(client => {
        let score = 50; // Base score

        // Factor 1: Deal volume (0-15 points)
        const dealCount = client.deals.length;
        if (dealCount >= 5) score += 15;
        else if (dealCount >= 3) score += 10;
        else if (dealCount >= 1) score += 5;

        // Factor 2: Revenue (0-15 points)
        if (client.revenue >= 100000) score += 15;
        else if (client.revenue >= 50000) score += 10;
        else if (client.revenue >= 10000) score += 5;

        // Factor 3: Close rate (0-15 points)
        const closeRate = client.deals.length > 0 ? (client.closedDeals / client.deals.length) : 0;
        if (closeRate >= 0.7) score += 15;
        else if (closeRate >= 0.5) score += 10;
        else if (closeRate > 0) score += 5;

        // Factor 4: Recent activity (0-15 points)
        const daysSinceContact = client.lastContact ? 
          Math.floor((Date.now() - client.lastContact.getTime()) / (1000 * 60 * 60 * 24)) : 
          999;
        
        if (daysSinceContact <= 7) score += 15;
        else if (daysSinceContact <= 30) score += 10;
        else if (daysSinceContact <= 90) score += 5;
        else score -= 10; // Penalty for inactive clients

        // Factor 5: Active deals (0-15 points)
        if (client.openDeals >= 3) score += 15;
        else if (client.openDeals >= 2) score += 10;
        else if (client.openDeals >= 1) score += 5;

        // Determine health status
        let status = 'healthy';
        if (score >= 80) status = 'healthy';
        else if (score >= 60) status = 'normal';
        else if (score >= 40) status = 'at-risk';
        else status = 'critical';

        return {
          ...client,
          score: Math.min(100, Math.max(0, score)),
          status,
          daysSinceContact,
          closeRate: Math.round(closeRate * 100)
        };
      });

      // Sort by score
      clientsWithScores.sort((a, b) => b.score - a.score);
      setClients(clientsWithScores);
    } catch (e) {
      console.error('Error loading client health scores:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(search.toLowerCase()) ||
                         client.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterHealth === 'all' || client.status === filterHealth;
    return matchesSearch && matchesFilter;
  });

  const getHealthColor = (status) => {
    switch(status) {
      case 'healthy': return 'from-green-50 to-green-100 border-green-300 text-green-900';
      case 'normal': return 'from-blue-50 to-blue-100 border-blue-300 text-blue-900';
      case 'at-risk': return 'from-yellow-50 to-yellow-100 border-yellow-300 text-yellow-900';
      case 'critical': return 'from-red-50 to-red-100 border-red-300 text-red-900';
      default: return 'from-gray-50 to-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getHealthIcon = (status) => {
    switch(status) {
      case 'healthy': return <Heart size={20} className="text-green-600" />;
      case 'normal': return <Activity size={20} className="text-blue-600" />;
      case 'at-risk': return <AlertCircle size={20} className="text-yellow-600" />;
      case 'critical': return <TrendingDown size={20} className="text-red-600" />;
      default: return <Heart size={20} className="text-gray-600" />;
    }
  };

  const stats = {
    total: clients.length,
    healthy: clients.filter(c => c.status === 'healthy').length,
    atRisk: clients.filter(c => c.status === 'at-risk').length,
    critical: clients.filter(c => c.status === 'critical').length,
    avgScore: clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + c.score, 0) / clients.length) : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl">
            <Heart className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Health Scoring</h1>
            <p className="text-gray-500">Monitor client engagement and satisfaction</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-1">Total Clients</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <p className="text-xs text-green-700 font-medium mb-1">Healthy</p>
            <p className="text-2xl font-bold text-green-900">{stats.healthy}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">Normal</p>
            <p className="text-2xl font-bold text-blue-900">{clients.filter(c => c.status === 'normal').length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
            <p className="text-xs text-yellow-700 font-medium mb-1">At Risk</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.atRisk}</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
            <p className="text-xs text-red-700 font-medium mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-900">{stats.critical}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'healthy', 'normal', 'at-risk', 'critical'].map(status => (
              <button
                key={status}
                onClick={() => setFilterHealth(status)}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  filterHealth === status
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Calculating health scores...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No clients found</p>
            <p className="text-gray-400 text-sm mt-1">Create deals to start tracking client health</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div
              key={client.name}
              className={`bg-gradient-to-r ${getHealthColor(client.status)} rounded-2xl shadow-xl border-2 p-6 hover:shadow-2xl transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {getHealthIcon(client.status)}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{client.name}</h3>
                    <div className="flex flex-col lg:flex-row gap-3 text-sm mt-2">
                      {client.email && (
                        <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:underline">
                          📧 {client.email}
                        </a>
                      )}
                      {client.phone && (
                        <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:underline">
                          📞 {client.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-4xl font-bold">{client.score}</div>
                  <p className="text-sm font-semibold opacity-75">/ 100</p>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-xs opacity-75 mb-1">Total Deals</p>
                  <p className="text-xl font-bold">{client.deals.length}</p>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-xs opacity-75 mb-1">Revenue</p>
                  <p className="text-lg font-bold">${(client.revenue / 1000).toFixed(0)}k</p>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-xs opacity-75 mb-1">Close Rate</p>
                  <p className="text-lg font-bold">{client.closeRate}%</p>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-xs opacity-75 mb-1">Open Deals</p>
                  <p className="text-lg font-bold">{client.openDeals}</p>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-xs opacity-75 mb-1">Last Contact</p>
                  <p className="text-lg font-bold">{client.daysSinceContact}d ago</p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="mt-4 pt-4 border-t border-white/30">
                <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      client.status === 'healthy' ? 'bg-green-600' :
                      client.status === 'normal' ? 'bg-blue-600' :
                      client.status === 'at-risk' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${client.score}%` }}
                  ></div>
                </div>
              </div>

              {/* Recommendations */}
              {client.status !== 'healthy' && (
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="text-sm font-semibold mb-2">💡 Recommendation:</p>
                  <ul className="text-sm space-y-1 opacity-90">
                    {client.daysSinceContact > 30 && (
                      <li>✓ Reach out soon - haven't heard from them in {client.daysSinceContact} days</li>
                    )}
                    {client.openDeals === 0 && (
                      <li>✓ Create new opportunities with this client</li>
                    )}
                    {client.closeRate < 50 && client.closeRate > 0 && (
                      <li>✓ Focus on deal closing - current close rate is {client.closeRate}%</li>
                    )}
                    {client.revenue < 10000 && client.deals.length > 0 && (
                      <li>✓ Look for upsell opportunities to increase revenue</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
