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
  MapPin,
  Calendar,
  User,
  Briefcase,
  Target,
  TrendingUp,
  CheckCircle,
  FileText,
  Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatDateTime } from '../utils/dateHelpers';

/* ============================= */

export default function VisitsPage() {
  const { currentUser, userRole } = useAuth();

  const [visits, setVisits] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterRep, setFilterRep] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editVisit, setEditVisit] = useState(null);

  const [form, setForm] = useState({
    dealId: '',
    address: '',
    visitDate: '',
    purpose: '',
    result: '',
    nextStep: ''
  });

  /* ============================= */

  useEffect(() => {
    if (currentUser?.uid) {
      loadDeals();
      loadVisits();
    }
  }, [currentUser, userRole]);

  /* ============================= */

  async function loadDeals() {
    try {
      if (userRole === 'admin' || userRole === 'sales_manager') {
        // Admin/Manager sees all deals - simple query
        const q = query(collection(db, 'sales'));
        const snapshot = await getDocs(q);
        const allDeals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const activeDeals = allDeals.filter(deal => !deal.archived);
        setDeals(activeDeals);
        return;
      }

      const queries = [
        query(collection(db, 'sales'), where('ownerId', '==', currentUser.uid)),
        query(collection(db, 'sales'), where('createdBy', '==', currentUser.uid)),
        query(collection(db, 'sales'), where('sharedWith', 'array-contains', currentUser.uid))
      ];

      if (currentUser?.teamId) {
        queries.push(query(collection(db, 'sales'), where('teamId', '==', currentUser.teamId)));
      }

      const snapshots = await Promise.all(queries.map(queryRef => getDocs(queryRef)));
      const dealMap = new Map();
      snapshots.forEach(snapshot => {
        snapshot.docs.forEach(docSnap => {
          dealMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      });

      const activeDeals = Array.from(dealMap.values()).filter(deal => !deal.archived);
      setDeals(activeDeals);
    } catch (e) {
      console.error('Error loading deals:', e);
      alert('Failed to load deals: ' + e.message);
    }
  }

  /* ============================= */

  async function loadVisits() {
    try {
      setLoading(true);

      let snapshot;

      if (userRole === 'admin' || userRole === 'sales_manager') {
        // Admin/Manager sees all visits - simple query WITHOUT orderBy
        const q = query(collection(db, 'visits'));
        snapshot = await getDocs(q);
      } else {
        // Reps see only their visits - query WITHOUT orderBy
        const q = query(
          collection(db, 'visits'),
          where('salesRepId', '==', currentUser.uid)
        );
        snapshot = await getDocs(q);
      }

      let list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort by visitDate in memory (newest first)
      list.sort((a, b) => {
        const dateA = a.visitDate?.toMillis?.() || 0;
        const dateB = b.visitDate?.toMillis?.() || 0;
        return dateB - dateA; // Descending order (newest first)
      });

      setVisits(list);
    } catch (e) {
      console.error('Error loading visits:', e);
      alert('Failed to load visits: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ============================= */

  async function createVisit(e) {
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
      await addDoc(collection(db, 'visits'), {
        dealId: form.dealId,
        businessName: selectedDeal.businessName,
        salesRepId: currentUser.uid,
        salesRepName: `${currentUser.firstName} ${currentUser.lastName}`,
        address: form.address,
        visitDate: Timestamp.fromDate(new Date(form.visitDate)),
        purpose: form.purpose,
        result: form.result,
        nextStep: form.nextStep,
        createdAt: serverTimestamp()
      });

      // Auto-log communication
      await addDoc(collection(db, 'communications'), {
        clientId: form.dealId,
        clientName: selectedDeal.businessName,
        type: 'meeting',
        purpose: form.purpose,
        result: form.result,
        notes: form.nextStep,
        timestamp: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`
      });

      // Reset form
      setForm({
        dealId: '',
        address: '',
        visitDate: '',
        purpose: '',
        result: '',
        nextStep: ''
      });

      setShowForm(false);
      loadVisits();
      alert('Visit logged successfully!');
    } catch (e) {
      console.error('Error creating visit:', e);
      alert('Failed to create visit: ' + e.message);
    }
  }

  /* ============================= */

  async function saveEdit() {
    if (!editVisit.dealId) {
      alert('Please select a client');
      return;
    }

    const selectedDeal = deals.find(d => d.id === editVisit.dealId);

    try {
      await updateDoc(doc(db, 'visits', editVisit.id), {
        dealId: editVisit.dealId,
        businessName: selectedDeal?.businessName || editVisit.businessName,
        address: editVisit.address,
        visitDate: typeof editVisit.visitDate === 'string' 
          ? Timestamp.fromDate(new Date(editVisit.visitDate))
          : editVisit.visitDate,
        purpose: editVisit.purpose,
        result: editVisit.result,
        nextStep: editVisit.nextStep
      });

      // Auto-log communication for updated visit
      try {
        await addDoc(collection(db, 'communications'), {
          clientId: editVisit.dealId,
          clientName: selectedDeal?.businessName || editVisit.businessName,
          type: 'meeting_updated',
          purpose: editVisit.purpose,
          result: editVisit.result,
          notes: editVisit.nextStep,
          timestamp: serverTimestamp(),
          createdBy: currentUser.uid,
          createdByName: `${currentUser.firstName} ${currentUser.lastName}`
        });
      } catch (logError) {
        console.error('Error logging communication:', logError);
      }

      setEditVisit(null);
      loadVisits();
      alert('Visit updated successfully!');
    } catch (e) {
      console.error('Error updating visit:', e);
      alert('Failed to update visit: ' + e.message);
    }
  }

  /* ============================= */

  async function deleteVisit(id) {
    if (!window.confirm('Delete this visit permanently?')) return;

    try {
      await deleteDoc(doc(db, 'visits', id));
      loadVisits();
      alert('Visit deleted successfully!');
    } catch (e) {
      console.error('Error deleting visit:', e);
      alert('Failed to delete visit: ' + e.message);
    }
  }

  /* ============================= */

  // Get unique sales reps for filter
  const uniqueReps = [...new Set(visits.map(v => v.salesRepName))].filter(Boolean);

  /* ============================= */

  const filtered = visits.filter(v => {
    const searchMatch =
      v.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      v.address?.toLowerCase().includes(search.toLowerCase()) ||
      v.purpose?.toLowerCase().includes(search.toLowerCase());

    const repMatch = filterRep === 'all' || v.salesRepName === filterRep;

    return searchMatch && repMatch;
  });

  const canDelete = userRole === 'admin' || userRole === 'sales_manager';

  /* ============================= */

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            Client Visits
          </h1>
          <p className="text-gray-600 mt-1 ml-15">Track and manage client site visits</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 hover:scale-105"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Log New Visit</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Visits"
          value={filtered.length}
          icon={MapPin}
          color="purple"
        />
        <StatCard
          title="This Month"
          value={filtered.filter(v => {
            if (!v.visitDate) return false;
            const date = v.visitDate.toDate ? v.visitDate.toDate() : new Date(v.visitDate);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Unique Clients"
          value={[...new Set(filtered.map(v => v.dealId))].length}
          icon={Building2}
          color="green"
        />
        <StatCard
          title="Sales Reps"
          value={uniqueReps.length}
          icon={User}
          color="yellow"
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search by business, address, or purpose..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter by Rep (Admin/Manager only) */}
          {(userRole === 'admin' || userRole === 'sales_manager') && uniqueReps.length > 0 && (
            <div className="relative sm:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                value={filterRep}
                onChange={e => setFilterRep(e.target.value)}
              >
                <option value="all">All Sales Reps</option>
                {uniqueReps.map(rep => (
                  <option key={rep} value={rep}>
                    {rep}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {(search || filterRep !== 'all') && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {search && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
              </span>
            )}
            {filterRep !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Rep: {filterRep}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterRep('all')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading visits...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No visits found</h3>
          <p className="text-gray-600 mb-6">
            {search || filterRep !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Get started by logging your first client visit'
            }
          </p>
          {!search && filterRep === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              Log First Visit
            </button>
          )}
        </div>
      )}

      {/* VISITS LIST */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(visit => (
            <VisitCard
              key={visit.id}
              visit={visit}
              onEdit={() => {
                setEditVisit({
                  ...visit,
                  visitDate: visit.visitDate?.toDate 
                    ? visit.visitDate.toDate().toISOString().split('T')[0]
                    : visit.visitDate
                });
              }}
              onDelete={() => deleteVisit(visit.id)}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Log New Visit">
          <form onSubmit={createVisit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Select Client *
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
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
                <MapPin className="w-4 h-4 inline mr-2" />
                Visit Address *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="123 Main St, Cairo, Egypt"
                required
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Visit Date *
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
                value={form.visitDate}
                onChange={e => setForm({ ...form, visitDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-2" />
                Visit Purpose *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Product demo, Contract signing, Follow-up meeting"
                required
                value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Visit Result
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="What happened during the visit?"
                rows="3"
                value={form.result}
                onChange={e => setForm({ ...form, result: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Next Step
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="What should happen next?"
                rows="2"
                value={form.nextStep}
                onChange={e => setForm({ ...form, nextStep: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50"
              >
                Log Visit
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
      {editVisit && (
        <Modal onClose={() => setEditVisit(null)} title="Edit Visit">
          <div className="space-y-4">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Client
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                value={editVisit.dealId}
                onChange={e => setEditVisit({ ...editVisit, dealId: e.target.value })}
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
                <MapPin className="w-4 h-4 inline mr-2" />
                Address
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={editVisit.address}
                onChange={e => setEditVisit({ ...editVisit, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Visit Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={editVisit.visitDate}
                onChange={e => setEditVisit({ ...editVisit, visitDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-2" />
                Purpose
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={editVisit.purpose}
                onChange={e => setEditVisit({ ...editVisit, purpose: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Result
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                rows="3"
                value={editVisit.result}
                onChange={e => setEditVisit({ ...editVisit, result: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Next Step
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                rows="2"
                value={editVisit.nextStep}
                onChange={e => setEditVisit({ ...editVisit, nextStep: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={saveEdit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditVisit(null)}
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

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ============================= */

function VisitCard({ visit, onEdit, onDelete, canDelete }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        
        {/* Left Section */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">{visit.businessName}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <User className="w-4 h-4" />
                {visit.salesRepName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
              <span>{visit.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 flex-shrink-0 text-blue-600" />
              <span>{formatDate(visit.visitDate)}</span>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" /> PURPOSE
            </p>
            <p className="text-sm text-gray-700">{visit.purpose}</p>
          </div>

          {visit.result && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> RESULT
              </p>
              <p className="text-sm text-gray-700">{visit.result}</p>
            </div>
          )}

          {visit.nextStep && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> NEXT STEP
              </p>
              <p className="text-sm text-gray-700">{visit.nextStep}</p>
            </div>
          )}
        </div>

        {/* Right Section - Date Badge */}
        <div className="flex lg:flex-col gap-2 items-start">
          <div className="px-4 py-2 bg-gray-100 rounded-xl text-center">
            <p className="text-xs text-gray-600 mb-1">Visit Date</p>
            <p className="text-sm font-bold text-gray-900">{formatDate(visit.visitDate)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg font-medium transition-all"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>

        {canDelete && (
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
