import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Download, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import { formatPDFDate } from '../utils/reportGenerator';

export const SalesReportsPage = () => {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('individual');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
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

  const downloadPDF = () => {
    if (!reportRef.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    
    script.onload = () => {
      const reportName = reportType === 'individual' 
        ? `sales-report-${users.find(u => u.id === selectedUser)?.firstName || 'user'}`
        : `team-report-${teams.find(t => t.id === selectedTeam)?.name || 'team'}`;

      const opt = {
        margin: 10,
        filename: `${reportName}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };
      
      window.html2pdf().set(opt).from(reportRef.current).save();
    };
    
    document.head.appendChild(script);
  };

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">You don't have access to Sales Reports.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
        <button
          onClick={downloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="individual">Individual Sales Rep</option>
              <option value="team">By Team</option>
              <option value="all">All Sales</option>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a sales rep</option>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="bg-white rounded-lg shadow-md p-8">
        {/* Report Header */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {reportType === 'individual' && `Sales Report - ${users.find(u => u.id === selectedUser)?.firstName} ${users.find(u => u.id === selectedUser)?.lastName}`}
            {reportType === 'team' && `Team Report - ${teams.find(t => t.id === selectedTeam)?.name}`}
            {reportType === 'all' && 'Company-Wide Sales Report'}
          </h2>
          <p className="text-gray-600">
            Period: {formatPDFDate(dateRange.start)} to {formatPDFDate(dateRange.end)}
          </p>
          <p className="text-gray-500 text-sm">Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Total Deals</p>
            <p className="text-2xl font-bold text-blue-700">{filteredDeals.length}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Closed Deals</p>
            <p className="text-2xl font-bold text-green-700">{closedDeals.length}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Open Deals</p>
            <p className="text-2xl font-bold text-purple-700">{openDeals.length}</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">Lost Deals</p>
            <p className="text-2xl font-bold text-red-700">{lostDeals.length}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-700">Total Deal Value</p>
                <p className="font-semibold text-green-700">{formatCurrency(totalDealValue)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-700">Total Commission (20%)</p>
                <p className="font-semibold text-green-700">{formatCurrency(totalCommission)}</p>
              </div>
              <div className="border-t border-green-300 pt-3 flex justify-between font-semibold">
                <p className="text-gray-900">Average Deal Value</p>
                <p className="text-green-700">
                  {formatCurrency(closedDeals.length > 0 ? totalDealValue / closedDeals.length : 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-700">Success Rate</p>
                <p className="font-semibold text-blue-700">
                  {filteredDeals.length > 0 ? ((closedDeals.length / filteredDeals.length) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-700">Deals in Progress</p>
                <p className="font-semibold text-blue-700">{openDeals.length}</p>
              </div>
              <div className="border-t border-blue-300 pt-3 flex justify-between font-semibold">
                <p className="text-gray-900">Win/Loss Ratio</p>
                <p className="text-blue-700">
                  {lostDeals.length > 0 ? (closedDeals.length / lostDeals.length).toFixed(2) : closedDeals.length}:1
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deals by Status */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Deals Breakdown</h3>
          
          {closedDeals.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-green-700">Closed Deals ({closedDeals.length})</h4>
              <div className="space-y-2">
                {closedDeals.map((deal, idx) => (
                  <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{deal.businessName}</p>
                        <p className="text-xs text-gray-600">{deal.contactPerson} • {formatPDFDate(deal.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-700">{formatCurrency(deal.price || 0)}</p>
                        <p className="text-xs text-gray-600">Commission: {formatCurrency((deal.price || 0) * 0.2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {openDeals.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-blue-700">Open Deals ({openDeals.length})</h4>
              <div className="space-y-2">
                {openDeals.map((deal, idx) => (
                  <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{deal.businessName}</p>
                        <p className="text-xs text-gray-600">{deal.contactPerson} • {deal.status}</p>
                      </div>
                      <p className="text-xs font-semibold text-blue-700">{formatPDFDate(deal.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lostDeals.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-red-700">Lost Deals ({lostDeals.length})</h4>
              <div className="space-y-2">
                {lostDeals.map((deal, idx) => (
                  <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{deal.businessName}</p>
                        <p className="text-xs text-gray-600">{deal.contactPerson}</p>
                      </div>
                      <p className="text-xs text-red-700">{formatPDFDate(deal.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDeals.length === 0 && (
            <p className="text-gray-500 text-center py-8">No deals found for selected filters</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          <p>This report was automatically generated on {new Date().toLocaleString()}</p>
          <p>For questions or discrepancies, please contact your manager.</p>
        </div>
      </div>
    </div>
  );
};
