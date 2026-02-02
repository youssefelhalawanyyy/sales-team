import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X, Briefcase, Users, Building2, FileText } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { enqueueOfflineItem } from '../services/offlineSyncService';
import { fetchPipelineSettings } from '../services/pipelineService';
import { DEFAULT_PIPELINE_STAGES } from '../utils/pipeline';

const initialContact = {
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  notes: ''
};

const initialDeal = {
  businessName: '',
  contactPerson: '',
  phoneNumber: '',
  price: '',
  notes: ''
};

export default function QuickAddFab() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [contactForm, setContactForm] = useState(initialContact);
  const [dealForm, setDealForm] = useState(initialDeal);
  const [submitting, setSubmitting] = useState(false);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadPipeline = async () => {
      const stages = await fetchPipelineSettings();
      setPipelineStages(stages);
    };
    loadPipeline();
  }, [currentUser?.uid]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const defaultStage = pipelineStages[0]?.value || 'potential_client';
  const isOnline = online;

  const teamContext = useMemo(() => ({
    teamId: currentUser?.teamId || null,
    teamName: currentUser?.teamName || null
  }), [currentUser]);

  const closeAll = () => {
    setOpen(false);
    setMode(null);
  };

  const handleSubmitContact = async () => {
    if (!contactForm.companyName || !contactForm.contactName || !contactForm.phone) {
      alert('Please enter company, contact name, and phone.');
      return;
    }

    const payload = {
      companyName: contactForm.companyName,
      contactName: contactForm.contactName,
      phone: contactForm.phone,
      email: contactForm.email || '',
      notes: contactForm.notes || '',
      category: 'Other'
    };

    setSubmitting(true);
    try {
      if (!isOnline) {
        enqueueOfflineItem('contact', payload);
        alert('Saved offline. It will sync automatically when you are online.');
      } else {
        await addDoc(collection(db, 'contacts'), {
          ...payload,
          createdBy: currentUser.uid,
          createdByName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
          createdAt: serverTimestamp(),
          source: 'quick_add'
        });
        alert('Contact created successfully!');
      }
      setContactForm(initialContact);
      closeAll();
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDeal = async () => {
    if (!dealForm.businessName || !dealForm.contactPerson || !dealForm.phoneNumber) {
      alert('Please enter business name, contact person, and phone.');
      return;
    }

    const payload = {
      businessName: dealForm.businessName,
      contactPerson: dealForm.contactPerson,
      phoneNumber: dealForm.phoneNumber,
      status: defaultStage,
      price: Number(dealForm.price) || 0,
      notes: dealForm.notes || '',
      createdByName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      ownerId: currentUser.uid,
      ownerName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      teamId: teamContext.teamId,
      teamName: teamContext.teamName,
      sharedWith: [],
      archived: false,
      editHistory: []
    };

    setSubmitting(true);
    try {
      if (!isOnline) {
        enqueueOfflineItem('deal', payload);
        alert('Saved offline. It will sync automatically when you are online.');
      } else {
        await addDoc(collection(db, 'sales'), {
          ...payload,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          source: 'quick_add'
        });
        alert('Deal created successfully!');
      }
      setDealForm(initialDeal);
      closeAll();
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('Failed to create deal: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser?.uid) return null;

  return (
    <>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 lg:hidden w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 flex items-center justify-center hover:scale-105 transition-all"
        aria-label="Quick add"
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={closeAll}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Quick Add</h3>
              <button onClick={closeAll} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>

            {!mode && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('contact')}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                    <Users size={20} />
                  </div>
                  <p className="font-semibold text-gray-900">New Contact</p>
                  <p className="text-xs text-gray-600 mt-1">Capture leads quickly</p>
                </button>
                <button
                  onClick={() => setMode('deal')}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <Briefcase size={20} />
                  </div>
                  <p className="font-semibold text-gray-900">New Deal</p>
                  <p className="text-xs text-gray-600 mt-1">Start a deal fast</p>
                </button>
              </div>
            )}

            {mode === 'contact' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} />
                  Contact Details
                </div>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Company name"
                  value={contactForm.companyName}
                  onChange={(e) => setContactForm({ ...contactForm, companyName: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Contact person"
                  value={contactForm.contactName}
                  onChange={(e) => setContactForm({ ...contactForm, contactName: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Phone number"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Email (optional)"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
                  placeholder="Notes (optional)"
                  rows={2}
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                />
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeAll}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitContact}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30"
                  >
                    {submitting ? 'Saving...' : isOnline ? 'Create Contact' : 'Save Offline'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'deal' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Briefcase size={16} />
                  Deal Details
                </div>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Business name"
                  value={dealForm.businessName}
                  onChange={(e) => setDealForm({ ...dealForm, businessName: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Contact person"
                  value={dealForm.contactPerson}
                  onChange={(e) => setDealForm({ ...dealForm, contactPerson: e.target.value })}
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                      placeholder="Phone"
                      value={dealForm.phoneNumber}
                      onChange={(e) => setDealForm({ ...dealForm, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                      placeholder="Value (optional)"
                      type="number"
                      value={dealForm.price}
                      onChange={(e) => setDealForm({ ...dealForm, price: e.target.value })}
                    />
                  </div>
                </div>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
                  placeholder="Notes (optional)"
                  rows={2}
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText size={14} />
                  Default stage: {defaultStage.replace(/_/g, ' ')}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeAll}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitDeal}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30"
                  >
                    {submitting ? 'Saving...' : isOnline ? 'Create Deal' : 'Save Offline'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
