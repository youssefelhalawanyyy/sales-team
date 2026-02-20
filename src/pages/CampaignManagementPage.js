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
  Zap,
  TrendingUp,
  DollarSign,
  Users,
  Copy,
  Pause,
  Play,
  Archive,
  Eye,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CampaignManagementPage() {
  const { currentUser, userRole } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [viewingCampaign, setViewingCampaign] = useState(null);

  const [formData, setFormData] = useState({
    campaignName: '',
    profileId: '',
    platform: 'Meta',
    objective: 'Traffic',
    budgetType: 'daily',
    budget: '',
    dailyBudget: '',
    monthlyBudget: '',
    startDate: '',
    endDate: '',
    targetAudience: '',
    creatives: [],
    status: 'Draft',
    performanceMetrics: {
      impressions: 0,
      reach: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      conversions: 0,
      cpa: 0,
      roas: 0
    },
    notes: ''
  });

  const platforms = ['Meta', 'Google', 'TikTok', 'LinkedIn'];
  const objectives = ['Traffic', 'Conversions', 'Leads', 'Engagement'];
  const statuses = ['Draft', 'Active', 'Paused', 'Completed', 'Archived'];

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProfiles();
      fetchCampaigns();
    }
  }, [currentUser, userRole]);

  const fetchProfiles = async () => {
    try {
      let q;
      if (userRole === 'admin' || userRole === 'finance_manager') {
        q = query(collection(db, 'marketingProfiles'));
      } else {
        q = query(
          collection(db, 'marketingProfiles'),
          where('createdBy', '==', currentUser.uid)
        );
      }
      const snapshot = await getDocs(q);
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      let q;

      if (userRole === 'admin' || userRole === 'finance_manager') {
        q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db, 'campaigns'),
          where('createdBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    if (!formData.campaignName || !formData.profileId) {
      alert('Please fill required fields');
      return;
    }

    try {
      const profile = profiles.find(p => p.id === formData.profileId);
      
      await addDoc(collection(db, 'campaigns'), {
        ...formData,
        budget: Number(formData.budget) || 0,
        dailyBudget: Number(formData.dailyBudget) || 0,
        monthlyBudget: Number(formData.monthlyBudget) || 0,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        profileName: profile?.businessName,
        performanceHistory: []
      });

      resetForm();
      await fetchCampaigns();
      setShowForm(false);
      alert('✅ Campaign created successfully!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    if (!editingCampaign.id) return;

    try {
      await updateDoc(doc(db, 'campaigns', editingCampaign.id), {
        ...formData,
        budget: Number(formData.budget) || 0,
        dailyBudget: Number(formData.dailyBudget) || 0,
        monthlyBudget: Number(formData.monthlyBudget) || 0,
        updatedAt: serverTimestamp()
      });

      resetForm();
      await fetchCampaigns();
      setEditingCampaign(null);
      alert('✅ Campaign updated successfully!');
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;

    try {
      await deleteDoc(doc(db, 'campaigns', id));
      await fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'campaigns', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      await fetchCampaigns();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDuplicateCampaign = async (campaign) => {
    try {
      const { id, createdAt, ...campaignData } = campaign;
      
      await addDoc(collection(db, 'campaigns'), {
        ...campaignData,
        campaignName: `${campaignData.campaignName} (Copy)`,
        status: 'Draft',
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      });

      await fetchCampaigns();
      alert('✅ Campaign duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating campaign:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      campaignName: '',
      profileId: '',
      platform: 'Meta',
      objective: 'Traffic',
      budgetType: 'daily',
      budget: '',
      dailyBudget: '',
      monthlyBudget: '',
      startDate: '',
      endDate: '',
      targetAudience: '',
      creatives: [],
      status: 'Draft',
      performanceMetrics: {
        impressions: 0,
        reach: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        conversions: 0,
        cpa: 0,
        roas: 0
      },
      notes: ''
    });
  };

  const openEditForm = (campaign) => {
    setFormData(campaign);
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.campaignName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-700',
      'Active': 'bg-green-100 text-green-700',
      'Paused': 'bg-yellow-100 text-yellow-700',
      'Completed': 'bg-blue-100 text-blue-700',
      'Archived': 'bg-gray-200 text-gray-600'
    };
    return colors[status] || colors['Draft'];
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            Campaign Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage advertising campaigns</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingCampaign(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
        >
          <option value="all">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* CAMPAIGNS TABLE */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Zap className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No campaigns found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">ROAS</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCampaigns.map(campaign => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{campaign.campaignName}</p>
                        <p className="text-sm text-gray-500">{campaign.profileName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg">
                        {campaign.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">
                      ${campaign.budget?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-lg ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {campaign.startDate} to {campaign.endDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">
                        {campaign.performanceMetrics?.roas?.toFixed(2) || '0.00'}x
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingCampaign(campaign)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-all"
                          title="View"
                        >
                          <Eye size={18} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => openEditForm(campaign)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit size={18} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => handleDuplicateCampaign(campaign)}
                          className="p-2 hover:bg-purple-100 rounded-lg transition-all"
                          title="Duplicate"
                        >
                          <Copy size={18} className="text-purple-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
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
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setEditingCampaign(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={editingCampaign ? handleUpdateCampaign : handleAddCampaign} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <input
                type="text"
                placeholder="Campaign Name *"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              <select
                value={formData.profileId}
                onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
              >
                <option value="">Select Client Profile *</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.businessName}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                >
                  {platforms.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                >
                  {objectives.map(obj => (
                    <option key={obj} value={obj}>{obj}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="Budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />

                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />

                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <textarea
                placeholder="Target Audience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(formData.performanceMetrics).map(metric => (
                    <input
                      key={metric}
                      type="number"
                      placeholder={metric.toUpperCase()}
                      value={formData.performanceMetrics[metric]}
                      onChange={(e) => setFormData({
                        ...formData,
                        performanceMetrics: {
                          ...formData.performanceMetrics,
                          [metric]: Number(e.target.value) || 0
                        }
                      })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setEditingCampaign(null);
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
      {viewingCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{viewingCampaign.campaignName}</h2>
              <button
                onClick={() => setViewingCampaign(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">PLATFORM</p>
                  <p className="text-lg font-bold text-gray-900">{viewingCampaign.platform}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">OBJECTIVE</p>
                  <p className="text-lg font-bold text-gray-900">{viewingCampaign.objective}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 font-semibold mb-1">BUDGET</p>
                  <p className="text-2xl font-bold text-blue-700">${viewingCampaign.budget?.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <p className="text-xs text-green-600 font-semibold mb-1">ROAS</p>
                  <p className="text-2xl font-bold text-green-700">{viewingCampaign.performanceMetrics?.roas?.toFixed(2)}x</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <p className="text-xs text-purple-600 font-semibold mb-1">CONVERSIONS</p>
                  <p className="text-2xl font-bold text-purple-700">{viewingCampaign.performanceMetrics?.conversions || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">PERFORMANCE METRICS</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Impressions</p>
                    <p className="text-lg font-bold text-gray-900">{viewingCampaign.performanceMetrics?.impressions?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Reach</p>
                    <p className="text-lg font-bold text-gray-900">{viewingCampaign.performanceMetrics?.reach?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">CTR</p>
                    <p className="text-lg font-bold text-gray-900">{viewingCampaign.performanceMetrics?.ctr?.toFixed(2)}%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">CPC</p>
                    <p className="text-lg font-bold text-gray-900">${viewingCampaign.performanceMetrics?.cpc?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {viewingCampaign.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">NOTES</p>
                  <p className="text-gray-700">{viewingCampaign.notes}</p>
                </div>
              )}

              {(userRole === 'admin' || userRole === 'sales_manager') && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      openEditForm(viewingCampaign);
                      setViewingCampaign(null);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(viewingCampaign.id, viewingCampaign.status === 'Active' ? 'Paused' : 'Active');
                      setViewingCampaign(null);
                    }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all"
                  >
                    {viewingCampaign.status === 'Active' ? 'Pause' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
