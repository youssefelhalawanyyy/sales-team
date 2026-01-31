import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TasksContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { MemberCommissionView } from '../components/MemberCommissionView';

import {
  Users,
  DollarSign,
  Briefcase,
  Award,
  CalendarDays,
  TrendingUp,
  Star,
  Trophy,
  Flame,
  Target,
  Sparkles,
  Activity,
  Zap,
  Crown,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  UserCheck,
  ListChecks,
  Calendar
} from 'lucide-react';

import { formatCurrency } from '../utils/currency';

export const Dashboard = () => {
  const { currentUser, userRole } = useAuth();

  const [stats, setStats] = useState({
    totalDeals: 0,
    totalIncome: 0,
    activeUsers: 0,
    myDeals: 0,
    myIncome: 0,
    closedDeals: 0,
    pendingDeals: 0,
    myActiveDeals: 0
  });

  const [joinedDate, setJoinedDate] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const { getAssignedTasks } = useTasks();
  const navigate = useNavigate();


  /* ===================================
     FETCH DATA
  =================================== */

  useEffect(() => {
    fetchDashboardData();
    fetchMyTasks();
  }, [userRole, currentUser?.uid]);

  const fetchMyTasks = useCallback(async () => {
    try {
      const tasks = await getAssignedTasks();
      const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
      setMyTasks(pending.slice(0, 3));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [getAssignedTasks]);


  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel for better performance
      const [usersSnap, salesSnap, financeSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'sales')),
        userRole === 'admin' ? getDocs(collection(db, 'finances')) : Promise.resolve(null)
      ]);

      let totalDeals = 0;
      let totalIncome = 0;
      let activeUsers = 0;
      let myDeals = 0;
      let myIncome = 0;
      let userClosedDeals = 0;
      let closedDeals = 0;
      let pendingDeals = 0;
      let myActiveDeals = 0;

      /* Process USERS */
      activeUsers = usersSnap.docs.length;
      const me = usersSnap.docs.find(doc => doc.data().uid === currentUser?.uid);

      if (me?.data()?.createdAt) {
        const created = me.data().createdAt;
        if (created.seconds) {
          setJoinedDate(new Date(created.seconds * 1000));
        } else {
          setJoinedDate(new Date(created));
        }
      }

      /* Process DEALS */
      totalDeals = salesSnap.docs.length;
      salesSnap.docs.forEach((doc) => {
        const data = doc.data();

        if (data.createdBy === currentUser?.uid) {
          myDeals++;
          if (data.status === 'closed') {
            userClosedDeals++;
          }
          if (data.status === 'pending_approval' || data.status === 'in_progress') {
            myActiveDeals++;
          }
        }

        if (data.status === 'closed') {
          closedDeals++;
        }

        if (data.status === 'pending_approval' || data.status === 'in_progress') {
          pendingDeals++;
        }
      });

      /* Process FINANCE (ADMIN ONLY) */
      if (userRole === 'admin' && financeSnap) {
        financeSnap.docs.forEach((doc) => {
          const data = doc.data();
          const amount = data.amount || 0;
          totalIncome += amount;
        });
      }

      const newStats = {
        totalDeals,
        totalIncome,
        activeUsers,
        myDeals,
        myIncome,
        closedDeals: userClosedDeals,
        pendingDeals,
        myActiveDeals
      };

      setStats(newStats);
      calculateAchievements(newStats, userClosedDeals);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [userRole, currentUser?.uid]);


  /* ===================================
     ACHIEVEMENTS LOGIC
  =================================== */

  const calculateAchievements = (data, userClosedDeals) => {

    const list = [];


    /* ---- Deals ---- */

    if (userClosedDeals >= 5) {
      list.push({
        title: 'Rising Seller',
        desc: 'Closed 5+ deals',
        icon: Target,
        color: 'from-blue-500 to-cyan-500'
      });
    }

    if (userClosedDeals >= 15) {
      list.push({
        title: 'Deal Maker',
        desc: 'Closed 15+ deals',
        icon: Trophy,
        color: 'from-purple-500 to-pink-500'
      });
    }

    if (userClosedDeals >= 30) {
      list.push({
        title: 'Master Closer',
        desc: 'Closed 30+ deals',
        icon: Flame,
        color: 'from-orange-500 to-red-500'
      });
    }


    /* ---- Loyalty ---- */

    if (joinedDate) {
      const months = getMonthsWorked();

      if (months >= 3) {
        list.push({
          title: 'Consistent',
          desc: 'Active for 3+ months',
          icon: CalendarDays,
          color: 'from-indigo-500 to-blue-500'
        });
      }

      if (months >= 12) {
        list.push({
          title: 'Loyal Member',
          desc: 'Active for 1+ year',
          icon: Award,
          color: 'from-amber-500 to-yellow-500'
        });
      }
    }


    /* ---- Rank ---- */

    if (data.myDeals >= 20) {
      list.push({
        title: 'Top Performer',
        desc: '20+ personal deals',
        icon: Star,
        color: 'from-pink-500 to-rose-500'
      });
    }


    setAchievements(list);
  };


  /* ===================================
     HELPERS
  =================================== */

  const getMonthsWorked = () => {
    if (!joinedDate) return 0;

    const now = new Date();
    const diff = now - joinedDate;

    return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  };


  const getWorkDuration = () => {
    if (!joinedDate) return '—';

    const months = getMonthsWorked();
    const years = Math.floor(months / 12);

    if (years > 0) return `${years} year(s)`;
    if (months > 0) return `${months} month(s)`;

    const days = Math.floor(
      (new Date() - joinedDate) / (1000 * 60 * 60 * 24)
    );

    return `${days} day(s)`;
  };


  const StatCard = ({ title, value, icon: Icon, gradient, trend, onClick }) => (
    <div 
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden animate-fadeInUp ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      
      {/* Background Gradient on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">

          <div className="flex-1">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">{title}</p>
            <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {value}
            </p>
            
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold text-green-600">{trend}</span>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
            <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>

        </div>

        {/* Decorative Element */}
        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
      </div>
    </div>
  );


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }


  /* ===================================
     RENDER
  =================================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pb-10">
      
      <div className="space-y-8">

        {/* HEADER */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-10 text-white shadow-2xl overflow-hidden animate-fadeInDown">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
                <h1 className="text-3xl lg:text-4xl font-bold">
                  Welcome back, {currentUser?.firstName || currentUser?.email?.split('@')[0]}!
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/30">
                  <Crown className="w-4 h-4" />
                  {userRole?.replace('_', ' ').toUpperCase()}
                </span>
                
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/30">
                  <CalendarDays className="w-4 h-4" />
                  Member for {getWorkDuration()}
                </span>

                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/30">
                  <Activity className="w-4 h-4" />
                  Active
                </span>
              </div>
            </div>

            {/* User Avatar */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse-slow"></div>
                <div className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-bold text-white">
                    {currentUser?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ADMIN STATS */}
        {userRole === 'admin' && (
          <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                System Overview
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              <StatCard
                title="Total Deals"
                value={stats.totalDeals}
                icon={Briefcase}
                gradient="from-blue-500 to-cyan-500"
                onClick={() => navigate('/sales/deals')}
              />

              <StatCard
                title="Total Income"
                value={formatCurrency(stats.totalIncome)}
                icon={DollarSign}
                gradient="from-purple-500 to-pink-500"
                onClick={() => navigate('/finance')}
              />

              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                icon={Users}
                gradient="from-orange-500 to-red-500"
                onClick={() => navigate('/admin/users')}
              />

              <StatCard
                title="Pending Deals"
                value={stats.pendingDeals}
                icon={Clock}
                gradient="from-green-500 to-emerald-500"
                onClick={() => navigate('/sales/deals')}
              />

            </div>
          </div>
        )}


        {/* USER STATS - NO FINANCIAL DATA */}
        {userRole !== 'admin' && (
          <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Your Performance
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              <StatCard
                title="Total Deals"
                value={stats.myDeals}
                icon={Briefcase}
                gradient="from-blue-500 to-cyan-500"
                onClick={() => navigate('/sales/deals')}
              />

              <StatCard
                title="Closed Deals"
                value={stats.closedDeals}
                icon={Trophy}
                gradient="from-green-500 to-emerald-500"
                onClick={() => navigate('/sales/deals')}
              />

              <StatCard
                title="Active Deals"
                value={stats.myActiveDeals}
                icon={Activity}
                gradient="from-purple-500 to-pink-500"
                onClick={() => navigate('/sales/deals')}
              />

            </div>
          </div>
        )}


        {/* PROFILE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 lg:p-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Your Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 hover:shadow-md transition-all duration-300">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CalendarDays className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Member Since</p>
                <p className="font-bold text-gray-900 text-lg">
                  {joinedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || '—'}
                </p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 hover:shadow-md transition-all duration-300">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Award className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Work Duration</p>
                <p className="font-bold text-gray-900 text-lg">
                  {getWorkDuration()}
                </p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:shadow-md transition-all duration-300">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</p>
                <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  Active
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </p>
              </div>
            </div>

          </div>

        </div>


        {/* QUICK TASKS */}
        {myTasks.length > 0 && (
          <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  My Active Tasks
                </h2>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors group"
              >
                View All 
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myTasks.map((task, idx) => {
                const deadline = task.deadline?.toDate?.() || new Date(task.deadline);
                const isOverdue = deadline < new Date();
                
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 cursor-pointer hover:-translate-y-1 animate-slideInUp"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        isOverdue 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isOverdue ? 'Overdue' : 'Pending'}
                      </span>
                      {task.priority === 'urgent' && (
                        <Flame size={16} className="text-red-600 animate-pulse" />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition">
                      {task.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-1">{task.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>by {task.createdByEmail?.split('@')[0]}</span>
                      <span>{deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* MEMBER COMMISSION VIEW - Show for non-admin users */}
        {userRole !== 'admin' && (
          <div className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <MemberCommissionView />
          </div>
        )}


        {/* ACHIEVEMENTS */}
        <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200 shadow-lg p-6 lg:p-8 overflow-hidden animate-fadeInUp" style={{ animationDelay: '0.35s' }}>

          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-200/30 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-orange-600 bg-clip-text text-transparent">
                Achievements & Badges
              </h2>
            </div>

            {achievements.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                  <Target className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-gray-600 font-medium mb-2">
                  No achievements yet
                </p>
                <p className="text-sm text-gray-500">
                  Keep working hard to unlock your first badge! 🚀
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {achievements.map((a, i) => {
                  const Icon = a.icon;

                  return (
                    <div
                      key={i}
                      className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-gray-100 p-5 transition-all duration-300 hover:-translate-y-1 animate-scaleIn overflow-hidden"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                      {/* Content */}
                      <div className="relative z-10 flex items-start gap-4">
                        
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${a.color} shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                          <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                            {a.title}
                          </p>

                          <p className="text-sm text-gray-600 leading-relaxed">
                            {a.desc}
                          </p>
                        </div>

                      </div>

                      {/* Shine Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                    </div>
                  );
                })}

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Styles */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>

    </div>
  );
};