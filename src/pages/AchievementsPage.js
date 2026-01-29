import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

import {
  Award,
  Trophy,
  TrendingUp,
  User
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

export const AchievementsPage = () => {
  const { currentUser, userRole } = useAuth();

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalDeals: 0,
    totalCommission: 0,
    promotionReady: false,
    dealsRemaining: 0
  });

  // =========================
  // FETCH DATA (REALTIME)
  // =========================
  useEffect(() => {
    if (!currentUser?.uid || !userRole) return;

    let q;

    // Sales Member → Own Deals
    if (userRole === 'sales_member') {
      q = query(
        collection(db, 'sales', 'deals', 'records'),
        where('createdBy', '==', currentUser.uid),
        where('status', '==', 'closed')
      );
    }

    // Team Leader → Team Deals
    if (userRole === 'team_leader') {
      q = query(
        collection(db, 'sales', 'deals', 'records'),
        where('teamLeaderId', '==', currentUser.uid),
        where('status', '==', 'closed')
      );
    }

    if (!q) return;

    // Realtime listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate stats
        const totalDeals = list.length;

        const totalCommission = list.reduce((sum, deal) => {
          const price = Number(deal.price) || 0;
          return sum + price * 0.2;
        }, 0);

        const promotionReady =
          userRole === 'sales_member' && totalDeals >= 5;

        const dealsRemaining = promotionReady
          ? 0
          : Math.max(0, 5 - totalDeals);

        setAchievements(list);

        setStats({
          totalDeals,
          totalCommission,
          promotionReady,
          dealsRemaining
        });

        setLoading(false);
      },
      (error) => {
        console.error('Firestore error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();

  }, [currentUser?.uid, userRole]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          My Achievements
        </h1>
        <p className="text-gray-600 mt-2">
          Track your closed deals and performance
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Deals */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Closed Deals</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.totalDeals}
              </p>
            </div>
            <Trophy className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        {/* Commission */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Commission</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${stats.totalCommission.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        {/* Promotion Deals */}
        {userRole === 'sales_member' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  Deals for Promotion
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.dealsRemaining}
                </p>
              </div>
              <Award className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        )}

        {/* Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p
                className={`text-lg font-bold mt-2 ${
                  stats.promotionReady
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`}
              >
                {stats.promotionReady
                  ? 'Ready!'
                  : 'In Progress'}
              </p>
            </div>
            <User className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>

      </div>

      {/* PROMOTION */}
      {stats.promotionReady && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-900 mb-2">
            🎉 Ready for Promotion!
          </h3>

          <p className="text-green-800">
            You have closed {stats.totalDeals} deals and
            are eligible for Team Leader promotion.
          </p>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-md">

        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            Closed Deals
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Business</th>
                <th className="px-6 py-3 text-left">Contact</th>
                <th className="px-6 py-3 text-left">Price</th>
                <th className="px-6 py-3 text-left">Commission</th>
                <th className="px-6 py-3 text-left">Closed Date</th>
              </tr>
            </thead>

            <tbody className="divide-y">

              {achievements.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-6 text-gray-500"
                  >
                    No closed deals yet
                  </td>
                </tr>
              )}

              {achievements.map((deal) => {
                const commission =
                  (Number(deal.price) || 0) * 0.2;

                return (
                  <tr
                    key={deal.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium">
                      {deal.businessName}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {deal.contactPerson}
                    </td>

                    <td className="px-6 py-4 text-blue-600 font-semibold">
                      ${(Number(deal.price) || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-green-600 font-semibold">
                      ${commission.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {deal.closedDate
                        ? new Date(deal.closedDate).toLocaleString()
                        : 'N/A'}
                    </td>
                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
};

export default AchievementsPage;
