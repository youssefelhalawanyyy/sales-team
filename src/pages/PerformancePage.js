import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import {
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Target,
  Zap,
  Calendar,
  Download
} from 'lucide-react';

const PerformancePage = () => {
  const { currentUser, userRole } = useAuth();

  const [selectedMember, setSelectedMember] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  /* ===============================
     LOAD TEAM MEMBERS
  =============================== */

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        setError('');

        let members = [];

        if (userRole === 'admin') {
          // Admin can see all users
          const q = query(
            collection(db, 'users'),
            where('role', '!=', 'admin')
          );
          const snapshot = await getDocs(q);
          members = snapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            name: doc.data().name || doc.data().email,
            role: doc.data().role
          }));
        } else if (userRole === 'team_leader') {
          // Team leader can see only their team
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();

          if (userData && userData.teamMembers) {
            const memberDocs = await Promise.all(
              userData.teamMembers.map(memberId =>
                getDoc(doc(db, 'users', memberId))
              )
            );

            members = memberDocs
              .filter(snap => snap.exists())
              .map(snap => ({
                id: snap.id,
                email: snap.data().email,
                name: snap.data().name || snap.data().email,
                role: snap.data().role
              }));
          }
        }

        setTeamMembers(members);
      } catch (err) {
        console.error('Error loading team members:', err);
        setError('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, [currentUser, userRole]);

  /* ===============================
     LOAD MEMBER STATS
  =============================== */

  useEffect(() => {
    const loadMemberStats = async () => {
      if (!selectedMember) return;

      try {
        setLoading(true);
        setError('');

        // Get all deals for the member
        const dealsQuery = query(
          collection(db, 'deals'),
          where('assignedTo', '==', selectedMember.id)
        );
        const dealsSnapshot = await getDocs(dealsQuery);
        const deals = dealsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get all tasks for the member
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('assignedTo', '==', selectedMember.id)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasks = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate statistics
        const closedDeals = deals.filter(d => d.status === 'closed');
        const wonDeals = deals.filter(d => d.status === 'won');
        const receivedPaymentDeals = deals.filter(d => d.paymentReceived);
        const totalRevenue = receivedPaymentDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

        const approvedTasks = tasks.filter(t => t.status === 'approved');
        const completedTasks = tasks.filter(t => t.status === 'approved' && t.paymentReceived);
        const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

        setMemberStats({
          deals,
          tasks,
          statistics: {
            totalDeals: deals.length,
            closedDeals: closedDeals.length,
            wonDeals: wonDeals.length,
            dealsWithPayment: receivedPaymentDeals.length,
            totalRevenue,
            approvedTasks: approvedTasks.length,
            completedTasks: completedTasks.length,
            pendingTasks: pendingTasks.length,
            totalTasks: tasks.length,
            taskCompletionRate: tasks.length > 0 ? Math.round((approvedTasks.length / tasks.length) * 100) : 0
          }
        });
      } catch (err) {
        console.error('Error loading member stats:', err);
        setError('Failed to load member statistics');
      } finally {
        setLoading(false);
      }
    };

    loadMemberStats();
  }, [selectedMember]);

  /* ===============================
     FILTER DEALS
  =============================== */

  const filteredDeals = memberStats?.deals?.filter(deal => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'paid') return deal.paymentReceived;
    if (filterStatus === 'unpaid') return !deal.paymentReceived;
    return deal.status === filterStatus;
  }) || [];

  /* ===============================
     EXPORT REPORT
  =============================== */

  const handleExportReport = () => {
    if (!selectedMember || !memberStats) return;

    const stats = memberStats.statistics;
    const reportData = `
PERFORMANCE REPORT
==================
Member: ${selectedMember.name} (${selectedMember.email})
Role: ${selectedMember.role}
Generated: ${new Date().toLocaleString()}

DEALS SUMMARY
=============
Total Deals: ${stats.totalDeals}
Closed Deals: ${stats.closedDeals}
Won Deals: ${stats.wonDeals}
Deals with Payment Received: ${stats.dealsWithPayment}
Total Revenue: $${stats.totalRevenue.toFixed(2)}
Payment Received Rate: ${stats.totalDeals > 0 ? Math.round((stats.dealsWithPayment / stats.totalDeals) * 100) : 0}%

TASKS SUMMARY
=============
Total Tasks: ${stats.totalTasks}
Approved Tasks: ${stats.approvedTasks}
Pending Tasks: ${stats.pendingTasks}
Task Completion Rate: ${stats.taskCompletionRate}%

DEALS DETAILS
=============
${filteredDeals.map(deal => `
Deal: ${deal.title}
Value: $${parseFloat(deal.value).toFixed(2)}
Status: ${deal.status}
Payment Received: ${deal.paymentReceived ? 'Yes' : 'No'}
Created: ${new Date(deal.createdAt?.toDate ? deal.createdAt.toDate() : deal.createdAt).toLocaleDateString()}
`).join('')}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportData));
    element.setAttribute('download', `performance_report_${selectedMember.name}_${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Performance & Analytics</h1>
          <p className="text-gray-600 mt-1">View team member performance, deals, and tasks</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="text-red-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Team Members */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users size={20} className="mr-2" />
                Team Members
              </h2>

              {loading && !teamMembers.length ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                  <p className="text-gray-600 mt-2 text-sm">Loading...</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="text-gray-600 text-sm">No team members found</p>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition ${selectedMember?.id === member.id
                        ? 'bg-blue-100 border-2 border-blue-600'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      <div className="font-medium text-gray-900 text-sm">{member.name}</div>
                      <div className="text-xs text-gray-600">{member.email}</div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">{member.role}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Statistics */}
          <div className="lg:col-span-2">
            {!selectedMember ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">Select a team member to view their performance</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                      <p className="text-gray-600">{selectedMember.email}</p>
                      <p className="text-sm text-gray-500 mt-1 capitalize">Role: {selectedMember.role}</p>
                    </div>
                    <button
                      onClick={handleExportReport}
                      className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <Download size={18} className="mr-2" />
                      Export Report
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="inline-block animate-spin">
                      <Clock className="text-blue-600" size={32} />
                    </div>
                    <p className="text-gray-600 mt-4">Loading performance data...</p>
                  </div>
                ) : memberStats ? (
                  <>
                    {/* Deals Statistics */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target size={20} className="mr-2" />
                        Deals Performance
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg shadow-md p-4">
                          <div className="text-gray-600 text-sm font-medium">Total Deals</div>
                          <div className="text-3xl font-bold text-gray-900 mt-2">{memberStats.statistics.totalDeals}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4">
                          <div className="text-gray-600 text-sm font-medium">Closed</div>
                          <div className="text-3xl font-bold text-blue-600 mt-2">{memberStats.statistics.closedDeals}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4">
                          <div className="text-gray-600 text-sm font-medium">Won</div>
                          <div className="text-3xl font-bold text-green-600 mt-2">{memberStats.statistics.wonDeals}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4">
                          <div className="text-gray-600 text-sm font-medium">Paid Deals</div>
                          <div className="text-3xl font-bold text-purple-600 mt-2">{memberStats.statistics.dealsWithPayment}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4 md:col-span-2">
                          <div className="text-gray-600 text-sm font-medium">Total Revenue</div>
                          <div className="text-3xl font-bold text-green-700 mt-2">{formatCurrency(memberStats.statistics.totalRevenue)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Tasks Statistics */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Zap size={20} className="mr-2" />
                        Tasks Performance
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg shadow-md p-4">
                          <div className="text-gray-600 text-sm font-medium">Total Tasks</div>
                          <div className="text-3xl font-bold text-gray-900 mt-2">{memberStats.statistics.totalTasks}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4">
                          <div className="text-gray-600 text-sm font-medium">Approved</div>
                          <div className="text-3xl font-bold text-green-600 mt-2">{memberStats.statistics.approvedTasks}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4">
                          <div className="text-gray-600 text-sm font-medium">Pending</div>
                          <div className="text-3xl font-bold text-yellow-600 mt-2">{memberStats.statistics.pendingTasks}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4 md:col-span-3">
                          <div className="text-gray-600 text-sm font-medium">Completion Rate</div>
                          <div className="mt-2">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${memberStats.statistics.taskCompletionRate}%` }}
                                ></div>
                              </div>
                              <span className="text-xl font-bold text-gray-900">{memberStats.statistics.taskCompletionRate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deals List */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <DollarSign size={20} className="mr-2" />
                          All Deals
                        </h3>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="all">All Deals</option>
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                          <option value="closed">Closed</option>
                          <option value="won">Won</option>
                        </select>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredDeals.length === 0 ? (
                          <div className="bg-white rounded-lg p-8 text-center">
                            <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-gray-600">No deals found</p>
                          </div>
                        ) : (
                          filteredDeals.map(deal => (
                            <div key={deal.id} className="bg-white rounded-lg border border-gray-200 p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{deal.title}</h4>
                                  <p className="text-sm text-gray-600">{deal.clientName}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">{formatCurrency(parseFloat(deal.value))}</div>
                                  <span className={`inline-block text-xs font-medium mt-1 px-2 py-1 rounded ${deal.paymentReceived ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {deal.paymentReceived ? '✓ Paid' : '✗ Unpaid'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Status: <span className="font-medium capitalize">{deal.status}</span></span>
                                <span>{formatDate(deal.createdAt)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
