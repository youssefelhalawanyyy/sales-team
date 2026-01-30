import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  limit,
  orderBy,
  QueryConstraint
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
  Download,
  Briefcase,
  FileText,
  Award,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';

const PerformancePage = () => {
  const { currentUser, userRole } = useAuth();

  const [selectedMember, setSelectedMember] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [memberProjects, setMemberProjects] = useState([]);
  const [memberTasks, setMemberTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  // Mobile detection
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

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
     LOAD MEMBER STATS - DEALS ONLY (FAST INITIAL LOAD)
  =============================== */

  useEffect(() => {
    if (!selectedMember) {
      setMemberStats(null);
      setMemberProjects([]);
      setMemberTasks([]);
      setProjectsLoaded(false);
      setTasksLoaded(false);
      return;
    }

    setStatsLoading(true);
    let unsubscribeDeal;

    try {
      // Only load deals initially for fast load
      const dealsQuery = query(
        collection(db, 'sales'),
        where('createdBy', '==', selectedMember.id)
      );

      unsubscribeDeal = onSnapshot(dealsQuery, (snapshot) => {
        const deals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const closedDeals = deals.filter(d => d.status === 'closed');
        const wonDeals = deals.filter(d => d.status === 'won' || d.status === 'closed');
        const receivedPaymentDeals = deals.filter(d => d.paymentReceived);
        const totalRevenue = receivedPaymentDeals.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0);

        setMemberStats(prev => ({
          ...prev,
          deals,
          statistics: {
            ...(prev?.statistics || {}),
            totalDeals: deals.length,
            closedDeals: closedDeals.length,
            wonDeals: wonDeals.length,
            dealsWithPayment: receivedPaymentDeals.length,
            totalRevenue,
            paymentReceiveRate: deals.length > 0 ? Math.round((receivedPaymentDeals.length / deals.length) * 100) : 0,
            conversionRate: deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0
          }
        }));
        setStatsLoading(false);
      });

      return () => {
        if (unsubscribeDeal) unsubscribeDeal();
      };
    } catch (err) {
      console.error('Error loading deals:', err);
      setStatsLoading(false);
    }
  }, [selectedMember]);

  /* ===============================
     LAZY LOAD PROJECTS (ON DEMAND)
  =============================== */

  useEffect(() => {
    if (!selectedMember || activeTab !== 'projects' || projectsLoaded) return;

    let unsubscribeProject;

    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('assignedTo', '==', selectedMember.id)
      );

      unsubscribeProject = onSnapshot(projectsQuery, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMemberProjects(projects);
        setProjectsLoaded(true);
      });

      return () => {
        if (unsubscribeProject) unsubscribeProject();
      };
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  }, [selectedMember, activeTab, projectsLoaded]);

  /* ===============================
     LAZY LOAD TASKS (ON DEMAND)
  =============================== */

  useEffect(() => {
    if (!selectedMember || activeTab !== 'tasks' || tasksLoaded) return;

    let unsubscribeTask;

    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('assignedTo', '==', selectedMember.id)
      );

      unsubscribeTask = onSnapshot(tasksQuery, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const approvedTasks = tasks.filter(t => t.status === 'approved');
        const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
        const overdueTasks = tasks.filter(t => {
          const deadline = t.deadline?.toDate ? t.deadline.toDate() : new Date(t.deadline);
          return new Date() > deadline && (t.status === 'pending' || t.status === 'in_progress');
        });

        setMemberTasks(tasks);
        setMemberStats(prev => ({
          ...prev,
          statistics: {
            ...prev?.statistics,
            totalTasks: tasks.length,
            approvedTasks: approvedTasks.length,
            pendingTasks: pendingTasks.length,
            overdueTasks: overdueTasks.length,
            taskCompletionRate: tasks.length > 0 ? Math.round((approvedTasks.length / tasks.length) * 100) : 0
          }
        }));
        setTasksLoaded(true);
      });

      return () => {
        if (unsubscribeTask) unsubscribeTask();
      };
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  }, [selectedMember, activeTab, tasksLoaded]);

  /* ===============================
     MEMOIZED FILTERED DEALS
  =============================== */

  const filteredDeals = useMemo(() => {
    return memberStats?.deals?.filter(deal => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'paid') return deal.paymentReceived;
      if (filterStatus === 'unpaid') return !deal.paymentReceived;
      return deal.status === filterStatus;
    }) || [];
  }, [memberStats?.deals, filterStatus]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-500/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 animate-bounce-subtle">
              <BarChart3 className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Performance Analytics
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base font-medium">
                Comprehensive insights into team performance and achievements
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl flex items-start shadow-lg animate-shake">
            <AlertCircle className="text-red-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm sm:text-base font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Sidebar - Team Members */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 p-4 sm:p-6 border border-white/20 sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <Users size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Team Members</h2>
              </div>

              {loading && !teamMembers.length ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <Clock className="text-blue-600 animate-spin" size={32} />
                  </div>
                  <p className="text-slate-600 mt-3 text-sm font-medium">Loading team...</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="text-slate-600 text-sm font-medium">No team members found</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  {teamMembers.map((member, index) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`w-full text-left px-4 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] animate-slide-in group ${
                        selectedMember?.id === member.id
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/40'
                          : 'bg-white/60 hover:bg-white/90 border border-slate-200 hover:border-blue-300 shadow-md hover:shadow-lg'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                          selectedMember?.id === member.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-sm truncate ${
                            selectedMember?.id === member.id ? 'text-white' : 'text-slate-800'
                          }`}>
                            {member.name}
                          </div>
                          <div className={`text-xs truncate ${
                            selectedMember?.id === member.id ? 'text-white/80' : 'text-slate-500'
                          }`}>
                            {member.email}
                          </div>
                          <div className={`text-xs mt-1 capitalize font-medium ${
                            selectedMember?.id === member.id ? 'text-white/70' : 'text-slate-400'
                          }`}>
                            {member.role.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Statistics */}
          <div className="lg:col-span-2">
            {!selectedMember ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 p-8 sm:p-16 text-center border border-white/20">
                <div className="animate-float">
                  <div className="inline-block p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/30 mb-6">
                    <Activity size={64} className="text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Select a Team Member</h3>
                <p className="text-slate-600 text-lg">Choose a member to view their detailed performance analytics</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Header Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 p-4 sm:p-6 border border-white/20 overflow-hidden relative animate-slide-up">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 rounded-full blur-3xl"></div>
                  
                  <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-blue-500/30 animate-bounce-subtle">
                        {selectedMember.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">{selectedMember.name}</h2>
                        <p className="text-slate-600 text-sm truncate font-medium">{selectedMember.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full capitalize">
                            {selectedMember.role.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleExportReport}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                      <Download size={18} strokeWidth={2.5} />
                      Export Report
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="relative flex gap-2 border-b-2 border-slate-200 mt-6 overflow-x-auto pb-2 custom-scrollbar-horizontal">
                    {['overview', 'deals', 'projects', 'tasks'].map((tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-5 py-3 font-bold text-sm transition-all duration-300 whitespace-nowrap rounded-t-xl ${
                          activeTab === tab
                            ? 'text-blue-600'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-slide-in"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {statsLoading && !memberStats ? (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/10 p-16 text-center border border-white/20">
                    <div className="inline-block animate-spin mb-4">
                      <Clock className="text-blue-600" size={48} />
                    </div>
                    <p className="text-slate-600 text-lg font-medium">Loading performance data...</p>
                  </div>
                ) : memberStats ? (
                  <>
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Deals Statistics */}
                        <div className="animate-fade-in">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                              <Target size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Deals Performance</h3>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {[
                              { label: 'Total Deals', value: memberStats.statistics.totalDeals, color: 'blue', icon: Target },
                              { label: 'Won Deals', value: memberStats.statistics.wonDeals, subtext: `${memberStats.statistics.conversionRate}% conv`, color: 'emerald', icon: CheckCircle },
                              { label: 'Paid Deals', value: memberStats.statistics.dealsWithPayment, subtext: `${memberStats.statistics.paymentReceiveRate}% paid`, color: 'purple', icon: DollarSign },
                              { label: 'Revenue', value: formatCurrency(memberStats.statistics.totalRevenue), color: 'green', icon: TrendingUp }
                            ].map((stat, index) => (
                              <div
                                key={stat.label}
                                className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl p-4 sm:p-5 border border-white/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-scale-in relative overflow-hidden"
                                style={{ animationDelay: `${index * 100}ms` }}
                              >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${stat.color}-600/10 to-${stat.color}-600/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 bg-gradient-to-br from-${stat.color}-600 to-${stat.color}-700 rounded-xl shadow-lg`}>
                                      <stat.icon size={16} className="text-white" />
                                    </div>
                                  </div>
                                  <div className="text-slate-600 text-xs sm:text-sm font-bold mb-2">{stat.label}</div>
                                  <div className={`text-2xl sm:text-3xl font-black bg-gradient-to-r from-${stat.color}-600 to-${stat.color}-700 bg-clip-text text-transparent mb-1 ${typeof stat.value === 'string' && stat.value.length > 8 ? 'text-xl' : ''}`}>
                                    {stat.value}
                                  </div>
                                  {stat.subtext && (
                                    <div className="text-xs text-slate-500 font-medium">{stat.subtext}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tasks Statistics */}
                        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl shadow-lg shadow-amber-500/30">
                              <Zap size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Tasks Performance</h3>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {[
                              { label: 'Total Tasks', value: memberStats.statistics.totalTasks, color: 'slate', icon: FileText },
                              { label: 'Approved', value: memberStats.statistics.approvedTasks, color: 'emerald', icon: CheckCircle },
                              { label: 'Pending', value: memberStats.statistics.pendingTasks, color: 'amber', icon: Clock },
                              { label: 'Overdue', value: memberStats.statistics.overdueTasks, color: 'red', icon: AlertCircle }
                            ].map((stat, index) => (
                              <div
                                key={stat.label}
                                className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl p-4 sm:p-5 border border-white/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-scale-in relative overflow-hidden"
                                style={{ animationDelay: `${(index + 4) * 100}ms` }}
                              >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${stat.color}-600/10 to-${stat.color}-600/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 bg-gradient-to-br from-${stat.color}-600 to-${stat.color}-700 rounded-xl shadow-lg`}>
                                      <stat.icon size={16} className="text-white" />
                                    </div>
                                  </div>
                                  <div className="text-slate-600 text-xs sm:text-sm font-bold mb-2">{stat.label}</div>
                                  <div className={`text-2xl sm:text-3xl font-black bg-gradient-to-r from-${stat.color}-600 to-${stat.color}-700 bg-clip-text text-transparent`}>
                                    {stat.value}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Completion Rate Card */}
                          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 sm:p-6 border border-white/20 mt-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                                  <PieChart size={20} className="text-white" />
                                </div>
                                <div className="text-slate-700 font-bold">Task Completion Rate</div>
                              </div>
                              <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {memberStats.statistics.taskCompletionRate}%
                              </span>
                            </div>
                            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full shadow-lg transition-all duration-1000 ease-out animate-progress"
                                style={{ width: `${memberStats.statistics.taskCompletionRate}%` }}
                              >
                                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Projects Summary */}
                        <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30">
                              <Briefcase size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Active Projects: {memberProjects.length}</h3>
                          </div>
                          {memberProjects.length === 0 ? (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-12 text-center border border-white/20">
                              <Briefcase className="mx-auto text-slate-300 mb-3" size={48} />
                              <p className="text-slate-600 font-medium">No projects assigned</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {memberProjects.slice(0, 4).map((project, index) => (
                                <div
                                  key={project.id}
                                  className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl p-5 border border-white/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-slide-in relative overflow-hidden"
                                  style={{ animationDelay: `${index * 100}ms` }}
                                >
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-600/10 to-purple-600/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                                  <div className="relative">
                                    <div className="flex items-start justify-between mb-3">
                                      <h4 className="font-bold text-slate-800 flex-1">{project.name}</h4>
                                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                        project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {project.status}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{project.description}</p>
                                    {project.progress !== undefined && (
                                      <div className="mt-3">
                                        <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                                          <span>Progress</span>
                                          <span className="font-bold">{project.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-500"
                                            style={{ width: `${project.progress}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DEALS TAB */}
                    {activeTab === 'deals' && (
                      <div className="animate-fade-in">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30">
                                <DollarSign size={20} className="text-white" />
                              </div>
                              <h3 className="text-xl font-bold text-slate-800">All Deals ({filteredDeals.length})</h3>
                            </div>
                            <select
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                              className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            >
                              <option value="all">All Deals</option>
                              <option value="paid">Paid</option>
                              <option value="unpaid">Unpaid</option>
                              <option value="closed">Closed</option>
                              <option value="won">Won</option>
                            </select>
                          </div>

                          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredDeals.length === 0 ? (
                              <div className="py-16 text-center">
                                <AlertCircle className="mx-auto text-slate-300 mb-3" size={48} />
                                <p className="text-slate-600 font-medium">No deals found</p>
                              </div>
                            ) : (
                              filteredDeals.map((deal, index) => (
                                <div
                                  key={deal.id}
                                  className="group bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm rounded-2xl border-2 border-slate-200 hover:border-blue-400 p-5 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slide-in"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 text-lg mb-1">{deal.businessName}</h4>
                                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full capitalize">
                                        {deal.status}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
                                        {formatCurrency(parseFloat(deal.price))}
                                      </div>
                                      <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${
                                        deal.paymentReceived 
                                          ? 'bg-emerald-100 text-emerald-700' 
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {deal.paymentReceived ? '✓ Paid' : '✗ Unpaid'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 font-medium">
                                    <span className="flex items-center gap-1">
                                      <Users size={14} />
                                      {deal.contactPerson}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      {formatDate(deal.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PROJECTS TAB */}
                    {activeTab === 'projects' && (
                      <div className="animate-fade-in">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30">
                              <Briefcase size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Projects ({memberProjects.length})</h3>
                          </div>
                          {memberProjects.length === 0 ? (
                            <div className="py-16 text-center">
                              <Briefcase className="mx-auto text-slate-300 mb-4" size={64} />
                              <p className="text-slate-600 text-lg font-medium">No projects assigned</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {memberProjects.map((project, index) => (
                                <div
                                  key={project.id}
                                  className="group bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border-2 border-white/50 hover:border-violet-400 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-scale-in relative overflow-hidden"
                                  style={{ animationDelay: `${index * 100}ms` }}
                                >
                                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-600/10 to-purple-600/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                                  <div className="relative">
                                    <div className="flex justify-between items-start mb-3">
                                      <h4 className="text-lg font-bold text-slate-800 flex-1 pr-2">{project.name}</h4>
                                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${
                                        project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {project.status}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4">{project.description}</p>
                                    {project.deadline && (
                                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium mb-3 bg-slate-100 rounded-lg px-3 py-2">
                                        <Calendar size={16} className="text-violet-600" />
                                        <span>Due: {formatDate(project.deadline)}</span>
                                      </div>
                                    )}
                                    {project.progress !== undefined && (
                                      <div>
                                        <div className="flex justify-between text-xs text-slate-600 font-bold mb-2">
                                          <span>Progress</span>
                                          <span className="text-violet-600">{project.progress}%</span>
                                        </div>
                                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                          <div
                                            className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-500 shadow-lg"
                                            style={{ width: `${project.progress}%` }}
                                          >
                                            <div className="h-full w-full animate-shimmer bg-white/20"></div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TASKS TAB */}
                    {activeTab === 'tasks' && (
                      <div className="animate-fade-in">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl shadow-lg shadow-amber-500/30">
                              <Zap size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Tasks ({memberTasks.length})</h3>
                          </div>
                          {memberTasks.length === 0 ? (
                            <div className="py-16 text-center">
                              <Zap className="mx-auto text-slate-300 mb-4" size={64} />
                              <p className="text-slate-600 text-lg font-medium">No tasks assigned</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                              {memberTasks.map((task, index) => (
                                <div
                                  key={task.id}
                                  className="group bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm rounded-2xl border-2 border-slate-200 hover:border-amber-400 p-5 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slide-in"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 text-lg mb-2">{task.title}</h4>
                                      <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${
                                      task.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                      task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      task.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                      task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                      {task.status}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm font-medium">
                                    <span className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                      <Target size={14} />
                                      <span className="capitalize">{task.priority}</span>
                                    </span>
                                    <span className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                      <Calendar size={14} />
                                      {formatDate(task.deadline)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes progress {
          from {
            width: 0;
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-progress {
          animation: progress 1.5s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
          transition: all 0.3s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }

        .custom-scrollbar-horizontal::-webkit-scrollbar {
          height: 6px;
        }

        .custom-scrollbar-horizontal::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #3b82f6, #6366f1);
          border-radius: 10px;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PerformancePage;