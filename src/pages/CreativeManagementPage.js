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
  ImageIcon,
  Video,
  FileText,
  TrendingUp,
  Eye,
  Copy,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CreativeManagementPage() {
  const { currentUser, userRole } = useAuth();
  const [creatives, setCreatives] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCreative, setEditingCreative] = useState(null);
  const [viewingCreative, setViewingCreative] = useState(null);

  const [formData, setFormData] = useState({
    creativeName: '',
    campaignId: '',
    type: 'Static',
    mediaUrl: '',
    primaryText: '',
    headline: '',
    cta: '',
    performanceScore: 0,
    abTestId: '',
    notes: ''
  });

  const types = ['Static', 'Video', 'Carousel'];
  const ctaOptions = ['Learn More', 'Shop Now', 'Sign Up', 'Download', 'Book Now', 'Contact Us'];

  useEffect(() => {
    if (currentUser?.uid) {
      fetchCampaigns();
      fetchCreatives();
    }
  }, [currentUser, userRole]);

  const fetchCampaigns = async () => {
    try {
      let q;
      if (userRole === 'admin' || userRole === 'finance_manager') {
        q = query(collection(db, 'campaigns'));
      } else {
        q = query(
          collection(db, 'campaigns'),
          where('createdBy', '==', currentUser.uid)
        );
      }
      const snapshot = await getDocs(q);
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchCreatives = async () => {
    try {
      setLoading(true);
      let q;

      if (userRole === 'admin' || userRole === 'finance_manager') {
        q = query(collection(db, 'creatives'), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db, 'creatives'),
          where('createdBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      setCreatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching creatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCreative = async (e) => {
    e.preventDefault();
    if (!formData.creativeName || !formData.campaignId) {
      alert('Please fill required fields');
      return;
    }

    try {
      const campaign = campaigns.find(c => c.id === formData.campaignId);

      await addDoc(collection(db, 'creatives'), {
        ...formData,
        performanceScore: Number(formData.performanceScore) || 0,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        campaignName: campaign?.campaignName,
        performanceHistory: []
      });

      resetForm();
      await fetchCreatives();
      setShowForm(false);
      alert('✅ Creative created successfully!');
    } catch (error) {
      console.error('Error creating creative:', error);
      alert('Failed to create creative');
    }
  };

  const handleUpdateCreative = async (e) => {
    e.preventDefault();
    if (!editingCreative.id) return;

    try {
      await updateDoc(doc(db, 'creatives', editingCreative.id), {
        ...formData,
        performanceScore: Number(formData.performanceScore) || 0,
        updatedAt: serverTimestamp()
      });

      resetForm();
      await fetchCreatives();
      setEditingCreative(null);
      alert('✅ Creative updated!');
    } catch (error) {
      console.error('Error updating creative:', error);
    }
  };

  const handleDeleteCreative = async (id) => {
    if (!window.confirm('Delete this creative?')) return;

    try {
      await deleteDoc(doc(db, 'creatives', id));
      await fetchCreatives();
    } catch (error) {
      console.error('Error deleting creative:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      creativeName: '',
      campaignId: '',
      type: 'Static',
      mediaUrl: '',
      primaryText: '',
      headline: '',
      cta: '',
      performanceScore: 0,
      abTestId: '',
      notes: ''
    });
  };

  const openEditForm = (creative) => {
    setFormData(creative);
    setEditingCreative(creative);
    setShowForm(true);
  };

  const filteredCreatives = creatives.filter(c => {
    const matchesSearch = c.creativeName?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Video':
        return <Video size={20} className="text-blue-600" />;
      case 'Carousel':
        return <Award size={20} className="text-purple-600" />;
      default:
        return <ImageIcon size={20} className="text-green-600" />;
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            Creative Management
          </h1>
          <p className="text-gray-600 mt-1">Upload and manage ad creatives</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingCreative(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          New Creative
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search creatives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
        >
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* CREATIVES GRID */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
          </div>
        </div>
      ) : filteredCreatives.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No creatives found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreatives.map(creative => (
            <div key={creative.id} className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl transition-all overflow-hidden group">
              {/* Preview */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                {creative.mediaUrl ? (
                  <img
                    src={creative.mediaUrl}
                    alt={creative.creativeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    {getTypeIcon(creative.type)}
                    <p className="text-gray-600 text-sm mt-2">{creative.type}</p>
                  </div>
                )}

                {/* Performance Overlay */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg font-bold text-xs ${getPerformanceColor(creative.performanceScore)}`}>
                  {creative.performanceScore}%
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{creative.creativeName}</h3>
                    <p className="text-xs text-gray-500">{creative.campaignName}</p>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                    {creative.type}
                  </span>
                </div>

                {creative.headline && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Headline</p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{creative.headline}</p>
                  </div>
                )}

                {creative.cta && (
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-blue-600 font-semibold">{creative.cta}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setViewingCreative(creative)}
                    className="flex-1 p-2 hover:bg-blue-100 rounded-lg transition-all"
                    title="View"
                  >
                    <Eye size={18} className="text-blue-600 mx-auto" />
                  </button>
                  <button
                    onClick={() => openEditForm(creative)}
                    className="flex-1 p-2 hover:bg-green-100 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit size={18} className="text-green-600 mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDeleteCreative(creative.id)}
                    className="flex-1 p-2 hover:bg-red-100 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} className="text-red-600 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingCreative ? 'Edit Creative' : 'Create Creative'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setEditingCreative(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={editingCreative ? handleUpdateCreative : handleAddCreative} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <input
                type="text"
                placeholder="Creative Name *"
                value={formData.creativeName}
                onChange={(e) => setFormData({ ...formData, creativeName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />

              <select
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
              >
                <option value="">Select Campaign *</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.campaignName}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
                >
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Performance Score (0-100)"
                  value={formData.performanceScore}
                  onChange={(e) => setFormData({ ...formData, performanceScore: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <input
                type="url"
                placeholder="Media URL"
                value={formData.mediaUrl}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />

              <textarea
                placeholder="Primary Text"
                value={formData.primaryText}
                onChange={(e) => setFormData({ ...formData, primaryText: e.target.value })}
                rows="2"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
              />

              <input
                type="text"
                placeholder="Headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />

              <select
                value={formData.cta}
                onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
              >
                <option value="">Select CTA</option>
                {ctaOptions.map(cta => (
                  <option key={cta} value={cta}>{cta}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="A/B Test ID (optional)"
                value={formData.abTestId}
                onChange={(e) => setFormData({ ...formData, abTestId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingCreative ? 'Update Creative' : 'Create Creative'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setEditingCreative(null);
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
      {viewingCreative && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{viewingCreative.creativeName}</h2>
              <button
                onClick={() => setViewingCreative(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {viewingCreative.mediaUrl && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={viewingCreative.mediaUrl}
                    alt={viewingCreative.creativeName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">TYPE</p>
                  <p className="text-lg font-bold text-gray-900">{viewingCreative.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">PERFORMANCE</p>
                  <p className="text-lg font-bold text-green-600">{viewingCreative.performanceScore}%</p>
                </div>
              </div>

              {viewingCreative.headline && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">HEADLINE</p>
                  <p className="text-gray-900">{viewingCreative.headline}</p>
                </div>
              )}

              {viewingCreative.primaryText && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">PRIMARY TEXT</p>
                  <p className="text-gray-700">{viewingCreative.primaryText}</p>
                </div>
              )}

              {viewingCreative.cta && (
                <div className="px-4 py-3 bg-blue-100 rounded-lg">
                  <p className="text-xs font-semibold text-blue-600 mb-1">CALL TO ACTION</p>
                  <p className="text-blue-900 font-bold">{viewingCreative.cta}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
