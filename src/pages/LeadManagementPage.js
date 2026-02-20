import React, { useState, useEffect } from 'react';
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
  orderBy
} from 'firebase/firestore';
import {
  Plus,
  Trash2,
  Edit,
  X,
  Search,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LeadManagementPage() {
  const { currentUser, userRole } = useAuth();
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);

  const [formData, setFormData] = useState({
    leadName: '',
    email: '',
    phone: '',
    campaignId: '',
    source: 'organic',
    status: 'New',
    assignedTo: '',
    budget: '',
    leadDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const statuses = ['New', 'Contacted', 'Qualified', 'Closed', 'Lost'];
  const sources = ['organic', 'paid_ad', 'referral', 'direct', 'email'];

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads
      let leadsQuery;
      if (userRole === 'admin' || userRole === 'finance_manager') {
        leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
      } else {
        leadsQuery = query(
          collection(db, 'leads'),
          where('createdBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      }

      const leadsSnapshot = await getDocs(leadsQuery);
      setLeads(leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch campaigns
      let campaignsQuery;
      if (userRole === 'admin' || userRole === 'finance_manager') {
        campaignsQuery = query(collection(db, 'campaigns'));
      } else {
        campaignsQuery = query(
          collection(db, 'campaigns'),
          where('createdBy', '==', currentUser.uid)
        );
      }

      const campaignsSnapshot = await getDocs(campaignsQuery);
      setCampaigns(campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch users for assignment
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!formData.leadName || !formData.email) {
      alert('Please fill required fields');
      return;
    }

    try {
      const campaign = campaigns.find(c => c.id === formData.campaignId);

      await addDoc(collection(db, 'leads'), {
        ...formData,
        budget: Number(formData.budget) || 0,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        campaignName: campaign?.campaignName,
        conversionRate: 0
      });

      resetForm();
      await fetchData();
      setShowForm(false);
      alert('✅ Lead created!');
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!editingLead.id) return;

    try {
      await updateDoc(doc(db, 'leads', editingLead.id), {
        ...formData,
        budget: Number(formData.budget) || 0,
        updatedAt: serverTimestamp()
      });

      resetForm();
      await fetchData();
      setEditingLead(null);
      alert('✅ Lead updated!');
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;

    try {
      await deleteDoc(doc(db, 'leads', id));
      await fetchData();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'leads', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      leadName: '',
      email: '',
      phone: '',
      campaignId: '',
      source: 'organic',
      status: 'New',
      assignedTo: '',
      budget: '',
      leadDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const openEditForm = (lead) => {
    setFormData(lead);
    setEditingLead(lead);
    setShowForm(true);
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.leadName?.toLowerCase().includes(search.toLowerCase()) ||
                         l.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-700',
      'Contacted': 'bg-yellow-100 text-yellow-700',
      'Qualified': 'bg-purple-100 text-purple-700',
      'Closed': 'bg-green-100 text-green-700',
      'Lost': 'bg-red-100 text-red-700'
    };
    return colors[status] || colors['New'];
  };

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    closed: leads.filter(l => l.status === 'Closed').length,
    conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'Closed').length / leads.length) * 100).toFixed(1) : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            Lead Management
          </h1>
          <p className="text-gray-600 mt-1">Track and manage leads from campaigns</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingLead(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          New Lead
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-gray-600 font-semibold mb-2">TOTAL LEADS</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-blue-600 font-semibold mb-2">NEW</p>
          <p className="text-2xl font-bold text-blue-900">{stats.new}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-purple-600 font-semibold mb-2">QUALIFIED</p>
          <p className="text-2xl font-bold text-purple-900">{stats.qualified}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-green-600 font-semibold mb-2">CLOSED</p>
          <p className="text-2xl font-bold text-green-900">{stats.closed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <p className="text-xs text-orange-600 font-semibold mb-2">CONVERSION</p>
          <p className="text-2xl font-bold text-orange-900">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-white"
        >
          <option value="all">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* LEADS TABLE */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No leads found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4 font-semibold text-gray-900">{lead.leadName}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{lead.campaignName || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{lead.source}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingLead(lead)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-all"
                          title="View"
                        >
                          <Eye size={18} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => openEditForm(lead)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit size={18} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingLead ? 'Edit Lead' : 'Create Lead'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setEditingLead(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={editingLead ? handleUpdateLead : handleAddLead} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <input
                type="text"
                placeholder="Lead Name *"
                value={formData.leadName}
                onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />

                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              <select
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-white"
              >
                <option value="">Select Campaign</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.campaignName}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-white"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-white"
                >
                  {sources.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <input
                type="number"
                placeholder="Budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingLead ? 'Update Lead' : 'Create Lead'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setEditingLead(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL VIEW */}
      {viewingLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{viewingLead.leadName}</h2>
              <button
                onClick={() => setViewingLead(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">EMAIL</p>
                  <p className="text-lg font-bold text-gray-900">{viewingLead.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">PHONE</p>
                  <p className="text-lg font-bold text-gray-900">{viewingLead.phone || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">STATUS</p>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-lg ${getStatusColor(viewingLead.status)}`}>
                    {viewingLead.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">SOURCE</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{viewingLead.source}</p>
                </div>
              </div>

              {viewingLead.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">NOTES</p>
                  <p className="text-gray-700">{viewingLead.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    openEditForm(viewingLead);
                    setViewingLead(null);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
