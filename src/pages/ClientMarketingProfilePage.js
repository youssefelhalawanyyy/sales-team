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
  Building2,
  Target,
  DollarSign,
  Users,
  Palette,
  TrendingUp,
  Eye,
  Archive
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ClientMarketingProfilePage() {
  const { currentUser, userRole } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);

  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    targetAudience: '',
    monthlyBudget: '',
    platformsUsed: [],
    brandAssets: {
      logo: '',
      colors: '',
      toneOfVoice: ''
    },
    businessGoals: [],
    kpiTargets: {
      leads: '',
      sales: '',
      awareness: ''
    },
    funnelType: 'awareness'
  });

  const platforms = ['Meta', 'Google', 'TikTok', 'SEO', 'Email'];
  const goals = ['Leads', 'Sales', 'Awareness'];
  const funnelTypes = ['awareness', 'consideration', 'conversion'];

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProfiles();
    }
  }, [currentUser, userRole]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      let q;

      if (userRole === 'admin' || userRole === 'finance_manager') {
        q = query(collection(db, 'marketingProfiles'), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db, 'marketingProfiles'),
          where('createdBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    if (!formData.businessName) {
      alert('Please enter business name');
      return;
    }

    try {
      await addDoc(collection(db, 'marketingProfiles'), {
        ...formData,
        monthlyBudget: Number(formData.monthlyBudget) || 0,
        kpiTargets: {
          leads: Number(formData.kpiTargets.leads) || 0,
          sales: Number(formData.kpiTargets.sales) || 0,
          awareness: Number(formData.kpiTargets.awareness) || 0
        },
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      resetForm();
      await fetchProfiles();
      setShowForm(false);
      alert('✅ Profile created successfully!');
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editingProfile.id) return;

    try {
      await updateDoc(doc(db, 'marketingProfiles', editingProfile.id), {
        ...formData,
        monthlyBudget: Number(formData.monthlyBudget) || 0,
        kpiTargets: {
          leads: Number(formData.kpiTargets.leads) || 0,
          sales: Number(formData.kpiTargets.sales) || 0,
          awareness: Number(formData.kpiTargets.awareness) || 0
        },
        updatedAt: serverTimestamp()
      });

      resetForm();
      await fetchProfiles();
      setEditingProfile(null);
      alert('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;

    try {
      await deleteDoc(doc(db, 'marketingProfiles', id));
      await fetchProfiles();
      alert('✅ Profile deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete profile');
    }
  };

  const resetForm = () => {
    setFormData({
      businessName: '',
      industry: '',
      targetAudience: '',
      monthlyBudget: '',
      platformsUsed: [],
      brandAssets: {
        logo: '',
        colors: '',
        toneOfVoice: ''
      },
      businessGoals: [],
      kpiTargets: {
        leads: '',
        sales: '',
        awareness: ''
      },
      funnelType: 'awareness'
    });
  };

  const openEditForm = (profile) => {
    setFormData(profile);
    setEditingProfile(profile);
    setShowForm(true);
  };

  const handlePlatformToggle = (platform) => {
    setFormData(prev => ({
      ...prev,
      platformsUsed: prev.platformsUsed.includes(platform)
        ? prev.platformsUsed.filter(p => p !== platform)
        : [...prev.platformsUsed, platform]
    }));
  };

  const handleGoalToggle = (goal) => {
    setFormData(prev => ({
      ...prev,
      businessGoals: prev.businessGoals.includes(goal)
        ? prev.businessGoals.filter(g => g !== goal)
        : [...prev.businessGoals, goal]
    }));
  };

  const filteredProfiles = profiles.filter(p =>
    p.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    p.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Palette className="w-6 h-6 text-white" />
            </div>
            Client Marketing Profiles
          </h1>
          <p className="text-gray-600 mt-1">Manage comprehensive marketing profiles for each client</p>
        </div>

        {(userRole === 'admin' || userRole === 'sales_manager') && (
          <button
            onClick={() => {
              resetForm();
              setEditingProfile(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            New Profile
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-4 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by business name or industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
      </div>

      {/* PROFILES GRID */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">No profiles found</p>
          {showForm === false && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            >
              Create First Profile
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(profile => (
            <div key={profile.id} className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl transition-all overflow-hidden group">
              <div className="p-6 space-y-4">
                {/* Title */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{profile.businessName}</h3>
                    <p className="text-sm text-gray-500 mt-1">{profile.industry}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditForm(profile)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Budget */}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={16} className="text-green-600" />
                  <span className="font-semibold">${profile.monthlyBudget?.toLocaleString()}</span>
                  <span className="text-gray-500">monthly budget</span>
                </div>

                {/* Platforms */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.platformsUsed?.map(platform => (
                      <span key={platform} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Goals</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.businessGoals?.map(goal => (
                      <span key={goal} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => setViewingProfile(profile)}
                  className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingProfile ? 'Edit Profile' : 'Create New Profile'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setEditingProfile(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={editingProfile ? handleUpdateProfile : handleAddProfile} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Business Information</h3>

                <input
                  type="text"
                  placeholder="Business Name *"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />

                <input
                  type="text"
                  placeholder="Industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />

                <textarea
                  placeholder="Target Audience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                />

                <input
                  type="number"
                  placeholder="Monthly Budget"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Platforms */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900">Marketing Platforms</h3>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map(platform => (
                    <label key={platform} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.platformsUsed.includes(platform)}
                        onChange={() => handlePlatformToggle(platform)}
                        className="w-5 h-5 rounded"
                      />
                      <span className="font-semibold text-gray-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Business Goals */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900">Business Goals</h3>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map(goal => (
                    <label key={goal} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.businessGoals.includes(goal)}
                        onChange={() => handleGoalToggle(goal)}
                        className="w-5 h-5 rounded"
                      />
                      <span className="font-semibold text-gray-700">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand Assets */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Brand Assets</h3>

                <input
                  type="url"
                  placeholder="Logo URL"
                  value={formData.brandAssets.logo}
                  onChange={(e) => setFormData({
                    ...formData,
                    brandAssets: { ...formData.brandAssets, logo: e.target.value }
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />

                <input
                  type="text"
                  placeholder="Brand Colors (e.g., #FF5733, #33FF57)"
                  value={formData.brandAssets.colors}
                  onChange={(e) => setFormData({
                    ...formData,
                    brandAssets: { ...formData.brandAssets, colors: e.target.value }
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />

                <textarea
                  placeholder="Tone of Voice"
                  value={formData.brandAssets.toneOfVoice}
                  onChange={(e) => setFormData({
                    ...formData,
                    brandAssets: { ...formData.brandAssets, toneOfVoice: e.target.value }
                  })}
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* KPI Targets */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">KPI Targets</h3>

                <input
                  type="number"
                  placeholder="Lead Target"
                  value={formData.kpiTargets.leads}
                  onChange={(e) => setFormData({
                    ...formData,
                    kpiTargets: { ...formData.kpiTargets, leads: e.target.value }
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />

                <input
                  type="number"
                  placeholder="Sales Target"
                  value={formData.kpiTargets.sales}
                  onChange={(e) => setFormData({
                    ...formData,
                    kpiTargets: { ...formData.kpiTargets, sales: e.target.value }
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />

                <input
                  type="number"
                  placeholder="Awareness Target"
                  value={formData.kpiTargets.awareness}
                  onChange={(e) => setFormData({
                    ...formData,
                    kpiTargets: { ...formData.kpiTargets, awareness: e.target.value }
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Funnel Type */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900">Funnel Type</h3>
                <select
                  value={formData.funnelType}
                  onChange={(e) => setFormData({ ...formData, funnelType: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white"
                >
                  {funnelTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingProfile ? 'Update Profile' : 'Create Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setEditingProfile(null);
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

      {/* DETAIL VIEW MODAL */}
      {viewingProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{viewingProfile.businessName}</h2>
              <button
                onClick={() => setViewingProfile(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">INDUSTRY</p>
                  <p className="text-lg font-bold text-gray-900">{viewingProfile.industry}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">MONTHLY BUDGET</p>
                  <p className="text-lg font-bold text-green-600">${viewingProfile.monthlyBudget?.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">TARGET AUDIENCE</p>
                <p className="text-gray-700">{viewingProfile.targetAudience}</p>
              </div>

              {/* Platforms */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-3">MARKETING PLATFORMS</p>
                <div className="flex flex-wrap gap-2">
                  {viewingProfile.platformsUsed?.map(p => (
                    <span key={p} className="px-3 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-3">BUSINESS GOALS</p>
                <div className="flex flex-wrap gap-2">
                  {viewingProfile.businessGoals?.map(g => (
                    <span key={g} className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Brand Assets */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-600 mb-3">BRAND ASSETS</p>
                {viewingProfile.brandAssets?.logo && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Logo</p>
                    <a href={viewingProfile.brandAssets.logo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {viewingProfile.brandAssets.logo}
                    </a>
                  </div>
                )}
                {viewingProfile.brandAssets?.colors && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Brand Colors</p>
                    <p className="text-gray-600">{viewingProfile.brandAssets.colors}</p>
                  </div>
                )}
                {viewingProfile.brandAssets?.toneOfVoice && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Tone of Voice</p>
                    <p className="text-gray-600">{viewingProfile.brandAssets.toneOfVoice}</p>
                  </div>
                )}
              </div>

              {/* KPI Targets */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-3">KPI TARGETS</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-xs text-blue-600 font-semibold mb-1">LEADS</p>
                    <p className="text-2xl font-bold text-blue-700">{viewingProfile.kpiTargets?.leads || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-xs text-green-600 font-semibold mb-1">SALES</p>
                    <p className="text-2xl font-bold text-green-700">{viewingProfile.kpiTargets?.sales || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <p className="text-xs text-purple-600 font-semibold mb-1">AWARENESS</p>
                    <p className="text-2xl font-bold text-purple-700">{viewingProfile.kpiTargets?.awareness || 0}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">FUNNEL TYPE</p>
                <p className="text-gray-900 font-semibold capitalize">{viewingProfile.funnelType}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
