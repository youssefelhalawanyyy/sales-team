import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/dateHelpers';
import { fetchPipelineSettings } from '../services/pipelineService';
import { DEFAULT_PIPELINE_STAGES, getStageLabel, getStageColorClass } from '../utils/pipeline';
import {
  ArrowLeft,
  Building2,
  Users,
  Phone,
  Mail,
  Briefcase,
  MessageSquare,
  MapPin,
  TrendingUp
} from 'lucide-react';

export default function Account360Page() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [contact, setContact] = useState(null);
  const [parentAccount, setParentAccount] = useState(null);
  const [childAccounts, setChildAccounts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadPipeline = async () => {
      const stages = await fetchPipelineSettings();
      setPipelineStages(stages);
    };
    loadPipeline();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid || !contactId) return;
    loadAccount();
  }, [currentUser?.uid, contactId]);

  async function loadAccount() {
    try {
      setLoading(true);
      setError(null);

      const contactSnap = await getDoc(doc(db, 'contacts', contactId));
      if (!contactSnap.exists()) {
        setError('Account not found');
        setLoading(false);
        return;
      }

      const contactData = { id: contactSnap.id, ...contactSnap.data() };
      setContact(contactData);

      if (contactData.parentAccountId) {
        const parentSnap = await getDoc(doc(db, 'contacts', contactData.parentAccountId));
        if (parentSnap.exists()) {
          setParentAccount({ id: parentSnap.id, ...parentSnap.data() });
        }
      } else {
        setParentAccount(null);
      }

      const childrenSnap = await getDocs(
        query(collection(db, 'contacts'), where('parentAccountId', '==', contactId))
      );
      setChildAccounts(childrenSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const dealQueries = [
        query(collection(db, 'sales'), where('sourceContactId', '==', contactId))
      ];
      if (contactData.companyName) {
        dealQueries.push(query(collection(db, 'sales'), where('businessName', '==', contactData.companyName)));
      }
      if (contactData.phone) {
        dealQueries.push(query(collection(db, 'sales'), where('phoneNumber', '==', contactData.phone)));
      }

      const dealSnaps = await Promise.all(dealQueries.map(q => getDocs(q)));
      const dealMap = new Map();
      dealSnaps.forEach(snapshot => {
        snapshot.docs.forEach(docSnap => {
          dealMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      });
      const dealList = Array.from(dealMap.values());
      setDeals(dealList);

      const communicationSnaps = await Promise.all(
        dealList.slice(0, 10).map(deal =>
          getDocs(query(collection(db, 'communications'), where('clientId', '==', deal.id)))
        )
      );
      const comms = [];
      communicationSnaps.forEach(snapshot => {
        snapshot.docs.forEach(docSnap => {
          comms.push({ id: docSnap.id, ...docSnap.data() });
        });
      });
      comms.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || a.createdAt?.toDate?.() || new Date();
        const dateB = b.timestamp?.toDate?.() || b.createdAt?.toDate?.() || new Date();
        return dateB - dateA;
      });
      setCommunications(comms);
    } catch (e) {
      console.error('Error loading account 360:', e);
      setError('Failed to load account data');
    } finally {
      setLoading(false);
    }
  }

  const pipelineTotals = useMemo(() => {
    return deals.reduce((acc, deal) => {
      const amount = Number(deal.price || deal.amount || 0);
      if (deal.status === 'closed') {
        acc.closed += amount;
      } else if (deal.status === 'lost') {
        acc.lost += amount;
      } else {
        acc.open += amount;
      }
      return acc;
    }, { open: 0, closed: 0, lost: 0 });
  }, [deals]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading account 360...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Account not found'}
          </h3>
          <button
            onClick={() => navigate('/sales/contacts')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/sales/contacts')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Contacts
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contact.companyName || 'Account'}</h1>
            <p className="text-gray-600 mt-1">{contact.contactName || 'No contact person'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-sm">
            Open: {formatCurrency(pipelineTotals.open)}
          </div>
          <div className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-semibold text-sm">
            Closed: {formatCurrency(pipelineTotals.closed)}
          </div>
          <div className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm">
            Lost: {formatCurrency(pipelineTotals.lost)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Account Overview
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {contact.phone || 'No phone'}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {contact.email || 'No email'}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {contact.contactPosition || 'No role'}
            </div>
            {contact.category && (
              <div className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold">
                {contact.category}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" /> Account Hierarchy
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Parent Account</p>
              {parentAccount ? (
                <button
                  onClick={() => navigate(`/sales/account/${parentAccount.id}`)}
                  className="mt-2 text-sm font-semibold text-indigo-600 hover:underline"
                >
                  {parentAccount.companyName || parentAccount.contactName}
                </button>
              ) : (
                <p className="text-sm text-gray-500 mt-2">None</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Child Accounts</p>
              {childAccounts.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">No child accounts</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {childAccounts.map(child => (
                    <button
                      key={child.id}
                      onClick={() => navigate(`/sales/account/${child.id}`)}
                      className="block text-sm text-indigo-600 hover:underline"
                    >
                      {child.companyName || child.contactName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-600" /> Deals Snapshot
          </h3>
          {deals.length === 0 ? (
            <p className="text-sm text-gray-500">No deals linked to this account yet.</p>
          ) : (
            <div className="space-y-3">
              {deals.slice(0, 4).map(deal => (
                <div key={deal.id} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{deal.businessName}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(deal.price || 0)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStageColorClass(pipelineStages, deal.status)}`}>
                    {getStageLabel(pipelineStages, deal.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" /> Deals
            </h3>
            <span className="text-xs text-gray-500">{deals.length} total</span>
          </div>
          {deals.length === 0 ? (
            <p className="text-sm text-gray-500">No deals found.</p>
          ) : (
            <div className="space-y-3">
              {deals.map(deal => (
                <div key={deal.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{deal.businessName}</p>
                      <p className="text-xs text-gray-500">Owner: {deal.ownerName || deal.createdByName || 'N/A'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStageColorClass(pipelineStages, deal.status)}`}>
                      {getStageLabel(pipelineStages, deal.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatCurrency(deal.price || 0)}</span>
                    <button
                      onClick={() => navigate(`/sales/client/${deal.id}`)}
                      className="text-indigo-600 hover:underline"
                    >
                      Open Deal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" /> Communications
            </h3>
            <span className="text-xs text-gray-500">{communications.length} entries</span>
          </div>
          {communications.length === 0 ? (
            <p className="text-sm text-gray-500">No communications logged yet.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {communications.map(com => (
                <div key={com.id} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{com.type || 'Activity'}</p>
                    <span className="text-xs text-gray-500">{formatDateTime(com.timestamp || com.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{com.action || com.purpose || com.notes || 'Logged activity'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
