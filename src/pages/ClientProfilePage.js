import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  DollarSign,
  Clock,
  MapPin,
  Bell,
  TrendingUp,
  Calendar,
  CheckCircle2,
  FileText,
  Briefcase,
  XCircle,
  Target,
  Users,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import { formatDate, formatDateTime } from '../utils/dateHelpers';

/* ============================= */

const STATUSES = [
  { value: 'potential_client', label: 'Potential Client', color: 'blue', icon: Users },
  { value: 'pending_approval', label: 'Pending Approval', color: 'yellow', icon: Clock },
  { value: 'closed', label: 'Closed', color: 'green', icon: CheckCircle2 },
  { value: 'lost', label: 'Lost', color: 'red', icon: XCircle }
];

/* ============================= */

export default function ClientProfilePage() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();

  const [deal, setDeal] = useState(null);
  const [visits, setVisits] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  /* ============================= */

  useEffect(() => {
    if (currentUser?.uid && dealId) {
      loadClientData();
    }
  }, [currentUser, dealId]);

  /* ============================= */

  async function loadClientData() {
    try {
      setLoading(true);
      setError(null);

      // Load deal from 'sales' collection
      const dealDoc = await getDoc(doc(db, 'sales', dealId));
      
      if (!dealDoc.exists()) {
        setError('Client not found');
        setLoading(false);
        return;
      }

      const dealData = { id: dealDoc.id, ...dealDoc.data() };

      // Check permissions - only admin or the creator can view
      if (userRole !== 'admin' && dealData.createdBy !== currentUser.uid) {
        setError('You do not have permission to view this client');
        setLoading(false);
        return;
      }

      setDeal(dealData);
      setNotesText(dealData.notes || ''); // Initialize notes text

      // Load visits for this deal
      const visitsQuery = query(
        collection(db, 'visits'),
        where('dealId', '==', dealId),
        orderBy('visitDate', 'desc')
      );
      
      const visitsSnap = await getDocs(visitsQuery);
      const visitsList = visitsSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      
      console.log('Loaded visits:', visitsList); // Debug log
      setVisits(visitsList);

      // Load follow-ups for this deal
      const followupsQuery = query(
        collection(db, 'followups'),
        where('dealId', '==', dealId),
        orderBy('reminderDate', 'asc')
      );
      
      const followupsSnap = await getDocs(followupsQuery);
      const followupsList = followupsSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      
      console.log('Loaded follow-ups:', followupsList); // Debug log
      setFollowups(followupsList);

    } catch (e) {
      console.error('Error loading client data:', e);
      setError('Failed to load client data: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ============================= */

  async function handleSaveNotes() {
    if (!dealId) return;

    try {
      setSavingNotes(true);

      const dealRef = doc(db, 'sales', dealId);
      await updateDoc(dealRef, {
        notes: notesText,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setDeal(prev => ({ ...prev, notes: notesText }));
      setIsEditingNotes(false);

      alert('Notes saved successfully!');
    } catch (e) {
      console.error('Error saving notes:', e);
      alert('Failed to save notes: ' + e.message);
    } finally {
      setSavingNotes(false);
    }
  }

  function handleCancelEdit() {
    setNotesText(deal.notes || '');
    setIsEditingNotes(false);
  }

  /* ============================= */

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading client profile...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Client not found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {error ? 'Please try again or contact support.' : "The client you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <button
            onClick={() => navigate('/sales')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
          >
            Back to Sales
          </button>
        </div>
      </div>
    );
  }

  const status = STATUSES.find(s => s.value === deal.status) || STATUSES[0];
  const StatusIcon = status.icon;

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  /* ============================= */

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Sales</span>
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{deal.businessName || 'Unnamed Business'}</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <User className="w-4 h-4" />
                {deal.contactPerson || 'No contact person'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className={`px-4 py-2 rounded-xl font-semibold text-sm border flex items-center gap-2 ${colorClasses[status?.color]}`}>
              <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
              {status?.label}
            </div>
          </div>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Client Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Client Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Contact Person</p>
                <p className="text-sm font-medium text-gray-900">{deal.contactPerson || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                <p className="text-sm font-medium text-gray-900">{deal.phoneNumber || 'N/A'}</p>
              </div>
            </div>

            {deal.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                  <p className="text-sm font-medium text-gray-900">{deal.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Created By</p>
                <p className="text-sm font-medium text-gray-900">{deal.createdByName || 'Unknown'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Created On</p>
                <p className="text-sm font-medium text-gray-900">
                  {deal.createdAt ? formatDate(deal.createdAt) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-600" />
            Deal Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Deal Value</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(deal.price || 0)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</p>
              <div className={`inline-flex px-4 py-2 rounded-xl font-semibold text-sm border items-center gap-2 ${colorClasses[status?.color]}`}>
                <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
                {status?.label}
              </div>
            </div>

            {deal.address && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Address
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {deal.address}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Activity Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Total Visits</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">{visits.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Follow-Ups</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">{followups.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Pending</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {followups.filter(f => f.status === 'pending' || f.status === 'overdue').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTES SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Client Notes
          </h3>
          
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Notes
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-4">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add notes about this client..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
            />
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNotes ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Notes
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancelEdit}
                disabled={savingNotes}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {deal.notes ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No notes added yet</p>
                <p className="text-sm text-gray-500 mt-1">Click "Edit Notes" to add information about this client</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TIMELINE SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visits Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Client Visits
            </h3>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">
              {visits.length} total
            </span>
          </div>

          {visits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No visits recorded yet</p>
              <p className="text-sm text-gray-500 mt-1">Visit history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {visits.map(visit => (
                <VisitItem key={visit.id} visit={visit} />
              ))}
            </div>
          )}
        </div>

        {/* Follow-Ups Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              Follow-Ups
            </h3>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold">
              {followups.length} total
            </span>
          </div>

          {followups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No follow-ups scheduled</p>
              <p className="text-sm text-gray-500 mt-1">Follow-up tasks will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {followups.map(followup => (
                <FollowUpItem key={followup.id} followup={followup} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FUTURE: Payments Section Placeholder */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Payment History</h3>
          <p className="text-gray-600 text-sm">
            This section will display payment records and invoices.
            <br />
            <span className="text-xs text-gray-500">(Coming soon)</span>
          </p>
        </div>
      </div>

    </div>
  );
}

/* ============================= */

function VisitItem({ visit }) {
  return (
    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-gray-900">
              {visit.visitDate ? formatDate(visit.visitDate) : 'No date'}
            </p>
            {visit.address && (
              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {visit.address}
              </p>
            )}
          </div>
        </div>
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-purple-600" />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {visit.purpose && (
          <div className="bg-white rounded-lg p-2 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" /> PURPOSE
            </p>
            <p className="text-xs text-gray-700">{visit.purpose}</p>
          </div>
        )}

        {visit.result && (
          <div className="bg-white rounded-lg p-2 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> RESULT
            </p>
            <p className="text-xs text-gray-700">{visit.result}</p>
          </div>
        )}

        {visit.nextStep && (
          <div className="bg-white rounded-lg p-2 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NEXT STEP
            </p>
            <p className="text-xs text-gray-700">{visit.nextStep}</p>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-purple-200 flex items-center gap-2 text-xs text-gray-600">
        <User className="w-3 h-3" />
        <span>{visit.salesRepName || 'Unknown'}</span>
      </div>
    </div>
  );
}

/* ============================= */

function FollowUpItem({ followup }) {
  const isOverdueItem = followup.status === 'overdue';
  const isDone = followup.status === 'done';

  return (
    <div className={`rounded-xl p-4 border hover:shadow-md transition-all ${
      isOverdueItem 
        ? 'bg-red-50 border-red-200' 
        : isDone 
          ? 'bg-green-50 border-green-200'
          : 'bg-orange-50 border-orange-100'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <Calendar className={`w-4 h-4 mt-0.5 ${isOverdueItem ? 'text-red-600' : isDone ? 'text-green-600' : 'text-orange-600'}`} />
          <div>
            <p className="text-sm font-bold text-gray-900">
              {followup.reminderDate ? formatDate(followup.reminderDate) : 'No date'}
            </p>
            {followup.nextAction && (
              <p className="text-xs text-gray-600 mt-0.5">
                {followup.nextAction}
              </p>
            )}
          </div>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isOverdueItem 
            ? 'bg-red-100' 
            : isDone 
              ? 'bg-green-100'
              : 'bg-orange-100'
        }`}>
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : isOverdueItem ? (
            <Clock className="w-4 h-4 text-red-600" />
          ) : (
            <Bell className="w-4 h-4 text-orange-600" />
          )}
        </div>
      </div>

      {followup.notes && (
        <div className={`mt-3 rounded-lg p-2 border ${
          isOverdueItem 
            ? 'bg-white border-red-200' 
            : isDone 
              ? 'bg-white border-green-200'
              : 'bg-white border-orange-200'
        }`}>
          <p className={`text-xs font-semibold mb-1 flex items-center gap-1 ${
            isOverdueItem ? 'text-red-700' : isDone ? 'text-green-700' : 'text-orange-700'
          }`}>
            <FileText className="w-3 h-3" /> NOTES
          </p>
          <p className="text-xs text-gray-700">{followup.notes}</p>
        </div>
      )}

      <div className={`mt-3 pt-3 border-t flex items-center justify-between ${
        isOverdueItem ? 'border-red-200' : isDone ? 'border-green-200' : 'border-orange-200'
      }`}>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <User className="w-3 h-3" />
          <span>{followup.assignedToName || 'Unknown'}</span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          isOverdueItem 
            ? 'bg-red-100 text-red-700' 
            : isDone 
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
        }`}>
          {followup.status ? followup.status.toUpperCase() : 'PENDING'}
        </span>
      </div>
    </div>
  );
}