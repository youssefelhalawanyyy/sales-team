import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { MemberCommissionView } from '../components/MemberCommissionView';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Member Commission Page
 * Full page view for members to see their commissions
 * Only accessible by non-admin members
 */
export const MemberCommissionPage = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  // Only allow non-admin users to access this page
  const isAllowed = userRole && userRole !== 'admin';

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-3">Access Denied</h1>
          <p className="text-red-700 mb-6">
            You don't have permission to access this page. This page is for sales members only.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pb-10">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Commissions
            </h1>
            <p className="text-gray-600">
              View and track all your pending and paid commissions
            </p>
          </div>
        </div>

        {/* Commission View Component */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <MemberCommissionView />
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Pending Status</h3>
            <p className="text-sm text-blue-800">
              Commissions that have been approved and are waiting for payout on their scheduled date.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">Paid Status</h3>
            <p className="text-sm text-green-800">
              Commissions that have been successfully paid to you.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-2">Need Help?</h3>
            <p className="text-sm text-purple-800">
              Contact your admin if you have any questions about your commissions.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MemberCommissionPage;
