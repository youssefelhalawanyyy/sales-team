import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import {
  Plus,
  Trash2,
  Edit,
  X,
  Search,
  Filter,
  Bell,
  Calendar,
  User,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { notifyFollowUpDue, notifyFollowUpCompleted } from '../services/notificationService';

/* ============================= */

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow', icon: Clock },
  { value: 'done', label: 'Done', color: 'green', icon: CheckCircle2 },
  { value: 'overdue', label: 'Overdue', color: 'red', icon: AlertCircle }
];

/* ============================= */

export default function FollowUpsPage() {
  const { currentUser, userRole } = useAuth();

  const [followups, setFollowups] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editFollowup, setEditFollowup] = useState(null);

  const [form, setForm] = useState({
    dealId: '',
    reminderDate: '',
    nextAction: '',
    notes: ''
  });

  /* ============================= */

  useEffect(() => {
    if (currentUser?.uid) {
      loadDeals();
      loadFollowups();
    }
  }, [currentUser, userRole]);

  /* ============================= */

  async function loadDeals() {
    try {
      let q;

      if (userRole === 'admin') {
        q = query(
          collection(db, 'sales'),
          where('archived', '==', false)
        );
      } else {
        q = query(
          collection(db, 'sales'),
          where('createdBy', '==', currentUser.uid),
          where('archived', '==', false)
        );
      }

      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDeals(list);
    } catch (e) {
      console.error('Error loading deals:', e);
    }
  }

  /* ============================= */

  async function loadFollowups() {
    try {
      setLoading(true);

      let q;

      if (userRole === 'admin') {
        // Admin: Load ALL follow-ups (no filter needed)
        q = query(
          collection(db, 'followups')
        );
      } else {
        // Regular users: Only load their assigned follow-ups
        q = query(
          collection(db, 'followups'),
          where('assignedTo', '==', currentUser.uid)
        );
      }

      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort by reminderDate in memory (avoids composite index requirement)
      list.sort((a, b) => {
        const dateA = a.reminderDate?.toMillis?.() || 0;
        const dateB = b.reminderDate?.toMillis?.() || 0;
        return dateA - dateB;
      });

      // Auto-update overdue status
      list = list.map(f => {
        if (f.status === 'pending' && isOverdue(f.reminderDate)) {
          return { ...f, status: 'overdue' };
        }
        return f;
      });

      setFollowups(list);
    } catch (e) {
      console.error('Error loading follow-ups:', e);
      console.error('Full error details:', e.message, e.code);
      alert('Failed to load follow-ups: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ============================= */

  async function createFollowup(e) {
    e.preventDefault();

    if (!form.dealId) {
      alert('Please select a client');
      return;
    }

    const selectedDeal = deals.find(d => d.id === form.dealId);
    if (!selectedDeal) {
      alert('Invalid client selected');
      return;
    }

    try {
      const reminderDate = Timestamp.fromDate(new Date(form.reminderDate));
      const status = isOverdue(reminderDate) ? 'overdue' : 'pending';

      await addDoc(collection(db, 'followups'), {
        dealId: form.dealId,
        businessName: selectedDeal.businessName,
        assignedTo: currentUser.uid,
        assignedToName: `${currentUser.firstName} ${currentUser.lastName}`,
        reminderDate: reminderDate,
        nextAction: form.nextAction,
        notes: form.notes,
        status: status,
        createdAt: serverTimestamp(),
        completedAt: null
      });

      setForm({
        dealId: '',
        reminderDate: '',
        nextAction: '',
        notes: ''
      });

      setShowForm(false);
      loadFollowups();
    } catch (e) {
      console.error('Error creating follow-up:', e);
      alert('Failed to create follow-up');
    }
  }

  /* ============================= */

  async function saveEdit() {
    if (!editFollowup.dealId) {
      alert('Please select a client');
      return;
    }

    const selectedDeal = deals.find(d => d.id === editFollowup.dealId);

    try {
      const reminderDate = typeof editFollowup.reminderDate === 'string'
        ? Timestamp.fromDate(new Date(editFollowup.reminderDate))
        : editFollowup.reminderDate;

      const status = editFollowup.status === 'done' 
        ? 'done' 
        : (isOverdue(reminderDate) ? 'overdue' : 'pending');

      await updateDoc(doc(db, 'followups', editFollowup.id), {
        dealId: editFollowup.dealId,
        businessName: selectedDeal?.businessName || editFollowup.businessName,
        reminderDate: reminderDate,
        nextAction: editFollowup.nextAction,
        notes: editFollowup.notes,
        status: status
      });

      setEditFollowup(null);
      loadFollowups();
    } catch (e) {
      console.error('Error updating follow-up:', e);
      alert('Failed to update follow-up');
    }
  }

  /* ============================= */

  async function markAsDone(id) {
    try {
      const followup = followups.find(f => f.id === id);
      
      await updateDoc(doc(db, 'followups', id), {
        status: 'done',
        completedAt: serverTimestamp()
      });
      
      // Send completion notification
      if (followup) {
        try {
          await notifyFollowUpCompleted(currentUser.uid, {
            id: followup.id,
            clientName: followup.businessName
          });
        } catch (notifError) {
          console.error('Error sending follow-up notification:', notifError);
        }
      }
      
      loadFollowups();
    } catch (e) {
      console.error('Error marking as done:', e);
      alert('Failed to update status');
    }
  }

  /* ============================= */

  async function deleteFollowup(id) {
    if (!window.confirm('Delete this follow-up permanently?')) return;

    try {
      await deleteDoc(doc(db, 'followups', id));
      loadFollowups();
    } catch (e) {
      console.error('Error deleting follow-up:', e);
      alert('Failed to delete follow-up');
    }
  }

  /* ============================= */

  const filtered = followups.filter(f => {
    const searchMatch =
      f.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      f.nextAction?.toLowerCase().includes(search.toLowerCase());

    const statusMatch = filterStatus === 'all' || f.status === filterStatus;

    return searchMatch && statusMatch;
  });

  /* ============================= */

  const upcomingCount = filtered.filter(f => f.status === 'pending').length;
  const overdueCount = filtered.filter(f => f.status === 'overdue').length;
  const doneCount = filtered.filter(f => f.status === 'done').length;

  /* ============================= */

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Bell className="w-6 h-6 text-white" />
            </div>
            Follow-Ups
          </h1>
          <p className="text-gray-600 mt-1 ml-15">Manage client follow-up tasks and reminders</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50 hover:scale-105"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Add Follow-Up</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Follow-Ups"
          value={filtered.length}
          icon={Bell}
          color="orange"
        />
        <StatCard
          title="Pending"
          value={upcomingCount}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Overdue"
          value={overdueCount}
          icon={AlertCircle}
          color="red"
          alert={overdueCount > 0}
        />
        <StatCard
          title="Completed"
          value={doneCount}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search by business or action..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative sm:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(search || filterStatus !== 'all') && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {search && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Status: {STATUSES.find(s => s.value === filterStatus)?.label}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading follow-ups...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No follow-ups found</h3>
          <p className="text-gray-600 mb-6">
            {search || filterStatus !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Get started by creating your first follow-up reminder'
            }
          </p>
          {!search && filterStatus === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
            >
              Create First Follow-Up
            </button>
          )}
        </div>
      )}

      {/* FOLLOW-UPS LIST */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(followup => (
            <FollowUpCard
              key={followup.id}
              followup={followup}
              onEdit={() => {
                setEditFollowup({
                  ...followup,
                  reminderDate: followup.reminderDate?.toDate
                    ? followup.reminderDate.toDate().toISOString().split('T')[0]
                    : followup.reminderDate
                });
              }}
              onMarkDone={() => markAsDone(followup.id)}
              onDelete={() => deleteFollowup(followup.id)}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Create Follow-Up">
          <form onSubmit={createFollowup} className="space-y-4">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Select Client *
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                required
                value={form.dealId}
                onChange={e => setForm({ ...form, dealId: e.target.value })}
              >
                <option value="">Choose a client...</option>
                {deals.map(deal => (
                  <option key={deal.id} value={deal.id}>
                    {deal.businessName} - {deal.contactPerson}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Reminder Date *
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                required
                value={form.reminderDate}
                onChange={e => setForm({ ...form, reminderDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Next Action *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="e.g., Send proposal, Schedule demo, Follow up on quote"
                required
                value={form.nextAction}
                onChange={e => setForm({ ...form, nextAction: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Notes
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                placeholder="Add any additional context or details..."
                rows="3"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50"
              >
                Create Follow-Up
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editFollowup && (
        <Modal onClose={() => setEditFollowup(null)} title="Edit Follow-Up">
          <div className="space-y-4">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Client
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                value={editFollowup.dealId}
                onChange={e => setEditFollowup({ ...editFollowup, dealId: e.target.value })}
              >
                <option value="">Choose a client...</option>
                {deals.map(deal => (
                  <option key={deal.id} value={deal.id}>
                    {deal.businessName} - {deal.contactPerson}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Reminder Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                value={editFollowup.reminderDate}
                onChange={e => setEditFollowup({ ...editFollowup, reminderDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Next Action
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                value={editFollowup.nextAction}
                onChange={e => setEditFollowup({ ...editFollowup, nextAction: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Notes
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                rows="3"
                value={editFollowup.notes}
                onChange={e => setEditFollowup({ ...editFollowup, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={saveEdit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditFollowup(null)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

/* ============================= */

function StatCard({ title, value, icon: Icon, color, alert }) {
  const colorClasses = {
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
    red: 'from-red-500 to-red-600 shadow-red-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all ${alert ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        {alert && (
          <div className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
            ALERT
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ============================= */

function FollowUpCard({ followup, onEdit, onMarkDone, onDelete, userRole }) {
  const status = STATUSES.find(s => s.value === followup.status);
  const StatusIcon = status?.icon || Clock;

  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  const isOverdueItem = followup.status === 'overdue';
  const isDone = followup.status === 'done';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-all ${isOverdueItem ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        
        {/* Left Section */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdueItem ? 'bg-gradient-to-br from-red-100 to-red-200' : 'bg-gradient-to-br from-orange-100 to-yellow-100'}`}>
              <Building2 className={`w-6 h-6 ${isOverdueItem ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">{followup.businessName}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <User className="w-4 h-4" />
                {followup.assignedToName}
              </p>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
            <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NEXT ACTION
            </p>
            <p className="text-sm text-gray-700 font-medium">{followup.nextAction}</p>
          </div>

          {followup.notes && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> NOTES
              </p>
              <p className="text-sm text-gray-600">{followup.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Reminder: {formatDate(followup.reminderDate)}</span>
            {isOverdueItem && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                OVERDUE
              </span>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col items-start lg:items-end gap-3">
          <div className={`px-4 py-2 rounded-xl font-semibold text-sm border flex items-center gap-2 ${colorClasses[status?.color]}`}>
            <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
            {status?.label}
          </div>

          {!isDone && (
            <button
              onClick={onMarkDone}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-medium transition-all text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg font-medium transition-all"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>

        {userRole === 'admin' && (
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================= */

function Modal({ children, onClose, title }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}