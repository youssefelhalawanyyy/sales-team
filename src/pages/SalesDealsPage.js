import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  arrayUnion
} from 'firebase/firestore';

import { 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Archive, 
  DollarSign, 
  Users, 
  Briefcase, 
  Phone, 
  Mail, 
  FileText,
  Eye,
  ExternalLink
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

import { formatCurrency } from '../utils/currency';

/* ============================= */

const STATUSES = [
  { value: 'potential_client', label: 'Potential Client', color: 'blue', icon: Users },
  { value: 'pending_approval', label: 'Pending Approval', color: 'yellow', icon: Clock },
  { value: 'closed', label: 'Closed', color: 'green', icon: CheckCircle2 },
  { value: 'lost', label: 'Lost', color: 'red', icon: XCircle }
];

/* ============================= */

export default function SalesDealsPage() {
  console.log('SALES PAGE LOADED');

  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editDeal, setEditDeal] = useState(null);

  const [form, setForm] = useState({
    businessName: '',
    contactPerson: '',
    phoneNumber: '',
    status: 'potential_client',
    price: '',
    notes: ''
  });

  /* ============================= */

  useEffect(() => {
    if (currentUser?.uid) loadDeals();
  }, [currentUser]);

  /* ============================= */

  async function loadDeals() {
    try {
      setLoading(true);

      const q = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc')
      );

      const snap = await getDocs(q);

      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setDeals(list.filter(d => !d.archived));

    } catch (e) {
      console.error(e);
      alert('Failed loading deals');
    }

    setLoading(false);
  }

  /* ============================= */

  async function createDeal(e) {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'sales'), {
        ...form,

        price: Number(form.price) || 0,

        createdBy: currentUser.uid,
        createdByName:
          currentUser.firstName + ' ' + currentUser.lastName,

        archived: false,

        createdAt: serverTimestamp(),
        
        // Initialize edit history
        editHistory: []
      });

      setForm({
        businessName: '',
        contactPerson: '',
        phoneNumber: '',
        status: 'potential_client',
        price: '',
        notes: ''
      });

      setShowForm(false);

      loadDeals();

    } catch (e) {
      alert('Create failed');
      console.error(e);
    }
  }

  /* ============================= */

  async function saveEdit() {
    try {
      const dealRef = doc(db, 'sales', editDeal.id);
      
      // Find what changed
      const originalDeal = deals.find(d => d.id === editDeal.id);
      const changes = {};
      
      const fieldsToTrack = ['businessName', 'contactPerson', 'phoneNumber', 'status', 'price', 'notes'];
      
      fieldsToTrack.forEach(field => {
        if (originalDeal[field] !== editDeal[field]) {
          changes[field] = {
            from: originalDeal[field],
            to: editDeal[field]
          };
        }
      });

      // Create edit history entry
      const historyEntry = {
        timestamp: new Date(),
        editedBy: currentUser.uid,
        editedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        changes: changes
      };

      await updateDoc(dealRef, {
        ...editDeal,
        price: Number(editDeal.price) || 0,
        editHistory: arrayUnion(historyEntry)
      });

      setEditDeal(null);

      loadDeals();

    } catch (e) {
      alert('Update failed');
      console.error(e);
    }
  }

  /* ============================= */

  async function archiveDeal(id) {
    if (!window.confirm('Archive deal?')) return;

    await updateDoc(doc(db, 'sales', id), {
      archived: true
    });

    loadDeals();
  }

  /* ============================= */

  async function deleteDeal(id) {
    if (userRole !== 'admin') return;

    if (!window.confirm('DELETE FOREVER?')) return;

    await deleteDoc(doc(db, 'sales', id));

    loadDeals();
  }

  /* ============================= */

  const filtered = deals.filter(d => {
    const s =
      d.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      d.contactPerson?.toLowerCase().includes(search.toLowerCase());

    const f = filter === 'all' || d.status === filter;

    return s && f;
  });

  /* ============================= */

  const totalRevenue = filtered
    .filter(d => d.status === 'closed')
    .reduce((s, d) => s + (d.price || 0), 0);

  const potentialRevenue = filtered
    .filter(d => d.status === 'potential_client' || d.status === 'pending_approval')
    .reduce((s, d) => s + (d.price || 0), 0);

  /* ============================= */

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            Sales Deals
          </h1>
          <p className="text-gray-600 mt-1 ml-15">Manage and track your sales pipeline</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:scale-105"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Add New Deal</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Deals"
          value={filtered.length}
          icon={Briefcase}
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Closed Deals"
          value={filtered.filter(d => d.status === 'closed').length}
          icon={CheckCircle2}
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="purple"
          subtitle="From closed deals"
        />
        <StatCard
          title="Pending Approval"
          value={filtered.filter(d => d.status === 'pending_approval').length}
          icon={Clock}
          color="yellow"
          subtitle={formatCurrency(potentialRevenue) + " potential"}
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search by business or contact name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter */}
          <div className="relative sm:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
              value={filter}
              onChange={e => setFilter(e.target.value)}
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
        {(search || filter !== 'all') && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {search && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
              </span>
            )}
            {filter !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Status: {STATUSES.find(s => s.value === filter)?.label}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilter('all')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading deals...</p>
        </div>
      )}

      {/* DEALS GRID/TABLE */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-600 mb-6">
            {search || filter !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Get started by creating your first deal'
            }
          </p>
          {!search && filter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              Create First Deal
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(d => (
            <DealCard
              key={d.id}
              deal={d}
              onEdit={() => setEditDeal(d)}
              onArchive={() => archiveDeal(d.id)}
              onDelete={() => deleteDeal(d.id)}
              onViewProfile={() => navigate(`/sales/client/${d.id}`)}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Create New Deal">
          <form onSubmit={createDeal} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Business Name *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter business name"
                required
                value={form.businessName}
                onChange={e => setForm({ ...form, businessName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Contact Person *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter contact person"
                required
                value={form.contactPerson}
                onChange={e => setForm({ ...form, contactPerson: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter phone number"
                required
                value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Deal Value
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Notes
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Add any additional notes..."
                rows="3"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50"
              >
                Create Deal
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
      {editDeal && (
        <Modal onClose={() => setEditDeal(null)} title="Edit Deal">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Business Name
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={editDeal.businessName}
                onChange={e => setEditDeal({ ...editDeal, businessName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Contact Person
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={editDeal.contactPerson}
                onChange={e => setEditDeal({ ...editDeal, contactPerson: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={editDeal.phoneNumber}
                onChange={e => setEditDeal({ ...editDeal, phoneNumber: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                  value={editDeal.status}
                  onChange={e => setEditDeal({ ...editDeal, status: e.target.value })}
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Deal Value
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  type="number"
                  step="0.01"
                  value={editDeal.price}
                  onChange={e => setEditDeal({ ...editDeal, price: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Notes
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows="3"
                value={editDeal.notes || ''}
                onChange={e => setEditDeal({ ...editDeal, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={saveEdit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditDeal(null)}
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

function StatCard({ title, value, icon: Icon, color, trend, subtitle }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}

/* ============================= */

function DealCard({ deal, onEdit, onArchive, onDelete, onViewProfile, userRole }) {
  const status = STATUSES.find(s => s.value === deal.status);
  const StatusIcon = status?.icon || Briefcase;

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Section */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">{deal.businessName}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Users className="w-4 h-4" />
                {deal.contactPerson}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {deal.phoneNumber}
            </span>
            {deal.createdByName && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                by {deal.createdByName}
              </span>
            )}
          </div>

          {deal.notes && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
              💬 {deal.notes}
            </p>
          )}
        </div>

        {/* Right Section */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4">
          
          {/* Price */}
          <div className="text-left sm:text-center lg:text-right">
            <p className="text-sm text-gray-600 mb-1">Deal Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(deal.price || 0)}</p>
          </div>

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-xl font-semibold text-sm border flex items-center gap-2 ${colorClasses[status?.color]}`}>
            <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
            {status?.label || deal.status}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
        <button
          onClick={onViewProfile}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium transition-all"
        >
          <Eye className="w-4 h-4" />
          <span>View Profile</span>
        </button>

        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-all"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
        
        <button
          onClick={onArchive}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-lg font-medium transition-all"
        >
          <Archive className="w-4 h-4" />
          <span>Archive</span>
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
        <div className="p-6">
          {children}
        </div>
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