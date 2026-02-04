import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
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
  TrendingDown,
  Calendar,
  CheckCircle2,
  FileText,
  Briefcase,
  XCircle,
  Target,
  Users,
  Edit,
  Save,
  X,
  MessageSquare,
  ClipboardList,
  Activity,
  ShieldAlert,
  Filter,
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import { formatDate, formatDateTime } from '../utils/dateHelpers';
import { fetchPipelineSettings } from '../services/pipelineService';
import { DEFAULT_PIPELINE_STAGES, getStageByValue, getStageColorClass, getRequiredFieldsForStage } from '../utils/pipeline';
import { buildDealCoach } from '../utils/dealCoach';

const STATUS_ICON_MAP = {
  potential_client: Users,
  pending_approval: Clock,
  closed: CheckCircle2,
  lost: XCircle
};

export default function ClientProfilePage() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();

  const [deal, setDeal] = useState(null);
  const [visits, setVisits] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Client updates state
  const [updateText, setUpdateText] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [savingUpdate, setSavingUpdate] = useState(false);

  // Objections & risk tracker
  const [objections, setObjections] = useState([]);
  const [objectionText, setObjectionText] = useState('');
  const [savingObjection, setSavingObjection] = useState(false);
  const [riskLevel, setRiskLevel] = useState('medium');
  const [mitigationPlan, setMitigationPlan] = useState('');
  const [savingRisk, setSavingRisk] = useState(false);

  // Stakeholders
  const [stakeholders, setStakeholders] = useState([]);
  const [stakeholderForm, setStakeholderForm] = useState({
    name: '',
    type: 'decision_maker',
    relationship: 'neutral',
    lastTouch: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [savingStakeholder, setSavingStakeholder] = useState(false);

  // Timeline filters & collapse
  const [timelineFilters, setTimelineFilters] = useState({
    visit: true,
    followup: true,
    update: true,
    email: true,
    status: true,
    edit: true,
    created: true
  });
  const [timelineExpanded, setTimelineExpanded] = useState({
    visit: true,
    followup: true,
    update: true,
    email: true,
    status: true,
    edit: true,
    created: true
  });

  /* ============================= */

  useEffect(() => {
    if (currentUser?.uid && dealId) {
      loadClientData();
    }
  }, [currentUser, dealId]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadPipeline = async () => {
      const stages = await fetchPipelineSettings();
      setPipelineStages(stages);
    };
    loadPipeline();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (deal?.status) {
      setUpdateStatus(deal.status);
    }
  }, [deal?.status]);

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
      const resolveTeamId = async () => {
        if (currentUser.teamId) return currentUser.teamId;
        if (userRole === 'team_leader') {
          const teamSnap = await getDocs(
            query(collection(db, 'teams'), where('leaderId', '==', currentUser.uid))
          );
          return teamSnap.docs[0]?.id || null;
        }
        const memberSnap = await getDocs(
          query(collection(db, 'teamMembers'), where('userId', '==', currentUser.uid))
        );
        return memberSnap.docs[0]?.data()?.teamId || null;
      };

      const teamId = await resolveTeamId();
      const ownerId = dealData.ownerId || dealData.createdBy;
      const sharedWith = Array.isArray(dealData.sharedWith) ? dealData.sharedWith : [];
      const canView =
        userRole === 'admin' ||
        userRole === 'sales_manager' ||
        ownerId === currentUser.uid ||
        dealData.createdBy === currentUser.uid ||
        sharedWith.includes(currentUser.uid) ||
        (userRole === 'team_leader' && teamId && dealData.teamId === teamId);

      if (!canView) {
        setError('You do not have permission to view this client');
        setLoading(false);
        return;
      }

      setDeal(dealData);
      setNotesText(dealData.notes || ''); // Initialize notes text
      setObjections(Array.isArray(dealData.objections) ? dealData.objections : []);
      setRiskLevel(dealData.riskLevel || 'medium');
      setMitigationPlan(dealData.mitigationPlan || '');
      setStakeholders(Array.isArray(dealData.stakeholders) ? dealData.stakeholders : []);

      // Load visits for this deal (WITHOUT orderBy to avoid index requirement)
      const visitsQuery = query(
        collection(db, 'visits'),
        where('dealId', '==', dealId)
      );
      
      const visitsSnap = await getDocs(visitsQuery);
      let visitsList = visitsSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));

      // Sort visits by date in memory (newest first)
      visitsList.sort((a, b) => {
        const dateA = a.visitDate?.toMillis?.() || 0;
        const dateB = b.visitDate?.toMillis?.() || 0;
        return dateB - dateA; // Descending order
      });
      
      console.log('Loaded visits:', visitsList); // Debug log
      setVisits(visitsList);

      // Load follow-ups for this deal (WITHOUT orderBy to avoid index requirement)
      const followupsQuery = query(
        collection(db, 'followups'),
        where('dealId', '==', dealId)
      );
      
      const followupsSnap = await getDocs(followupsQuery);
      let followupsList = followupsSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));

      // Sort follow-ups by date in memory (oldest first)
      followupsList.sort((a, b) => {
        const dateA = a.reminderDate?.toMillis?.() || 0;
        const dateB = b.reminderDate?.toMillis?.() || 0;
        return dateA - dateB; // Ascending order
      });
      
      console.log('Loaded follow-ups:', followupsList); // Debug log
      setFollowups(followupsList);

      // Load quotes for this deal
      try {
        const quotesQuery = query(
          collection(db, 'quotes'),
          where('dealId', '==', dealId)
        );
        const quotesSnap = await getDocs(quotesQuery);
        const quotesList = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        quotesList.sort((a, b) => {
          const dateA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const dateB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });
        setQuotes(quotesList);
      } catch (quoteError) {
        console.error('Error loading quotes:', quoteError);
      }

      // Load communications (emails, logs)
      try {
        const commQuery = query(
          collection(db, 'communications'),
          where('clientId', '==', dealId)
        );
        const commSnap = await getDocs(commQuery);
        const commList = commSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        commList.sort((a, b) => {
          const dateA = a.timestamp?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const dateB = b.timestamp?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });
        setCommunications(commList);
      } catch (commError) {
        console.error('Error loading communications:', commError);
      }

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
      const previousNotes = deal?.notes || '';
      const notesChanged = previousNotes !== notesText;
      const updatePayload = {
        notes: notesText,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      };

      if (notesChanged) {
        const historyEntry = {
          timestamp: new Date(),
          editedBy: currentUser.uid,
          editedByName: `${currentUser.firstName} ${currentUser.lastName}`,
          changes: {
            notes: { from: previousNotes, to: notesText }
          }
        };
        updatePayload.editHistory = arrayUnion(historyEntry);
      }

      await updateDoc(dealRef, updatePayload);

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

  async function handleAddUpdate() {
    if (!dealId) return;
    const trimmed = updateText.trim();
    if (!trimmed) {
      alert('Please enter a client update.');
      return;
    }

    try {
      setSavingUpdate(true);
      const updateEntry = {
        id: `update_${Date.now()}`,
        note: trimmed,
        status: updateStatus || deal.status,
        createdAt: new Date(),
        authorId: currentUser.uid,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`
      };

      await updateDoc(doc(db, 'sales', dealId), {
        clientUpdates: arrayUnion(updateEntry),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      });

      setDeal(prev => ({
        ...prev,
        clientUpdates: [...(prev.clientUpdates || []), updateEntry]
      }));

      setUpdateText('');
      alert('Client update saved!');
    } catch (e) {
      console.error('Error adding client update:', e);
      alert('Failed to save update: ' + e.message);
    } finally {
      setSavingUpdate(false);
    }
  }

  /* ============================= */

  async function handleAddObjection() {
    if (!dealId) return;
    const trimmed = objectionText.trim();
    if (!trimmed) {
      alert('Please enter an objection.');
      return;
    }

    try {
      setSavingObjection(true);
      const entry = {
        id: `obj_${Date.now()}`,
        text: trimmed,
        createdAt: new Date(),
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`
      };

      await updateDoc(doc(db, 'sales', dealId), {
        objections: arrayUnion(entry),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      });

      setObjections(prev => [entry, ...prev]);
      setObjectionText('');
    } catch (e) {
      console.error('Error adding objection:', e);
      alert('Failed to add objection: ' + e.message);
    } finally {
      setSavingObjection(false);
    }
  }

  async function handleRemoveObjection(id) {
    if (!dealId) return;
    if (!window.confirm('Remove this objection?')) return;
    try {
      const next = objections.filter(obj => obj.id !== id);
      await updateDoc(doc(db, 'sales', dealId), {
        objections: next,
        updatedAt: serverTimestamp()
      });
      setObjections(next);
    } catch (e) {
      console.error('Error removing objection:', e);
      alert('Failed to remove objection: ' + e.message);
    }
  }

  async function handleSaveRisk() {
    if (!dealId) return;
    try {
      setSavingRisk(true);
      await updateDoc(doc(db, 'sales', dealId), {
        riskLevel,
        mitigationPlan,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      });
      setDeal(prev => ({
        ...prev,
        riskLevel,
        mitigationPlan
      }));
      alert('Risk plan saved!');
    } catch (e) {
      console.error('Error saving risk plan:', e);
      alert('Failed to save risk plan: ' + e.message);
    } finally {
      setSavingRisk(false);
    }
  }

  async function handleAddStakeholder() {
    if (!dealId) return;
    if (!stakeholderForm.name.trim()) {
      alert('Please enter a stakeholder name.');
      return;
    }

    try {
      setSavingStakeholder(true);
      const entry = {
        id: `stk_${Date.now()}`,
        name: stakeholderForm.name.trim(),
        type: stakeholderForm.type,
        relationship: stakeholderForm.relationship,
        lastTouchAt: stakeholderForm.lastTouch ? new Date(stakeholderForm.lastTouch) : null,
        email: stakeholderForm.email || '',
        phone: stakeholderForm.phone || '',
        notes: stakeholderForm.notes || '',
        createdAt: new Date(),
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`
      };

      await updateDoc(doc(db, 'sales', dealId), {
        stakeholders: arrayUnion(entry),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      });

      setStakeholders(prev => [entry, ...prev]);
      setStakeholderForm({
        name: '',
        type: 'decision_maker',
        relationship: 'neutral',
        lastTouch: '',
        email: '',
        phone: '',
        notes: ''
      });
    } catch (e) {
      console.error('Error adding stakeholder:', e);
      alert('Failed to add stakeholder: ' + e.message);
    } finally {
      setSavingStakeholder(false);
    }
  }

  async function handleRemoveStakeholder(id) {
    if (!dealId) return;
    if (!window.confirm('Remove this stakeholder?')) return;
    try {
      const next = stakeholders.filter(item => item.id !== id);
      await updateDoc(doc(db, 'sales', dealId), {
        stakeholders: next,
        updatedAt: serverTimestamp()
      });
      setStakeholders(next);
    } catch (e) {
      console.error('Error removing stakeholder:', e);
      alert('Failed to remove stakeholder: ' + e.message);
    }
  }

  const getStageLabel = (value) => getStageByValue(pipelineStages, value)?.label || value;

  const toDateValue = (value) => {
    if (!value) return null;
    return value?.toDate?.() || new Date(value);
  };

  const daysSince = (value) => {
    const date = toDateValue(value);
    if (!date) return null;
    const diff = Date.now() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const clientUpdates = useMemo(() => {
    const updates = Array.isArray(deal?.clientUpdates) ? deal.clientUpdates : [];
    return updates.slice().sort((a, b) => {
      const dateA = toDateValue(a.createdAt)?.getTime() || 0;
      const dateB = toDateValue(b.createdAt)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [deal?.clientUpdates]);

  const lastVisit = useMemo(() => (visits.length > 0 ? visits[0] : null), [visits]);

  const nextFollowup = useMemo(() => {
    const upcoming = followups.filter(f => f.status !== 'done' && f.reminderDate);
    upcoming.sort((a, b) => {
      const dateA = toDateValue(a.reminderDate)?.getTime() || 0;
      const dateB = toDateValue(b.reminderDate)?.getTime() || 0;
      return dateA - dateB;
    });
    return upcoming[0] || null;
  }, [followups]);

  const lastUpdate = useMemo(() => clientUpdates[0] || null, [clientUpdates]);

  const timelineItems = useMemo(() => {
    if (!deal) return [];
    const items = [];

    if (deal?.createdAt) {
      items.push({
        id: 'deal-created',
        type: 'created',
        date: deal.createdAt,
        title: 'Deal created',
        description: `Created by ${deal.createdByName || 'Unknown'}`
      });
    }

    visits.forEach(visit => {
      items.push({
        id: `visit-${visit.id}`,
        type: 'visit',
        date: visit.visitDate || visit.createdAt,
        title: 'Visit logged',
        description: visit.purpose || visit.result || visit.address || 'Client visit',
        meta: visit.salesRepName
      });
    });

    followups.forEach(followup => {
      const statusLabel = followup.status === 'done' ? 'Follow-up completed' : 'Follow-up scheduled';
      items.push({
        id: `followup-${followup.id}`,
        type: 'followup',
        date: followup.reminderDate || followup.createdAt,
        title: statusLabel,
        description: followup.nextAction || followup.notes || 'Follow-up',
        meta: followup.assignedToName
      });
    });

    communications
      .filter(com => {
        const type = (com.type || com.communicationType || '').toString().toLowerCase();
        const channel = (com.channel || '').toString().toLowerCase();
        return type.includes('email') || channel.includes('email');
      })
      .forEach(com => {
        items.push({
          id: `email-${com.id}`,
          type: 'email',
          date: com.timestamp || com.createdAt,
          title: 'Email logged',
          description: com.subject || com.action || com.notes || 'Email activity',
          meta: com.createdByName || com.createdBy
        });
      });

    clientUpdates.forEach(update => {
      items.push({
        id: `update-${update.id}`,
        type: 'update',
        date: update.createdAt,
        title: update.status ? `Client update • ${getStageLabel(update.status)}` : 'Client update',
        description: update.note,
        meta: update.authorName
      });
    });

    (deal?.editHistory || []).forEach((entry, index) => {
      const changes = entry.changes || {};
      if (changes.status) {
        items.push({
          id: `status-${index}`,
          type: 'status',
          date: entry.timestamp,
          title: 'Status changed',
          description: `${getStageLabel(changes.status.from)} → ${getStageLabel(changes.status.to)}`,
          meta: entry.editedByName
        });
      } else {
        const changeFields = Object.keys(changes);
        const summary = changeFields.length > 0
          ? `Updated ${changeFields.slice(0, 2).map(field => field.replace(/([A-Z])/g, ' $1')).join(', ')}${changeFields.length > 2 ? '…' : ''}`
          : 'Deal updated';
        items.push({
          id: `edit-${index}`,
          type: 'edit',
          date: entry.timestamp,
          title: 'Deal updated',
          description: summary,
          meta: entry.editedByName
        });
      }
    });

    items.sort((a, b) => {
      const dateA = toDateValue(a.date)?.getTime() || 0;
      const dateB = toDateValue(b.date)?.getTime() || 0;
      return dateB - dateA;
    });

    return items;
  }, [deal, visits, followups, communications, clientUpdates, pipelineStages]);

  const dealCoach = useMemo(() => {
    return buildDealCoach(deal, { pipelineStages, followups, visits, clientUpdates });
  }, [deal, pipelineStages, followups, visits, clientUpdates]);

  const healthScore = useMemo(() => {
    if (!deal) return { score: 0, status: 'N/A', trend: 'stable' };

    const activityDays = daysSince(deal.lastActivityAt || deal.statusUpdatedAt || deal.createdAt) ?? 0;
    const stageDays = daysSince(deal.statusUpdatedAt || deal.createdAt) ?? 0;
    const value = Number(deal.price || deal.amount || 0);
    const missingFields = getRequiredFieldsForStage(pipelineStages, deal.status || '').filter(field => {
      const val = deal[field];
      if (field === 'price') return !val || Number(val) <= 0;
      if (typeof val === 'string') return val.trim() === '';
      return val === undefined || val === null;
    });

    let score = 50;
    if (activityDays <= 3) score += 15;
    else if (activityDays <= 7) score += 8;
    else if (activityDays <= 14) score += 4;
    else if (activityDays > 30) score -= 15;

    if (stageDays <= 7) score += 6;
    else if (stageDays > 30) score -= 12;
    else if (stageDays > 14) score -= 6;

    if (value >= 100000) score += 10;
    else if (value >= 25000) score += 6;
    else if (value >= 5000) score += 3;

    if (missingFields.length > 0) score -= 10;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let status = 'Healthy';
    if (score < 40) status = 'At Risk';
    else if (score < 70) status = 'Watch';

    let trend = 'stable';
    if (activityDays <= 7) trend = 'improving';
    else if (activityDays > 14) trend = 'declining';

    return { score, status, trend };
  }, [deal, pipelineStages]);

  const latestQuote = useMemo(() => quotes[0] || null, [quotes]);

  const quoteStatusLabel = (status) => {
    if (status === 'accepted') return 'Signed';
    if (status === 'sent') return 'Pending Approval';
    if (status === 'draft') return 'Draft';
    return status || 'N/A';
  };

  const timelineByType = useMemo(() => {
    const map = {
      created: [],
      visit: [],
      followup: [],
      update: [],
      email: [],
      status: [],
      edit: []
    };

    timelineItems.forEach(item => {
      if (!map[item.type]) map[item.type] = [];
      map[item.type].push(item);
    });

    return map;
  }, [timelineItems]);

  const toggleTimelineFilter = (type) => {
    setTimelineFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleTimelineSection = (type) => {
    setTimelineExpanded(prev => ({ ...prev, [type]: !prev[type] }));
  };

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

  const status = getStageByValue(pipelineStages, deal.status) || pipelineStages[0];
  const StatusIcon = STATUS_ICON_MAP[deal.status] || Briefcase;
  const statusColorClass = getStageColorClass(pipelineStages, deal.status);

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
            <div className={`px-4 py-2 rounded-xl font-semibold text-sm border flex items-center gap-2 ${statusColorClass}`}>
              <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
              {status?.label || deal.status}
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
              <div className={`inline-flex px-4 py-2 rounded-xl font-semibold text-sm border items-center gap-2 ${statusColorClass}`}>
                <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
                {status?.label || deal.status}
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

            {deal.ownerName && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Owner
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {deal.ownerName}
                </p>
              </div>
            )}

            {deal.teamName && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Team
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {deal.teamName}
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

      {/* HEALTH SCORE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            Health Score
          </h3>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
            healthScore.status === 'Healthy'
              ? 'bg-emerald-50 text-emerald-600'
              : healthScore.status === 'Watch'
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-red-50 text-red-600'
          }`}>
            {healthScore.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-700 uppercase">Score</p>
            <p className="text-3xl font-bold text-emerald-700 mt-2">{healthScore.score}</p>
            <p className="text-xs text-emerald-600 mt-1">Out of 100</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase">Trend</p>
              <p className="text-lg font-bold text-blue-700 mt-2">
                {healthScore.trend === 'improving' ? 'Improving' : healthScore.trend === 'declining' ? 'Declining' : 'Stable'}
              </p>
            </div>
            {healthScore.trend === 'declining' ? (
              <TrendingDown className="w-8 h-8 text-blue-600" />
            ) : (
              <TrendingUp className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-purple-700 uppercase">Last Activity</p>
            <p className="text-lg font-bold text-purple-700 mt-2">
              {deal.lastActivityAt ? formatDateTime(deal.lastActivityAt) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* MEETING PREP */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Meeting Prep
          </h3>
          <span className="text-xs font-semibold text-gray-500">
            Last activity: {deal.lastActivityAt ? formatDateTime(deal.lastActivityAt) : 'N/A'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Next Follow-up</p>
            {nextFollowup ? (
              <>
                <p className="text-sm font-bold text-gray-900">{nextFollowup.nextAction || 'Follow-up'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDateTime(nextFollowup.reminderDate)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">No follow-ups scheduled</p>
            )}
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Last Visit</p>
            {lastVisit ? (
              <>
                <p className="text-sm font-bold text-gray-900">{lastVisit.purpose || 'Client visit'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDateTime(lastVisit.visitDate)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">No visits logged</p>
            )}
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs font-semibold text-green-700 uppercase mb-2">Latest Update</p>
            {lastUpdate ? (
              <>
                <p className="text-sm font-bold text-gray-900 line-clamp-2">{lastUpdate.note}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDateTime(lastUpdate.createdAt)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">No updates yet</p>
            )}
          </div>
        </div>

        {deal.notes && (
          <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes Snapshot</p>
            <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}
      </div>

      {/* STAKEHOLDERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Stakeholders & Buying Committee
          </h3>
          <span className="text-xs text-gray-500">{stakeholders.length} contacts</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {stakeholders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No stakeholders added yet</p>
                <p className="text-xs text-gray-500 mt-1">Add decision makers, influencers, blockers, and finance contacts.</p>
              </div>
            ) : (
              stakeholders.map(member => (
                <div key={member.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{member.email || member.phone || 'No contact info'}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveStakeholder(member.id)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
                      {member.type?.replace('_', ' ') || 'Stakeholder'}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                      Relationship: {member.relationship || 'neutral'}
                    </span>
                    {member.lastTouchAt && (
                      <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-600">
                        Last touch: {formatDateTime(member.lastTouchAt)}
                      </span>
                    )}
                  </div>
                  {member.notes && (
                    <p className="text-xs text-gray-600 mt-2">{member.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Stakeholder
            </h4>
            <div className="space-y-3">
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Name"
                value={stakeholderForm.name}
                onChange={(e) => setStakeholderForm({ ...stakeholderForm, name: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Email"
                value={stakeholderForm.email}
                onChange={(e) => setStakeholderForm({ ...stakeholderForm, email: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Phone"
                value={stakeholderForm.phone}
                onChange={(e) => setStakeholderForm({ ...stakeholderForm, phone: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={stakeholderForm.type}
                onChange={(e) => setStakeholderForm({ ...stakeholderForm, type: e.target.value })}
              >
                <option value="decision_maker">Decision Maker</option>
                <option value="influencer">Influencer</option>
                <option value="blocker">Blocker</option>
                <option value="finance">Finance</option>
              </select>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={stakeholderForm.relationship}
                onChange={(e) => setStakeholderForm({ ...stakeholderForm, relationship: e.target.value })}
              >
                <option value="strong">Strong Relationship</option>
                <option value="neutral">Neutral Relationship</option>
                <option value="weak">Weak Relationship</option>
              </select>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={stakeholderForm.lastTouch}
                onChange={(e) => setStakeholderForm({ ...stakeholderForm, lastTouch: e.target.value })}
              />
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                placeholder="Notes"
                value={stakeholderForm.notes}
                onChange={(e) => setStakeholderForm({ ...stakeholderForm, notes: e.target.value })}
              />
              <button
                onClick={handleAddStakeholder}
                disabled={savingStakeholder}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {savingStakeholder ? 'Adding...' : 'Add Stakeholder'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI DEAL COACH */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            AI Deal Coach
          </h3>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
            dealCoach.status === 'attention'
              ? 'bg-red-50 text-red-600'
              : dealCoach.status === 'won'
                ? 'bg-green-50 text-green-600'
                : dealCoach.status === 'lost'
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-emerald-50 text-emerald-600'
          }`}>
            {dealCoach.status === 'attention' ? 'Needs Attention' : dealCoach.status === 'won' ? 'Won' : dealCoach.status === 'lost' ? 'Lost' : 'Healthy'}
          </span>
        </div>
        <p className="text-sm text-gray-700 mb-4">{dealCoach.summary}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-600 uppercase mb-2">Risks</p>
            {dealCoach.risks.length === 0 ? (
              <p className="text-sm text-red-600/70">No major risks detected.</p>
            ) : (
              <ul className="text-sm text-red-700 space-y-2">
                {dealCoach.risks.map((risk, idx) => (
                  <li key={idx}>• {risk}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase mb-2">Next Best Actions</p>
            <ul className="text-sm text-emerald-700 space-y-2">
              {dealCoach.nextSteps.map((step, idx) => (
                <li key={idx}>• {step}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* OBJECTIONS & RISK */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Objections & Risk Tracker
          </h3>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
            riskLevel === 'high'
              ? 'bg-red-50 text-red-600'
              : riskLevel === 'medium'
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-green-50 text-green-600'
          }`}>
            Risk: {riskLevel}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Common Objections</p>
              <span className="text-xs text-gray-500">{objections.length} logged</span>
            </div>
            <div className="space-y-3">
              {objections.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">No objections logged yet</p>
                </div>
              ) : (
                objections.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-800">{item.text}</p>
                      <p className="text-xs text-gray-500 mt-1">Added by {item.createdByName || 'Unknown'}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveObjection(item.id)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Add objection..."
                value={objectionText}
                onChange={(e) => setObjectionText(e.target.value)}
              />
              <button
                onClick={handleAddObjection}
                disabled={savingObjection}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {savingObjection ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Risk Level & Mitigation Plan</p>
            <div className="space-y-3">
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                placeholder="Mitigation plan..."
                value={mitigationPlan}
                onChange={(e) => setMitigationPlan(e.target.value)}
              />
              <button
                onClick={handleSaveRisk}
                disabled={savingRisk}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-60"
              >
                {savingRisk ? 'Saving...' : 'Save Risk Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUOTE & CONTRACT */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Quote & Contract
          </h3>
          <button
            onClick={() => navigate('/quotes')}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Open Quote Maker
          </button>
        </div>

        {latestQuote ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-700 uppercase">Latest Quote</p>
              <p className="text-lg font-bold text-indigo-900 mt-2">{latestQuote.title}</p>
              <p className="text-xs text-indigo-700 mt-1">#{latestQuote.quoteNumber}</p>
              <p className="text-sm text-indigo-900 mt-3">{formatCurrency(latestQuote.total || 0)}</p>
              <p className="text-xs text-indigo-700 mt-1">Status: {quoteStatusLabel(latestQuote.status)}</p>
            </div>
            <div className="lg:col-span-2 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Version History</p>
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2">
                {quotes.map(quote => (
                  <div key={quote.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{quote.title}</p>
                      <p className="text-xs text-gray-500">#{quote.quoteNumber}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{quoteStatusLabel(quote.status)}</p>
                      <p>{formatDateTime(quote.updatedAt || quote.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No quotes found for this deal.</p>
          </div>
        )}
      </div>

      {/* CLIENT UPDATES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Client Updates
          </h3>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold">
            {clientUpdates.length} updates
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <textarea
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Add a quick update about the client status, requirements, or next steps..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Status Tag</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                {pipelineStages.map(stage => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Tag only (does not change pipeline stage)</p>
            </div>
            <button
              onClick={handleAddUpdate}
              disabled={savingUpdate}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingUpdate ? 'Saving...' : 'Add Update'}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {clientUpdates.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No client updates yet</p>
              <p className="text-xs text-gray-500 mt-1">Add updates to keep the team aligned</p>
            </div>
          ) : (
            clientUpdates.map(update => (
              <div key={update.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold">
                    {update.status ? getStageLabel(update.status) : 'Update'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(update.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.note}</p>
                {update.authorName && (
                  <p className="text-xs text-gray-500 mt-2">By {update.authorName}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* DEAL TIMELINE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Deal Timeline
          </h3>
          <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold">
            {timelineItems.length} events
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { type: 'visit', label: 'Visits' },
            { type: 'followup', label: 'Follow-ups' },
            { type: 'update', label: 'Updates' },
            { type: 'email', label: 'Emails' },
            { type: 'status', label: 'Status' },
            { type: 'edit', label: 'Edits' },
            { type: 'created', label: 'Created' }
          ].map(item => (
            <button
              key={item.type}
              onClick={() => toggleTimelineFilter(item.type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                timelineFilters[item.type]
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setTimelineExpanded({
              visit: true,
              followup: true,
              update: true,
              email: true,
              status: true,
              edit: true,
              created: true
            })}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600"
          >
            Expand All
          </button>
          <button
            onClick={() => setTimelineExpanded({
              visit: false,
              followup: false,
              update: false,
              email: false,
              status: false,
              edit: false,
              created: false
            })}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600"
          >
            Collapse All
          </button>
        </div>

        {timelineItems.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Activity className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { type: 'created', label: 'Created', icon: Briefcase },
              { type: 'status', label: 'Status Changes', icon: TrendingUp },
              { type: 'visit', label: 'Visits', icon: MapPin },
              { type: 'followup', label: 'Follow-ups', icon: Bell },
              { type: 'update', label: 'Updates', icon: MessageSquare },
              { type: 'email', label: 'Emails', icon: Mail },
              { type: 'edit', label: 'Edits', icon: Edit }
            ].map(section => {
              const items = timelineByType[section.type] || [];
              if (!timelineFilters[section.type]) return null;
              return (
                <div key={section.type} className="border border-gray-200 rounded-xl p-4">
                  <button
                    onClick={() => toggleTimelineSection(section.type)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <section.icon className="w-4 h-4 text-gray-500" />
                      {section.label}
                      <span className="text-xs text-gray-400">({items.length})</span>
                    </div>
                    {timelineExpanded[section.type] ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {timelineExpanded[section.type] && (
                    <div className="mt-3 space-y-3">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-500">No events yet.</p>
                      ) : (
                        items.map(item => <TimelineItem key={item.id} item={item} />)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

function TimelineItem({ item }) {
  const iconMap = {
    created: Briefcase,
    visit: MapPin,
    followup: Bell,
    update: MessageSquare,
    status: TrendingUp,
    edit: Edit
  };

  const colorMap = {
    created: 'bg-blue-50 text-blue-600 border-blue-200',
    visit: 'bg-purple-50 text-purple-600 border-purple-200',
    followup: 'bg-orange-50 text-orange-600 border-orange-200',
    update: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    status: 'bg-green-50 text-green-600 border-green-200',
    edit: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  const Icon = iconMap[item.type] || Activity;
  const colorClass = colorMap[item.type] || 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <div className="flex gap-4 items-start border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.description}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {item.date ? formatDateTime(item.date) : ''}
          </span>
        </div>
        {item.meta && (
          <p className="text-xs text-gray-500 mt-2">By {item.meta}</p>
        )}
      </div>
    </div>
  );
}
