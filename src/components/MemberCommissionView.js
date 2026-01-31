import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

/**
 * Member Commission View Component
 * Shows only the logged-in member's commissions
 * Displays PENDING and PAID statuses with totals
 */
export const MemberCommissionView = () => {
  const { currentUser } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===================================
     LOAD MEMBER'S COMMISSIONS
  =================================== */

  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError(null);

    try {
      // Real-time listener for member's own commissions only
      const q = query(
        collection(db, 'commissions'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort by date descending
          data.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          });

          setCommissions(data);
          setLoading(false);
        } catch (err) {
          console.error('Error processing commissions:', err);
          setError('Failed to load commissions');
          setLoading(false);
        }
      }, (err) => {
        console.error('Error listening to commissions:', err);
        setError('Failed to load commissions');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up commission listener:', err);
      setError('Failed to load commissions');
      setLoading(false);
    }
  }, [currentUser?.uid]);

  /* ===================================
     CALCULATE TOTALS
  =================================== */

  const totals = {
    pending: commissions
      .filter(c => c.status === 'unpaid')
      .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
    paid: commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
    total: commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0)
  };

  /* ===================================
     FORMAT HELPERS
  =================================== */

  const formatDate = (firebaseDate) => {
    if (!firebaseDate) return 'N/A';
    const date = firebaseDate.seconds 
      ? new Date(firebaseDate.seconds * 1000)
      : new Date(firebaseDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    return status === 'paid' 
      ? 'bg-green-50 border-green-200 text-green-900'
      : 'bg-yellow-50 border-yellow-200 text-yellow-900';
  };

  const getStatusBadge = (status) => {
    if (status === 'paid') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircle2 size={16} />
          Paid
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
        <Clock size={16} />
        Pending
      </div>
    );
  };

  /* ===================================
     RENDER
  =================================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="animate-spin text-blue-600" size={24} />
        <span className="ml-2 text-gray-600">Loading commissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ====== HEADER ====== */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <DollarSign className="text-blue-600" size={28} />
          My Commissions
        </h2>
        <p className="text-gray-600">Track your pending and paid commissions</p>
      </div>

      {/* ====== ERROR STATE ====== */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* ====== TOTALS CARDS ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Total */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-yellow-900">Pending</h3>
            <Clock className="text-yellow-600" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-yellow-900">
              {formatCurrency(totals.pending)}
            </span>
            <span className="text-sm text-yellow-700">
              ({commissions.filter(c => c.status === 'unpaid').length} items)
            </span>
          </div>
        </div>

        {/* Paid Total */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Paid</h3>
            <CheckCircle2 className="text-green-600" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-900">
              {formatCurrency(totals.paid)}
            </span>
            <span className="text-sm text-green-700">
              ({commissions.filter(c => c.status === 'paid').length} items)
            </span>
          </div>
        </div>

        {/* Total Commissions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Total</h3>
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-900">
              {formatCurrency(totals.total)}
            </span>
            <span className="text-sm text-blue-700">
              ({commissions.length} items)
            </span>
          </div>
        </div>
      </div>

      {/* ====== COMMISSIONS LIST ====== */}
      {commissions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <DollarSign className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Commissions Yet</h3>
          <p className="text-gray-600">
            Your commissions will appear here once the admin adds them for you
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {commissions.map((commission) => (
            <div
              key={commission.id}
              className={`border rounded-lg p-5 transition-all hover:shadow-md ${getStatusColor(commission.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-1">
                    {commission.offerName || 'Commission'}
                  </h4>
                  <p className="text-sm opacity-75">
                    {formatDate(commission.createdAt)}
                  </p>
                </div>
                {getStatusBadge(commission.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-current border-opacity-20">
                <div>
                  <p className="text-xs opacity-75 mb-1">Amount</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(commission.commissionAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-75 mb-1">
                    {commission.status === 'paid' ? 'Paid On' : 'Payout Date'}
                  </p>
                  <p className="font-medium">
                    {commission.status === 'paid'
                      ? formatDate(commission.paidAt)
                      : formatDate(commission.payoutDate)}
                  </p>
                </div>
              </div>

              {commission.approved && (
                <div className="mt-3 text-xs bg-white bg-opacity-40 px-2 py-1 rounded">
                  ✓ Approved
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ====== INFO MESSAGE ====== */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Commission Details</p>
          <ul className="space-y-1 text-xs opacity-90">
            <li>• <strong>Pending:</strong> Approved and waiting for payout</li>
            <li>• <strong>Paid:</strong> Commission has been paid to you</li>
            <li>• Contact admin if you have questions about your commissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemberCommissionView;
