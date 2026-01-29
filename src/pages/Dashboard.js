import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

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
  Target
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
    closedDeals: 0
  });

  const [joinedDate, setJoinedDate] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);


  /* ===================================
     FETCH DATA
  =================================== */

  useEffect(() => {
    fetchDashboardData();
  }, [userRole, currentUser?.uid]);


  const fetchDashboardData = async () => {
    try {
      let totalDeals = 0;
      let totalIncome = 0;
      let activeUsers = 0;
      let myDeals = 0;
      let myIncome = 0;
      let closedDeals = 0;


      /* ---------------- USERS ---------------- */

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        activeUsers = usersSnap.docs.length;

        const me = usersSnap.docs.find(
          (doc) => doc.data().uid === currentUser?.uid
        );

        if (me?.data()?.createdAt) {
          const created = me.data().createdAt;

          if (created.seconds) {
            setJoinedDate(new Date(created.seconds * 1000));
          } else {
            setJoinedDate(new Date(created));
          }
        }

      } catch {}


      /* ---------------- DEALS ---------------- */

      let userClosedDeals = 0;

      try {
        const salesSnap = await getDocs(collection(db, 'sales'));
        totalDeals = salesSnap.docs.length;

        salesSnap.docs.forEach((doc) => {
          const data = doc.data();

          if (data.createdBy === currentUser?.uid) {
            myDeals++;

            if (data.status === 'closed') {
              userClosedDeals++;
            }
          }

          if (data.status === 'closed') {
            closedDeals++;
          }
        });

      } catch {}


      /* ---------------- FINANCE ---------------- */

      try {
        const financeSnap = await getDocs(collection(db, 'finances'));

        financeSnap.docs.forEach((doc) => {
          const data = doc.data();
          const amount = data.amount || 0;

          totalIncome += amount;

          if (data.createdBy === currentUser?.uid) {

            const percentage = userRole === 'admin' ? 0.2 : 0.05; // 20% admin, 5% others

            myIncome += amount * percentage;
          }
        });

      } catch {}


      const newStats = {
        totalDeals,
        totalIncome,
        activeUsers,
        myDeals,
        myIncome,
        closedDeals: userClosedDeals
      };

      setStats(newStats);

      calculateAchievements(newStats, userClosedDeals);

    } catch (err) {
      console.error(err);

    } finally {
      setLoading(false);
    }
  };


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
        icon: Target
      });
    }

    if (userClosedDeals >= 15) {
      list.push({
        title: 'Deal Maker',
        desc: 'Closed 15+ deals',
        icon: Trophy
      });
    }

    if (userClosedDeals >= 30) {
      list.push({
        title: 'Master Closer',
        desc: 'Closed 30+ deals',
        icon: Flame
      });
    }


    /* ---- Revenue ---- */

    if (data.myIncome >= 50000) {
      list.push({
        title: 'Big Earner',
        desc: 'Generated 50K+ EGP (Commission)',
        icon: DollarSign
      });
    }

    if (data.myIncome >= 200000) {
      list.push({
        title: 'High Roller',
        desc: 'Generated 200K+ EGP (Commission)',
        icon: TrendingUp
      });
    }


    /* ---- Loyalty ---- */

    if (joinedDate) {
      const months = getMonthsWorked();

      if (months >= 3) {
        list.push({
          title: 'Consistent',
          desc: 'Active for 3+ months',
          icon: CalendarDays
        });
      }

      if (months >= 12) {
        list.push({
          title: 'Loyal Member',
          desc: 'Active for 1+ year',
          icon: Award
        });
      }
    }


    /* ---- Rank ---- */

    if (data.myDeals >= 20) {
      list.push({
        title: 'Top Performer',
        desc: '20+ personal deals',
        icon: Star
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


  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>

        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-7 h-7" />
        </div>

      </div>
    </div>
  );


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  /* ===================================
     RENDER
  =================================== */

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow">

        <h1 className="text-3xl font-bold">
          Welcome, {currentUser?.firstName || currentUser?.email}
        </h1>

        <p className="mt-2 text-blue-100 capitalize">
          {userRole?.replace('_', ' ')} • Member for {getWorkDuration()}
        </p>

      </div>


      {/* ADMIN STATS */}
      {userRole === 'admin' && (
        <>
          <h2 className="text-xl font-bold text-gray-900">
            System Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <StatCard
              title="Total Deals"
              value={stats.totalDeals}
              icon={Briefcase}
              color="bg-blue-100 text-blue-600"
            />

            <StatCard
              title="Total Income"
              value={formatCurrency(stats.totalIncome)}
              icon={DollarSign}
              color="bg-purple-100 text-purple-600"
            />

            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={Users}
              color="bg-orange-100 text-orange-600"
            />

            <StatCard
              title="Closed Deals"
              value={stats.closedDeals}
              icon={Trophy}
              color="bg-green-100 text-green-600"
            />

          </div>
        </>
      )}


      {/* USER STATS */}
      {userRole !== 'admin' && (
        <>
          <h2 className="text-xl font-bold text-gray-900">
            Your Performance (Commission)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <StatCard
              title="My Deals"
              value={stats.myDeals}
              icon={Briefcase}
              color="bg-blue-100 text-blue-600"
            />

            <StatCard
              title="My Commission"
              value={formatCurrency(stats.myIncome)}
              icon={DollarSign}
              color="bg-purple-100 text-purple-600"
            />

            <StatCard
              title="Closed Deals"
              value={stats.closedDeals}
              icon={Trophy}
              color="bg-green-100 text-green-600"
            />

          </div>
        </>
      )}


      {/* PROFILE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Your Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="flex items-center gap-4">
            <CalendarDays className="w-8 h-8 text-blue-600" />

            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-semibold text-gray-900">
                {joinedDate?.toLocaleDateString() || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Award className="w-8 h-8 text-yellow-600" />

            <div>
              <p className="text-sm text-gray-500">Work Duration</p>
              <p className="font-semibold text-gray-900">
                {getWorkDuration()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-green-600" />

            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold text-gray-900">Active</p>
            </div>
          </div>

        </div>

      </div>


      {/* ACHIEVEMENTS */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6">

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Achievements
        </h2>

        {achievements.length === 0 ? (
          <p className="text-gray-600 text-sm">
            No achievements yet. Keep working to unlock your first badge 🚀
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {achievements.map((a, i) => {
              const Icon = a.icon;

              return (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4"
                >

                  <div className="p-3 rounded-xl bg-yellow-100 text-yellow-700">
                    <Icon size={22} />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      {a.title}
                    </p>

                    <p className="text-sm text-gray-500">
                      {a.desc}
                    </p>
                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
};
