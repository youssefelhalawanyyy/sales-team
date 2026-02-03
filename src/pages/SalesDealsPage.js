import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
  query,
  arrayUnion,
  where
} from 'firebase/firestore';
import { 
  Plus, Trash2, Edit, X, Search, Filter, TrendingUp, Clock, CheckCircle2, 
  XCircle, Archive, DollarSign, Users, Briefcase, Phone, FileText, Eye,
  ArchiveRestore, AlertCircle, UserCheck, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import DealHistory from '../components/DealHistory';
import { notifyDealUpdated, notifyDealClosed } from '../services/notificationService';
import { runAutoFollowups } from '../services/autoFollowupService';
import { fetchPipelineSettings } from '../services/pipelineService';
import { fetchPlaybooks } from '../services/playbookService';
import {
  DEFAULT_PIPELINE_STAGES,
  PIPELINE_FIELD_LABELS,
  getRequiredFieldsForStage,
  getStageByValue,
  getStageColorClass,
  getStageLabel
} from '../utils/pipeline';
import { scoreDeal, getPriorityBadge } from '../utils/leadScoring';

const STATUS_ICON_MAP = {
  potential_client: Users,
  pending_approval: Clock,
  closed: CheckCircle2,
  lost: XCircle
};

const isDealFieldMissing = (deal, field) => {
  const value = deal?.[field];
  if (field === 'price') {
    return value === undefined || value === null || Number(value) <= 0;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  return value === undefined || value === null;
};

const getMissingRequiredFields = (deal, stages) => {
  const required = getRequiredFieldsForStage(stages, deal?.status);
  return required.filter(field => isDealFieldMissing(deal, field));
};

export default function SalesDealsPage() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);
  const [archivedDeals, setArchivedDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortMode, setSortMode] = useState('smart');
  const [showArchive, setShowArchive] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [error, setError] = useState(null);
  const [showLossReasonModal, setShowLossReasonModal] = useState(false);
  const [lossReason, setLossReason] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);
  const [teamContext, setTeamContext] = useState({ teamId: null, teamName: null, memberOptions: [] });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [playbooks, setPlaybooks] = useState({});
  const autoFollowupRunRef = useRef(false);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadPipeline = async () => {
      const stages = await fetchPipelineSettings();
      setPipelineStages(stages);
    };

    loadPipeline();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadPlaybooks = async () => {
      const data = await fetchPlaybooks();
      setPlaybooks(data.stages || {});
    };
    loadPlaybooks();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadTeamContext();
    }
  }, [currentUser?.uid, userRole, currentUser?.teamId]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadDeals();
      if (userRole === 'admin' || userRole === 'sales_manager') {
        loadArchivedDeals();
      }
    }
  }, [currentUser, userRole, teamContext.teamId]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    if (userRole === 'admin' || userRole === 'sales_manager') {
      loadAvailableUsers();
    } else {
      const teamOptions = teamContext.memberOptions || [];
      const map = {};
      teamOptions.forEach(user => {
        map[user.value] = user;
      });
      setAvailableUsers(teamOptions);
      setUsersById(map);
    }
  }, [currentUser?.uid, userRole, teamContext]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    if (autoFollowupRunRef.current) return;
    if (!Array.isArray(deals) || deals.length === 0) return;

    autoFollowupRunRef.current = true;
    runAutoFollowups({ deals, currentUser });
  }, [deals, currentUser]);

  async function loadDeals() {
    try {
      setLoading(true);
      setError(null);

      const normalizeDeal = (deal) => ({
        ...deal,
        ownerId: deal.ownerId || deal.createdBy,
        ownerName: deal.ownerName || deal.createdByName || 'Unknown',
        sharedWith: Array.isArray(deal.sharedWith) ? deal.sharedWith : []
      });

      let allDeals = [];

      if (userRole === 'admin' || userRole === 'sales_manager') {
        const dealsQuery = query(
          collection(db, 'sales'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(dealsQuery);
        allDeals = snapshot.docs.map(d => normalizeDeal({ id: d.id, ...d.data() }));
      } else {
        const queries = [
          query(collection(db, 'sales'), where('ownerId', '==', currentUser.uid)),
          query(collection(db, 'sales'), where('createdBy', '==', currentUser.uid)),
          query(collection(db, 'sales'), where('sharedWith', 'array-contains', currentUser.uid))
        ];

        if (teamContext.teamId) {
          queries.push(query(collection(db, 'sales'), where('teamId', '==', teamContext.teamId)));
        }

        const snapshots = await Promise.all(queries.map(q => getDocs(q)));
        const dealMap = new Map();
        snapshots.forEach(snapshot => {
          snapshot.docs.forEach(docSnap => {
            dealMap.set(docSnap.id, normalizeDeal({ id: docSnap.id, ...docSnap.data() }));
          });
        });
        allDeals = Array.from(dealMap.values());
        allDeals.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      }
      
      const activeDeals = allDeals.filter(deal => !deal.archived);
      
      if (userRole !== 'admin' && userRole !== 'sales_manager') {
        activeDeals.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      }
      
      setDeals(activeDeals);
    } catch (e) {
      console.error('Error loading deals:', e);
      setError(e.message);
      alert('Failed to load deals: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadArchivedDeals() {
    try {
      const archivedQuery = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(archivedQuery);
      const allDeals = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        ownerId: d.data().ownerId || d.data().createdBy,
        ownerName: d.data().ownerName || d.data().createdByName || 'Unknown',
        sharedWith: Array.isArray(d.data().sharedWith) ? d.data().sharedWith : []
      }));
      const archived = allDeals.filter(deal => deal.archived === true);
      
      setArchivedDeals(archived);
    } catch (e) {
      console.error('Error loading archived deals:', e);
    }
  }

  async function loadTeamContext() {
    try {
      let teamId = currentUser?.teamId || null;
      let teamName = currentUser?.teamName || null;
      let teamDoc = null;

      if (!teamId) {
        if (userRole === 'team_leader') {
          const teamSnap = await getDocs(
            query(collection(db, 'teams'), where('leaderId', '==', currentUser.uid))
          );
          teamDoc = teamSnap.docs[0] || null;
          if (teamDoc) {
            teamId = teamDoc.id;
            teamName = teamDoc.data().name || null;
          }
        } else {
          const memberSnap = await getDocs(
            query(collection(db, 'teamMembers'), where('userId', '==', currentUser.uid))
          );
          const memberDoc = memberSnap.docs[0] || null;
          if (memberDoc) {
            teamId = memberDoc.data().teamId || null;
          }
          if (teamId) {
            const teamRef = doc(db, 'teams', teamId);
            const teamSnap = await getDoc(teamRef);
            teamDoc = teamSnap.exists() ? teamSnap : null;
            if (teamDoc) {
              teamName = teamDoc.data().name || null;
            }
          }
        }
      } else if (!teamName && teamId) {
        const teamRef = doc(db, 'teams', teamId);
        const teamSnap = await getDoc(teamRef);
        teamDoc = teamSnap.exists() ? teamSnap : null;
        if (teamDoc) {
          teamName = teamDoc.data().name || null;
        }
      }

      let memberOptions = [];
      if (teamId) {
        const membersSnap = await getDocs(
          query(collection(db, 'teamMembers'), where('teamId', '==', teamId))
        );
        memberOptions = membersSnap.docs.map(member => {
          const data = member.data();
          return {
            value: data.userId,
            label: data.userName || data.userEmail || data.userId,
            email: data.userEmail,
            teamId,
            teamName
          };
        });

        if (teamDoc) {
          const leaderId = teamDoc.data().leaderId;
          const leaderName = teamDoc.data().leaderName || teamDoc.data().leaderEmail || leaderId;
          const exists = memberOptions.some(option => option.value === leaderId);
          if (!exists) {
            memberOptions.push({
              value: leaderId,
              label: leaderName,
              email: teamDoc.data().leaderEmail || '',
              teamId,
              teamName
            });
          }
        }
      }

      if (currentUser?.uid) {
        const exists = memberOptions.some(option => option.value === currentUser.uid);
        if (!exists) {
          memberOptions.push({
            value: currentUser.uid,
            label: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || currentUser.uid,
            email: currentUser.email || '',
            teamId,
            teamName
          });
        }
      }

      setTeamContext({ teamId, teamName, memberOptions });
    } catch (error) {
      console.error('Error loading team context:', error);
      setTeamContext({ teamId: null, teamName: null, memberOptions: [] });
    }
  }

  async function loadAvailableUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const options = snap.docs.map(docSnap => {
        const data = docSnap.data();
        const name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        return {
          value: docSnap.id,
          label: name || data.email || docSnap.id,
          email: data.email || '',
          teamId: data.teamId || null,
          teamName: data.teamName || null
        };
      }).filter(user => user.value);

      const map = {};
      options.forEach(option => {
        map[option.value] = option;
      });

      setAvailableUsers(options);
      setUsersById(map);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function saveEdit() {
    try {
      const dealRef = doc(db, 'sales', editDeal.id);
      const originalDeal = deals.find(d => d.id === editDeal.id) || 
                          archivedDeals.find(d => d.id === editDeal.id);

      const statusChanged = originalDeal.status !== editDeal.status;

      const isFieldMissing = (deal, field) => {
        const value = deal[field];
        if (field === 'price') {
          return value === undefined || value === null || Number(value) <= 0;
        }
        if (typeof value === 'string') {
          return value.trim() === '';
        }
        return value === undefined || value === null;
      };

      if (statusChanged) {
        const checklistItems = playbooks?.[originalDeal.status]?.checklist || [];
        const completedChecklist = editDeal.checklists?.[originalDeal.status] || [];
        const missingChecklist = checklistItems.filter(item => !completedChecklist.includes(item));

        if (missingChecklist.length > 0) {
          alert(`Please complete the stage checklist before moving forward:\n\n${missingChecklist.join(', ')}`);
          return;
        }

        const requiredFields = getRequiredFieldsForStage(pipelineStages, editDeal.status);
        const missingFields = requiredFields.filter(field => isFieldMissing(editDeal, field));

        if (missingFields.includes('lossReason') && editDeal.status === 'lost' && !editDeal.lossReason) {
          setPendingStatusChange(editDeal);
          setShowLossReasonModal(true);
          return;
        }

        if (missingFields.length > 0) {
          const labels = missingFields.map(field => PIPELINE_FIELD_LABELS[field] || field);
          alert(`Please fill required fields for this stage:\n\n${labels.join(', ')}`);
          return;
        }
      }
      
      // Check if status is changing to 'lost' and ask for reason
      if (originalDeal.status !== 'lost' && editDeal.status === 'lost' && !editDeal.lossReason) {
        setPendingStatusChange(editDeal);
        setShowLossReasonModal(true);
        return;
      }

      const changes = {};

      ['businessName', 'contactPerson', 'phoneNumber', 'status', 'price', 'notes', 'lossReason', 'forecastCategory'].forEach(field => {
        if (originalDeal[field] !== editDeal[field]) {
          changes[field] = { from: originalDeal[field], to: editDeal[field] };
        }
      });

      if ((originalDeal.ownerId || originalDeal.createdBy) !== (editDeal.ownerId || editDeal.createdBy)) {
        changes.owner = {
          from: originalDeal.ownerName || originalDeal.createdByName || originalDeal.ownerId || originalDeal.createdBy,
          to: editDeal.ownerName || editDeal.createdByName || editDeal.ownerId || editDeal.createdBy
        };
      }

      if (originalDeal.teamId !== editDeal.teamId) {
        changes.teamName = {
          from: originalDeal.teamName || originalDeal.teamId || '(none)',
          to: editDeal.teamName || editDeal.teamId || '(none)'
        };
      }

      const originalShared = Array.isArray(originalDeal.sharedWith) ? originalDeal.sharedWith : [];
      const nextShared = Array.isArray(editDeal.sharedWith) ? editDeal.sharedWith : [];
      const sharedChanged = originalShared.length !== nextShared.length ||
        originalShared.some(id => !nextShared.includes(id));

      if (sharedChanged) {
        const toNames = nextShared.map(id => usersById[id]?.label || id);
        const fromNames = originalShared.map(id => usersById[id]?.label || id);
        changes.sharedWith = { from: fromNames, to: toNames };
      }

      const historyEntry = {
        timestamp: new Date(),
        editedBy: currentUser.uid,
        editedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        changes: changes
      };

      const updatePayload = {
        businessName: editDeal.businessName,
        contactPerson: editDeal.contactPerson,
        phoneNumber: editDeal.phoneNumber,
        status: editDeal.status,
        price: Number(editDeal.price) || 0,
        notes: editDeal.notes,
        lossReason: editDeal.lossReason || null,
        forecastCategory: editDeal.forecastCategory || 'pipeline',
        ownerId: editDeal.ownerId || editDeal.createdBy,
        ownerName: editDeal.ownerName || editDeal.createdByName || 'Unknown',
        teamId: editDeal.teamId || null,
        teamName: editDeal.teamName || null,
        sharedWith: Array.isArray(editDeal.sharedWith) ? editDeal.sharedWith : [],
        checklists: editDeal.checklists || {},
        editHistory: arrayUnion(historyEntry),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      };

      if (statusChanged) {
        updatePayload.statusUpdatedAt = serverTimestamp();
      }

      await updateDoc(dealRef, updatePayload);

      // Handle contact when deal is closed or lost
      const isClosedOrLost = editDeal.status === 'closed' || editDeal.status === 'lost';
      
      // Send notifications
      if (statusChanged) {
        try {
          console.log('Sending notification for deal update...');
          // Notify the deal creator (current user)
          if (isClosedOrLost) {
            const result = await notifyDealClosed(currentUser.uid, editDeal, editDeal.status === 'closed' ? 'Won' : 'Lost');
            console.log('Deal closed notification result:', result);
          } else {
            const result = await notifyDealUpdated(currentUser.uid, editDeal);
            console.log('Deal updated notification result:', result);
          }
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      if (statusChanged) {
        if (editDeal.status === 'closed' || editDeal.status === 'lost') {
          // Skip playbook tasks on closed/lost stages
        } else {
          const taskTemplates = playbooks?.[editDeal.status]?.tasks || [];
          const canAutoCreateTasks = ['admin', 'sales_manager', 'team_leader'].includes(userRole);

          if (canAutoCreateTasks && taskTemplates.length > 0) {
            try {
              const ownerId = editDeal.ownerId || editDeal.createdBy;
              const ownerEmail = usersById?.[ownerId]?.email || '';
              const stageLabel = getStageLabel(pipelineStages, editDeal.status);
              const deadline = Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

              await Promise.all(
                taskTemplates.map(template =>
                  addDoc(collection(db, 'tasks'), {
                    title: template,
                    description: `Stage: ${stageLabel}\nDeal: ${editDeal.businessName}`,
                    assignedTo: ownerId,
                    assignedToEmail: ownerEmail,
                    createdBy: currentUser.uid,
                    createdByEmail: currentUser.email,
                    creatorRole: userRole,
                    status: 'pending',
                    deadline,
                    priority: 'medium',
                    notes: [],
                    submissions: [],
                    rejectionReason: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    source: 'playbook',
                    dealId: editDeal.id
                  })
                )
              );
            } catch (taskError) {
              console.error('Error creating playbook tasks:', taskError);
            }
          }
        }
      }
      
      if (statusChanged && isClosedOrLost && originalDeal.sourceContactId) {
        try {
          const contactRef = doc(db, 'contacts', originalDeal.sourceContactId);
          
          // Get current contact data to preserve existing deal history
          const contactSnap = await getDocs(query(collection(db, 'contacts'), where('__name__', '==', originalDeal.sourceContactId)));
          const currentContact = contactSnap.docs[0]?.data();
          const currentHistory = currentContact?.dealHistory || { closedDeals: 0, lostDeals: 0 };
          
          // Update deal history on the contact
          const dealHistoryUpdate = {
            dealHistory: {
              closedDeals: currentHistory.closedDeals + (editDeal.status === 'closed' ? 1 : 0),
              lostDeals: currentHistory.lostDeals + (editDeal.status === 'lost' ? 1 : 0),
              lastDealStatus: editDeal.status,
              lastDealDate: serverTimestamp()
            }
          };
          
          await updateDoc(contactRef, dealHistoryUpdate);
          
          const statusLabel = editDeal.status === 'closed' ? 'closed' : 'lost';
          alert(`✅ Deal updated successfully!\n\nThe contact has been updated with a "${statusLabel}" deal in their history.`);
        } catch (e) {
          console.error('Error updating contact:', e);
          alert('Deal updated successfully, but failed to update contact status.');
        }
      } else {
        alert('Deal updated successfully!');
      }

      setEditDeal(null);
      loadDeals();
      if (userRole === 'admin' || userRole === 'sales_manager') {
        loadArchivedDeals();
      }
    } catch (e) {
      console.error('Error updating deal:', e);
      alert('Failed to update deal: ' + e.message);
    }
  }

  async function releaseContact(contactId) {
    if (!contactId) return;
    
    try {
      const contactRef = doc(db, 'contacts', contactId);
      await updateDoc(contactRef, {
        releasedAt: serverTimestamp(),
        releasedBy: currentUser.uid,
        releasedByName: `${currentUser.firstName} ${currentUser.lastName}`
      });
    } catch (e) {
      console.error('Error releasing contact:', e);
    }
  }

  async function archiveDeal(id) {
    if (!window.confirm('📦 Archive this deal?\n\nYou can restore it later from the archive.')) return;
    try {
      const deal = deals.find(d => d.id === id);
      
      await updateDoc(doc(db, 'sales', id), {
        archived: true,
        archivedAt: serverTimestamp(),
        archivedBy: currentUser.uid,
        archivedByName: `${currentUser.firstName} ${currentUser.lastName}`
      });

      if (deal?.sourceContactId) {
        await releaseContact(deal.sourceContactId);
      }

      loadDeals();
      if (userRole === 'admin' || userRole === 'sales_manager') {
        loadArchivedDeals();
      }
      
      const message = deal?.sourceContactId 
        ? '✅ Deal archived successfully!\n\nThe contact has been released and is now available for others to work on.'
        : '✅ Deal archived successfully!';
      alert(message);
    } catch (e) {
      console.error('Error archiving deal:', e);
      alert('Failed to archive deal: ' + e.message);
    }
  }

  async function restoreDeal(id) {
    const deal = archivedDeals.find(d => d.id === id);
    const confirmMessage = deal?.sourceContactId
      ? '🔄 Restore this deal to active deals?\n\nThis will put the contact back on hold so you can continue working on it.'
      : '🔄 Restore this deal to active deals?';
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await updateDoc(doc(db, 'sales', id), {
        archived: false,
        restoredAt: serverTimestamp(),
        restoredBy: currentUser.uid,
        restoredByName: `${currentUser.firstName} ${currentUser.lastName}`
      });

      if (deal?.sourceContactId) {
        try {
          const contactRef = doc(db, 'contacts', deal.sourceContactId);
          await updateDoc(contactRef, {
            restoredAt: serverTimestamp(),
            restoredBy: currentUser.uid,
            restoredByName: `${currentUser.firstName} ${currentUser.lastName}`
          });
        } catch (e) {
          console.error('Error updating contact:', e);
        }
      }

      loadDeals();
      loadArchivedDeals();
      alert('✅ Deal restored successfully!');
    } catch (e) {
      console.error('Error restoring deal:', e);
      alert('Failed to restore deal: ' + e.message);
    }
  }

  async function deleteDeal(id) {
    if (userRole !== 'admin') {
      alert('⚠️ Only admins can permanently delete deals.');
      return;
    }
    if (!window.confirm('⚠️ PERMANENTLY DELETE THIS DEAL?\n\nThis action cannot be undone!')) return;
    try {
      const deal = [...deals, ...archivedDeals].find(d => d.id === id);
      
      await deleteDoc(doc(db, 'sales', id));

      if (deal?.sourceContactId) {
        await releaseContact(deal.sourceContactId);
      }

      loadDeals();
      if (showArchive) loadArchivedDeals();
      
      const message = deal?.sourceContactId
        ? '✅ Deal deleted permanently!\n\nThe contact has been released.'
        : '✅ Deal deleted permanently!';
      alert(message);
    } catch (e) {
      console.error('Error deleting deal:', e);
      alert('Failed to delete deal: ' + e.message);
    }
  }

  function goToContacts() {
    navigate('/sales/contacts');
  }

  const canManageSharing = (deal) => {
    if (!deal) return false;
    if (userRole === 'admin' || userRole === 'sales_manager') return true;
    const ownerId = deal.ownerId || deal.createdBy;
    if (ownerId === currentUser.uid) return true;
    return userRole === 'team_leader' && teamContext.teamId && deal.teamId === teamContext.teamId;
  };

  const handleOwnerChange = (ownerId) => {
    const owner = availableUsers.find(user => user.value === ownerId);
    setEditDeal(prev => ({
      ...prev,
      ownerId,
      ownerName: owner?.label || prev.ownerName,
      teamId: owner?.teamId || prev.teamId || null,
      teamName: owner?.teamName || prev.teamName || null
    }));
  };

  const handleShareToggle = (userId) => {
    setEditDeal(prev => {
      const current = Array.isArray(prev.sharedWith) ? prev.sharedWith : [];
      const next = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      return { ...prev, sharedWith: next.filter(id => id !== prev.ownerId) };
    });
  };

  const handleChecklistToggle = (stageValue, item) => {
    setEditDeal(prev => {
      const currentChecklists = prev.checklists || {};
      const currentItems = Array.isArray(currentChecklists[stageValue]) ? currentChecklists[stageValue] : [];
      const nextItems = currentItems.includes(item)
        ? currentItems.filter(value => value !== item)
        : [...currentItems, item];
      return {
        ...prev,
        checklists: {
          ...currentChecklists,
          [stageValue]: nextItems
        }
      };
    });
  };

  const dealScores = useMemo(() => {
    const map = {};
    deals.forEach(deal => {
      map[deal.id] = scoreDeal(deal, pipelineStages);
    });
    return map;
  }, [deals, pipelineStages]);

  const filtered = useMemo(() => {
    const base = deals.filter(d => {
      const s = d.businessName?.toLowerCase().includes(search.toLowerCase()) ||
                d.contactPerson?.toLowerCase().includes(search.toLowerCase());
      const f = filter === 'all' || d.status === filter;
      return s && f;
    });

    const withScores = base.map(deal => {
      const scoreMeta = dealScores[deal.id] || { score: 0, priority: 'low' };
      return { ...deal, leadScore: scoreMeta.score, leadPriority: scoreMeta.priority };
    });

    const getTimeValue = (value) => {
      const date = value?.toDate?.() || value;
      return date ? new Date(date).getTime() : 0;
    };

    if (sortMode === 'smart') {
      withScores.sort((a, b) => {
        if (b.leadScore !== a.leadScore) return b.leadScore - a.leadScore;
        return getTimeValue(b.createdAt) - getTimeValue(a.createdAt);
      });
    } else if (sortMode === 'recent') {
      withScores.sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt));
    } else if (sortMode === 'stale') {
      const getActivity = (deal) =>
        getTimeValue(deal.lastActivityAt || deal.statusUpdatedAt || deal.createdAt);
      withScores.sort((a, b) => getActivity(a) - getActivity(b));
    }

    return withScores;
  }, [deals, search, filter, sortMode, dealScores]);

  const filteredArchived = archivedDeals.filter(d =>
    d.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    d.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.filter(d => d.status === 'closed').reduce((s, d) => s + (d.price || 0), 0);
  const potentialRevenue = filtered.filter(d => d.status === 'potential_client' || d.status === 'pending_approval').reduce((s, d) => s + (d.price || 0), 0);

  const statusOptions = useMemo(
    () => pipelineStages.map(stage => ({ value: stage.value, label: stage.label })),
    [pipelineStages]
  );

  const statusLabelMap = useMemo(() => {
    const map = {};
    pipelineStages.forEach(stage => {
      map[stage.value] = stage.label;
    });
    return map;
  }, [pipelineStages]);

  const canModifyDeal = (deal) => {
    if (userRole === 'admin' || userRole === 'sales_manager') return true;
    const ownerId = deal.ownerId || deal.createdBy;
    if (ownerId === currentUser.uid) return true;
    return userRole === 'team_leader' && teamContext.teamId && deal.teamId === teamContext.teamId;
  };

  const canViewArchive = userRole === 'admin' || userRole === 'sales_manager';

  const ownerOptions = useMemo(
    () => availableUsers.map(user => ({ value: user.value, label: user.label })),
    [availableUsers]
  );

  const ownerSelectOptions = useMemo(() => {
    if (!editDeal?.ownerId) return ownerOptions;
    const exists = ownerOptions.some(option => option.value === editDeal.ownerId);
    if (exists) return ownerOptions;
    return [
      { value: editDeal.ownerId, label: editDeal.ownerName || editDeal.ownerId },
      ...ownerOptions
    ];
  }, [ownerOptions, editDeal]);

  const editOriginalDeal = editDeal
    ? deals.find(d => d.id === editDeal.id) || archivedDeals.find(d => d.id === editDeal.id)
    : null;
  const checklistStage = editOriginalDeal?.status || editDeal?.status;
  const checklistItems = checklistStage ? (playbooks?.[checklistStage]?.checklist || []) : [];
  const completedChecklist = checklistStage ? (editDeal?.checklists?.[checklistStage] || []) : [];

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
          <p className="text-gray-600 mt-1 ml-15">
            {canViewArchive ? 'Manage and track all sales pipeline deals' : 'Manage and track your sales deals'}
          </p>
        </div>

        <div className="flex gap-3">
          {canViewArchive && (
            <button
              onClick={() => setShowArchive(!showArchive)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 ${
                showArchive
                  ? 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white shadow-gray-500/30'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
              }`}
            >
              <Archive size={20} strokeWidth={2.5} />
              <span>{showArchive ? 'View Active Deals' : 'View Archive'}</span>
              {!showArchive && archivedDeals.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {archivedDeals.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={goToContacts}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:scale-105"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>Create Deal from Contact</span>
          </button>
        </div>
      </div>

      {/* INFO BANNER */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">How to Create Deals</p>
          <p className="text-sm text-blue-700 mt-1">
            Deals are created from the Contact Directory. Select a contact and click "Start Working" to create a deal and lock the contact to prevent others from working on it simultaneously.
          </p>
          <button
            onClick={goToContacts}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm"
          >
            <span>Go to Contact Directory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!canViewArchive && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <UserCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Personal Deals View</p>
            <p className="text-sm text-blue-700 mt-1">
              You are viewing deals you own, deals shared with you, and deals from your team (if assigned).
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Error Loading Deals</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* STATS */}
      {!showArchive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard title="Total Deals" value={filtered.length} icon={Briefcase} color="blue" />
          <StatCard title="Closed Deals" value={filtered.filter(d => d.status === 'closed').length} icon={CheckCircle2} color="green" />
          <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} color="purple" subtitle="From closed deals" />
          <StatCard title="Pending Approval" value={filtered.filter(d => d.status === 'pending_approval').length} icon={Clock} color="yellow" subtitle={formatCurrency(potentialRevenue) + " potential"} />
        </div>
      )}

      {showArchive && canViewArchive && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <StatCard title="Archived Deals" value={filteredArchived.length} icon={Archive} color="gray" />
          <StatCard title="Archived Revenue" value={formatCurrency(filteredArchived.filter(d => d.status === 'closed').reduce((s, d) => s + (d.price || 0), 0))} icon={DollarSign} color="gray" subtitle="From closed archived deals" />
          <StatCard title="Lost Deals" value={filteredArchived.filter(d => d.status === 'lost').length} icon={XCircle} color="gray" />
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search by business or contact name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {!showArchive && (
            <div className="relative sm:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          {!showArchive && (
            <div className="relative sm:w-56">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                value={sortMode}
                onChange={e => setSortMode(e.target.value)}
              >
                <option value="smart">Smart Priority</option>
                <option value="recent">Newest First</option>
                <option value="stale">Needs Attention</option>
              </select>
            </div>
          )}
        </div>

        {(search || filter !== 'all' || sortMode !== 'smart') && (
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
                Status: {statusLabelMap[filter] || filter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilter('all')} />
              </span>
            )}
            {sortMode !== 'smart' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                Sort: {sortMode === 'recent' ? 'Newest' : 'Needs Attention'}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSortMode('smart')} />
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

      {/* ACTIVE DEALS */}
      {!loading && !showArchive && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-600 mb-6">
            {search || filter !== 'all' 
              ? 'Try adjusting your filters or search terms' 
              : 'Get started by creating your first deal from a contact'}
          </p>
          {!search && filter === 'all' && (
            <button
              onClick={goToContacts}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span>Go to Contact Directory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {!loading && !showArchive && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
                {filtered.map(d => (
                  <DealCard
                    key={d.id}
                    deal={d}
                    onEdit={() => setEditDeal({
                      ...d,
                      ownerId: d.ownerId || d.createdBy,
                      ownerName: d.ownerName || d.createdByName || 'Unknown',
                      sharedWith: Array.isArray(d.sharedWith) ? d.sharedWith : [],
                      forecastCategory: d.forecastCategory || 'pipeline',
                      checklists: d.checklists || {}
                    })}
                    onArchive={() => archiveDeal(d.id)}
                    onDelete={() => deleteDeal(d.id)}
                    onViewProfile={() => navigate(`/sales/client/${d.id}`)}
                    onViewHistory={() => setViewingHistory(d)}
                    userRole={userRole}
                    canModify={canModifyDeal(d)}
                    pipelineStages={pipelineStages}
                  />
                ))}
              </div>
            )}

      {/* ARCHIVED DEALS */}
      {!loading && showArchive && canViewArchive && (
        <>
          {filteredArchived.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No archived deals</h3>
              <p className="text-gray-600">{search ? 'Try adjusting your search terms' : 'Archived deals will appear here'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Archive View</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You are viewing archived deals. These deals are hidden from the main view but can be restored at any time.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredArchived.map(d => (
                  <ArchivedDealCard
                    key={d.id}
                    deal={d}
                    onRestore={() => restoreDeal(d.id)}
                    onDelete={() => deleteDeal(d.id)}
                    onViewProfile={() => navigate(`/sales/client/${d.id}`)}
                    onViewHistory={() => setViewingHistory(d)}
                    pipelineStages={pipelineStages}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALS */}
      {editDeal && (
        <Modal onClose={() => setEditDeal(null)} title="Edit Deal">
          <div className="space-y-4">
            <InputField label="Business Name" icon={Briefcase} value={editDeal.businessName} onChange={e => setEditDeal({ ...editDeal, businessName: e.target.value })} />
            <InputField label="Contact Person" icon={Users} value={editDeal.contactPerson} onChange={e => setEditDeal({ ...editDeal, contactPerson: e.target.value })} />
            <InputField label="Phone Number" icon={Phone} value={editDeal.phoneNumber} onChange={e => setEditDeal({ ...editDeal, phoneNumber: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Status" value={editDeal.status} onChange={e => setEditDeal({ ...editDeal, status: e.target.value })} options={statusOptions} />
              <InputField label="Deal Value" icon={DollarSign} type="number" step="0.01" value={editDeal.price} onChange={e => setEditDeal({ ...editDeal, price: e.target.value })} />
            </div>
            <SelectField
              label="Forecast Category"
              value={editDeal.forecastCategory || 'pipeline'}
              onChange={e => setEditDeal({ ...editDeal, forecastCategory: e.target.value })}
              options={[
                { value: 'pipeline', label: 'Pipeline' },
                { value: 'best', label: 'Best Case' },
                { value: 'commit', label: 'Commit' }
              ]}
            />
            <TextAreaField label="Notes" icon={FileText} value={editDeal.notes || ''} onChange={e => setEditDeal({ ...editDeal, notes: e.target.value })} />
            {checklistItems.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Stage Checklist ({getStageLabel(pipelineStages, checklistStage)})
                </h3>
                <div className="space-y-2">
                  {checklistItems.map(item => (
                    <label key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={completedChecklist.includes(item)}
                        onChange={() => handleChecklistToggle(checklistStage, item)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Complete all checklist items to move to the next stage.
                </p>
              </div>
            )}
            {canManageSharing(editDeal) && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Ownership & Sharing</h3>
                {ownerOptions.length > 0 ? (
                  <SelectField
                    label="Deal Owner"
                    value={editDeal.ownerId || editDeal.createdBy}
                    onChange={e => handleOwnerChange(e.target.value)}
                    options={ownerSelectOptions}
                  />
                ) : (
                  <p className="text-sm text-gray-500">No users available for ownership transfer.</p>
                )}
                {availableUsers.length > 0 && (
                  <MultiSelectField
                    label="Share With (view access)"
                    value={Array.isArray(editDeal.sharedWith) ? editDeal.sharedWith : []}
                    options={availableUsers
                      .filter(user => user.value !== (editDeal.ownerId || editDeal.createdBy))
                      .map(user => ({ value: user.value, label: user.label }))}
                    onToggle={handleShareToggle}
                  />
                )}
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button onClick={saveEdit} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50">
                Save Changes
              </button>
              <button onClick={() => setEditDeal(null)} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {viewingHistory && (
        <Modal onClose={() => setViewingHistory(null)} title={`Edit History - ${viewingHistory.businessName}`}>
          <DealHistory deal={viewingHistory} pipelineStages={pipelineStages} />
        </Modal>
      )}

      {/* Loss Reason Modal */}
      {showLossReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <AlertCircle className="text-red-500" size={28} />
                Why did this deal get lost?
              </h2>
              <p className="text-gray-600 mt-2">Please provide a reason for marking this deal as lost.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <textarea
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                placeholder="Enter the reason (e.g., Budget constraints, Chose competitor, Lost contact, etc.)"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                rows="4"
              />
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    if (!lossReason.trim()) {
                      alert('Please enter a reason for the lost deal');
                      return;
                    }
                    setEditDeal({ ...editDeal, lossReason });
                    setShowLossReasonModal(false);
                    setLossReason('');
                    // Trigger save after setting the reason
                    setTimeout(saveEdit, 100);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 transition-all"
                >
                  Mark as Lost
                </button>
                <button
                  onClick={() => {
                    setShowLossReasonModal(false);
                    setLossReason('');
                    if (pendingStatusChange) {
                      const originalDeal = deals.find(d => d.id === pendingStatusChange.id) || 
                                          archivedDeals.find(d => d.id === pendingStatusChange.id);
                      setEditDeal({ ...pendingStatusChange, status: originalDeal?.status });
                    }
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
    gray: 'from-gray-500 to-gray-600 shadow-gray-500/30',
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
      {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}

function DealCard({ deal, onEdit, onArchive, onDelete, onViewProfile, onViewHistory, userRole, canModify, pipelineStages }) {
  const status = getStageByValue(pipelineStages, deal.status);
  const StatusIcon = STATUS_ICON_MAP[deal.status] || TrendingUp;
  const colorClass = getStageColorClass(pipelineStages, deal.status);
  const priorityMeta = getPriorityBadge(deal.leadPriority);
  const missingFields = getMissingRequiredFields(deal, pipelineStages);
  const missingLabels = missingFields.map(field => PIPELINE_FIELD_LABELS[field] || field);
  const missingSummary = missingLabels.length > 2
    ? `${missingLabels.slice(0, 2).join(', ')} +${missingLabels.length - 2}`
    : missingLabels.join(', ');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
            {deal.ownerName && (
              <span className="flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                Owner: {deal.ownerName}
              </span>
            )}
            {Array.isArray(deal.sharedWith) && deal.sharedWith.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Shared: {deal.sharedWith.length}
              </span>
            )}
          </div>
          {deal.sourceContactId && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" />
                From Contact Directory
              </span>
            </div>
          )}
          {deal.notes && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
              💬 {deal.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${priorityMeta.color}`}>
              {priorityMeta.label} • {deal.leadScore ?? 0}
            </span>
            {missingFields.length > 0 && (
              <span className="px-3 py-1 rounded-lg text-xs font-semibold border bg-red-50 text-red-700 border-red-200">
                Missing: {missingSummary}
              </span>
            )}
          </div>
          <div className="text-left sm:text-center lg:text-right">
            <p className="text-sm text-gray-600 mb-1">Deal Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(deal.price || 0)}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-semibold text-sm border flex items-center gap-2 ${colorClass}`}>
            <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
            {status?.label || deal.status}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
        <button onClick={onViewProfile} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium transition-all">
          <Eye className="w-4 h-4" />
          <span>View Profile</span>
        </button>
        {deal.editHistory && deal.editHistory.length > 0 && (
          <button onClick={onViewHistory} className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg font-medium transition-all">
            <Clock className="w-4 h-4" />
            <span>History ({deal.editHistory.length})</span>
          </button>
        )}
        {canModify && (
          <>
            <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-all">
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button onClick={onArchive} className="flex items-center gap-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-lg font-medium transition-all">
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
          </>
        )}
        {userRole === 'admin' && (
          <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all">
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

function ArchivedDealCard({ deal, onRestore, onDelete, onViewProfile, onViewHistory, pipelineStages }) {
  const status = getStageByValue(pipelineStages, deal.status);
  const StatusIcon = STATUS_ICON_MAP[deal.status] || TrendingUp;
  const colorClass = getStageColorClass(pipelineStages, deal.status);

  return (
    <div className="bg-gray-50 rounded-2xl shadow-sm border-2 border-gray-300 p-6 hover:shadow-lg transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
              <Archive className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 truncate">{deal.businessName}</h3>
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">ARCHIVED</span>
              </div>
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
            {deal.archivedByName && (
              <span className="flex items-center gap-1">
                <Archive className="w-4 h-4" />
                Archived by {deal.archivedByName}
              </span>
            )}
          </div>
          {deal.sourceContactId && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-purple-200">
                <Users className="w-3 h-3" />
                From Contact Directory
              </span>
            </div>
          )}
          {deal.notes && (
            <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-300">
              💬 {deal.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4">
          <div className="text-left sm:text-center lg:text-right">
            <p className="text-sm text-gray-600 mb-1">Deal Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(deal.price || 0)}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-semibold text-sm border flex items-center gap-2 ${colorClass}`}>
            <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
            {status?.label || deal.status}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-300 flex flex-wrap gap-2">
        <button onClick={onViewProfile} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium transition-all">
          <Eye className="w-4 h-4" />
          <span>View Profile</span>
        </button>
        {deal.editHistory && deal.editHistory.length > 0 && (
          <button onClick={onViewHistory} className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg font-medium transition-all border border-purple-200">
            <Clock className="w-4 h-4" />
            <span>History ({deal.editHistory.length})</span>
          </button>
        )}
        <button onClick={onRestore} className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-medium transition-all border border-green-200">
          <ArchiveRestore className="w-4 h-4" />
          <span>Restore</span>
        </button>
        <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all">
          <Trash2 className="w-4 h-4" />
          <span>Delete Forever</span>
        </button>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}

function InputField({ label, icon: Icon, required, value, onChange, type = "text", step, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-2" />}
        {label} {required && '*'}
      </label>
      <input
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        required={required}
        type={type}
        step={step}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
        value={value}
        onChange={onChange}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function MultiSelectField({ label, value, options, onToggle }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(option => {
          const checked = value.includes(option.value);
          return (
            <label
              key={option.value}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700 font-medium">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function TextAreaField({ label, icon: Icon, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-2" />}
        {label}
      </label>
      <textarea
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        placeholder={`Add ${label.toLowerCase()}...`}
        rows={rows}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
