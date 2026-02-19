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

        if (userRole === 'team_leader' && teamContext.teamId) {
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

  // ──────────────────────────────────────────────
  // releaseContact – clears the lock so the contact
  // shows as "Available" again on the Contacts page.
  // Called when a deal is closed, lost, archived, or deleted.
  // ──────────────────────────────────────────────
  async function releaseContact(contactId) {
    if (!contactId) return;
    
    try {
      const contactRef = doc(db, 'contacts', contactId);
      await updateDoc(contactRef, {
        // ── clear every lock field ──
        activeDealId: null,
        activeDealOwnerId: null,
        activeDealOwnerName: null,
        activeDealStage: null,
        activeDealStatus: null,       // this is the key flag isContactInProgress checks
        // ── audit trail ──
        releasedAt: serverTimestamp(),
        releasedBy: currentUser.uid,
        releasedByName: `${currentUser.firstName} ${currentUser.lastName}`
      });
    } catch (e) {
      console.error('Error releasing contact:', e);
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

      // ── BUILD EDIT-HISTORY CHANGES OBJECT ──────────────────────────────
      // Every `from` / `to` value is coerced with ?? null so that fields
      // which don't yet exist on the Firestore document (e.g. lossReason)
      // never produce a bare `undefined`.  Firestore's arrayUnion() rejects
      // objects that contain undefined anywhere in their tree.
      const changes = {};

      ['businessName', 'contactPerson', 'phoneNumber', 'status', 'price', 'notes', 'lossReason', 'forecastCategory'].forEach(field => {
        if (originalDeal[field] !== editDeal[field]) {
          changes[field] = {
            from: originalDeal[field] ?? null,
            to:   editDeal[field]     ?? null
          };
        }
      });

      const ownerChanged = (originalDeal.ownerId || originalDeal.createdBy) !== (editDeal.ownerId || editDeal.createdBy);
      if (ownerChanged) {
        changes.owner = {
          from: (originalDeal.ownerName || originalDeal.createdByName || originalDeal.ownerId || originalDeal.createdBy) ?? null,
          to:   (editDeal.ownerName     || editDeal.createdByName     || editDeal.ownerId     || editDeal.createdBy)     ?? null
        };
      }

      if (originalDeal.teamId !== editDeal.teamId) {
        changes.teamName = {
          from: originalDeal.teamName || originalDeal.teamId || '(none)',
          to:   editDeal.teamName     || editDeal.teamId     || '(none)'
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
      // ── END CHANGES OBJECT ──────────────────────────────────────────────

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

      // Keep contact lock ownership in sync while deal is active
      if (ownerChanged && originalDeal.sourceContactId && editDeal.status !== 'closed' && editDeal.status !== 'lost') {
        try {
          await updateDoc(doc(db, 'contacts', originalDeal.sourceContactId), {
            activeDealId: editDeal.id,
            activeDealOwnerId: editDeal.ownerId || editDeal.createdBy,
            activeDealOwnerName: editDeal.ownerName || editDeal.createdByName || 'Unknown',
            activeDealStage: editDeal.status,
            activeDealStatus: 'active'
          });
        } catch (ownerSyncError) {
          console.error('Error syncing contact owner:', ownerSyncError);
        }
      }

      // ── is the new status a terminal one? ──
      const isClosedOrLost = editDeal.status === 'closed' || editDeal.status === 'lost';

      if (statusChanged && !isClosedOrLost && originalDeal.sourceContactId) {
        try {
          await updateDoc(doc(db, 'contacts', originalDeal.sourceContactId), {
            activeDealId: editDeal.id,
            activeDealStage: editDeal.status,
            activeDealStatus: 'active'
          });
        } catch (stageSyncError) {
          console.error('Error syncing contact stage:', stageSyncError);
        }
      }

      // Send notifications
      if (statusChanged) {
        try {
          console.log('Sending notification for deal update...');
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
      
      // ── contact updates when deal reaches a terminal status ──
      if (statusChanged && isClosedOrLost && originalDeal.sourceContactId) {
        try {
          const contactRef = doc(db, 'contacts', originalDeal.sourceContactId);

          // 1. Bump the deal-history counters on the contact
          const contactSnap = await getDoc(contactRef);
          const currentContact = contactSnap.exists() ? contactSnap.data() : {};
          const currentHistory = currentContact?.dealHistory || { closedDeals: 0, lostDeals: 0 };

          await updateDoc(contactRef, {
            dealHistory: {
              closedDeals: currentHistory.closedDeals + (editDeal.status === 'closed' ? 1 : 0),
              lostDeals: currentHistory.lostDeals + (editDeal.status === 'lost' ? 1 : 0),
              lastDealStatus: editDeal.status,
              lastDealDate: serverTimestamp()
            }
          });

          // 2. Release the lock so the contact becomes Available again
          await releaseContact(originalDeal.sourceContactId);

          const statusLabel = editDeal.status === 'closed' ? 'closed (won)' : 'lost';
          alert(`✅ Deal updated successfully!\n\nThe contact has been updated with a "${statusLabel}" deal in their history and is now available for new deals.`);
        } catch (e) {
          console.error('Error updating contact after close/lost:', e);
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

      // Re-lock the contact if this deal has a source contact
      if (deal?.sourceContactId) {
        try {
          const contactRef = doc(db, 'contacts', deal.sourceContactId);
          await updateDoc(contactRef, {
            activeDealId: deal.id,
            activeDealOwnerId: deal.ownerId || deal.createdBy,
            activeDealOwnerName: deal.ownerName || deal.createdByName || 'Unknown',
            activeDealStage: deal.status,
            activeDealStatus: 'active',
            restoredAt: serverTimestamp(),
            restoredBy: currentUser.uid,
            restoredByName: `${currentUser.firstName} ${currentUser.lastName}`
          });
        } catch (e) {
          console.error('Error re-locking contact on restore:', e);
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
    <div className="min-h-screen bg-[#f6f8f7] dark:bg-[#102218] text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#13ec6d] text-[#102218] shadow-[0_0_20px_rgba(19,236,109,0.3)]">
                <Briefcase className="w-6 h-6" />
              </span>
              Sales Pipeline
            </h1>
            <p className="text-slate-500 font-medium">
              Monitoring <span className="text-[#13ec6d] font-bold">{filtered.length} active deals</span> worth {formatCurrency(potentialRevenue)}
            </p>
            <p className="text-slate-500 text-sm">
              {canViewArchive ? 'Manage and track all sales pipeline deals' : 'Manage and track your sales deals'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canViewArchive && (
              <button
                onClick={() => setShowArchive(!showArchive)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  showArchive
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-[#13ec6d]'
                }`}
              >
                <Archive size={18} />
                <span>{showArchive ? 'View Active Deals' : 'Archive'}</span>
                {!showArchive && archivedDeals.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-[#13ec6d]/20 text-[#13ec6d] rounded-full text-xs font-bold">
                    {archivedDeals.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={goToContacts}
              className="bg-[#13ec6d] text-[#102218] px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(19,236,109,0.3)] hover:shadow-[0_0_30px_rgba(19,236,109,0.5)] transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Create Deal</span>
            </button>
          </div>
        </div>

      {/* INFO BANNER */}
      <div className="bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl border border-white/40 dark:border-[#13ec6d]/10 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <Users className="w-5 h-5 text-[#13ec6d] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">How to Create Deals</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Deals are created from the Contact Directory. Select a contact and click "Start Working" to create a deal and lock the contact to prevent others from working on it simultaneously.
          </p>
          <button
            onClick={goToContacts}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#13ec6d] text-[#102218] rounded-lg font-bold transition-all text-sm"
          >
            <span>Go to Contact Directory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!canViewArchive && (
        <div className="bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl border border-white/40 dark:border-[#13ec6d]/10 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <UserCheck className="w-5 h-5 text-[#13ec6d] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Personal Deals View</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              You are viewing deals you own, deals shared with you, and deals from your team (if assigned).
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl border border-red-200/60 dark:border-red-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-600">Error Loading Deals</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
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
      <div className="bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 dark:border-[#13ec6d]/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              placeholder="Search by business or contact name..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-[#13ec6d]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13ec6d]/40 focus:border-transparent transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {!showArchive && (
            <div className="relative sm:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-[#13ec6d]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13ec6d]/40 focus:border-transparent transition-all appearance-none cursor-pointer"
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
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-[#13ec6d]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13ec6d]/40 focus:border-transparent transition-all appearance-none cursor-pointer"
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
            <span className="text-sm text-slate-500">Active filters:</span>
            {search && (
              <span className="px-3 py-1 bg-[#13ec6d]/10 text-[#13ec6d] rounded-lg text-sm font-medium flex items-center gap-2">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
              </span>
            )}
            {filter !== 'all' && (
              <span className="px-3 py-1 bg-[#13ec6d]/10 text-[#13ec6d] rounded-lg text-sm font-medium flex items-center gap-2">
                Status: {statusLabelMap[filter] || filter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilter('all')} />
              </span>
            )}
            {sortMode !== 'smart' && (
              <span className="px-3 py-1 bg-[#13ec6d]/10 text-[#13ec6d] rounded-lg text-sm font-medium flex items-center gap-2">
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
          <div className="w-16 h-16 border-4 border-[#13ec6d]/20 border-t-[#13ec6d] rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading deals...</p>
        </div>
      )}

      {/* ACTIVE DEALS */}
      {!loading && !showArchive && filtered.length === 0 && (
        <div className="bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 dark:border-[#13ec6d]/10 p-12 text-center">
          <div className="w-20 h-20 bg-[#13ec6d]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-[#13ec6d]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No deals found</h3>
          <p className="text-slate-500 mb-6">
            {search || filter !== 'all' 
              ? 'Try adjusting your filters or search terms' 
              : 'Get started by creating your first deal from a contact'}
          </p>
          {!search && filter === 'all' && (
            <button
              onClick={goToContacts}
              className="px-6 py-3 bg-[#13ec6d] text-[#102218] rounded-xl font-semibold shadow-[0_0_20px_rgba(19,236,109,0.3)] hover:shadow-[0_0_30px_rgba(19,236,109,0.5)] transition-all inline-flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span>Go to Contact Directory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {!loading && !showArchive && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <div className="bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 dark:border-[#13ec6d]/10 p-12 text-center">
              <div className="w-20 h-20 bg-slate-200/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No archived deals</h3>
              <p className="text-slate-500">{search ? 'Try adjusting your search terms' : 'Archived deals will appear here'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl border border-yellow-200/60 dark:border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-600">Archive View</p>
                  <p className="text-sm text-yellow-500 mt-1">
                    You are viewing archived deals. These deals are hidden from the main view but can be restored at any time.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const accentClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-emerald-600 bg-emerald-100',
    purple: 'text-purple-600 bg-purple-100',
    yellow: 'text-amber-600 bg-amber-100',
    gray: 'text-slate-600 bg-slate-200',
  };

  return (
    <div className="glass-card bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl border border-white/40 dark:border-[#13ec6d]/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${accentClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </div>
  );
}

function DealCard({ deal, onEdit, onArchive, onDelete, onViewProfile, onViewHistory, userRole, canModify, pipelineStages }) {
  const status = getStageByValue(pipelineStages, deal.status);
  const colorClass = getStageColorClass(pipelineStages, deal.status);
  const priorityMeta = getPriorityBadge(deal.leadPriority);
  const missingFields = getMissingRequiredFields(deal, pipelineStages);
  const missingLabels = missingFields.map(field => PIPELINE_FIELD_LABELS[field] || field);
  const missingSummary = missingLabels.length > 2
    ? `${missingLabels.slice(0, 2).join(', ')} +${missingLabels.length - 2}`
    : missingLabels.join(', ');
  const stageIndex = Array.isArray(pipelineStages)
    ? pipelineStages.findIndex(stage => stage.value === deal.status)
    : -1;
  const stageProgress = stageIndex >= 0 && pipelineStages.length > 1
    ? Math.round((stageIndex / (pipelineStages.length - 1)) * 100)
    : 0;
  const stageLabel = status?.label || deal.status || 'Unknown';
  const dealRef = deal.dealId || deal.referenceId || deal.id || '';
  const dealRefLabel = dealRef ? `#${dealRef.slice(-6).toUpperCase()}` : null;
  const stageColor = status?.color || 'gray';
  const accentMap = {
    blue: 'border-l-blue-400',
    green: 'border-l-emerald-400',
    yellow: 'border-l-amber-400',
    red: 'border-l-red-400',
    purple: 'border-l-purple-400',
    gray: 'border-l-slate-300'
  };
  const accentClass = accentMap[stageColor] || accentMap.gray;

  return (
    <div className={`bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl border border-white/40 dark:border-[#13ec6d]/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 ${accentClass}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{deal.businessName}</h4>
            {dealRefLabel && (
              <p className="text-xs font-bold text-slate-400">ID: {dealRefLabel}</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-[10px] uppercase font-black tracking-tighter border ${colorClass}`}>
          {stageLabel}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-500">{stageLabel}</span>
            <span className="text-[#13ec6d]">{stageProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full">
            <div className="bg-[#13ec6d] h-full rounded-full" style={{ width: `${stageProgress}%` }}></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {deal.contactPerson && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {deal.contactPerson}
            </span>
          )}
          {deal.phoneNumber && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {deal.phoneNumber}
            </span>
          )}
          {deal.ownerName && (
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Owner: {deal.ownerName}
            </span>
          )}
          {Array.isArray(deal.sharedWith) && deal.sharedWith.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Shared: {deal.sharedWith.length}
            </span>
          )}
        </div>

        <div className="flex justify-between items-end pt-2">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Deal Value</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(deal.price || 0)}</p>
          </div>
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
        </div>

        {deal.notes && (
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 rounded-lg p-3 border border-white/40 dark:border-[#13ec6d]/10">
            💬 {deal.notes}
          </p>
        )}

        {deal.sourceContactId && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1">
              <Users className="w-3 h-3" />
              From Contact Directory
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800/60 flex flex-wrap gap-2">
        <button onClick={onViewProfile} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all">
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
            <button onClick={onArchive} className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg font-medium transition-all">
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
  const colorClass = getStageColorClass(pipelineStages, deal.status);

  return (
    <div className="bg-white/70 dark:bg-[#102218]/70 backdrop-blur-xl border border-white/40 dark:border-[#13ec6d]/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Archive className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{deal.businessName}</h4>
            <p className="text-xs font-bold text-slate-400">ARCHIVED</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-[10px] uppercase font-black tracking-tighter border ${colorClass}`}>
          {status?.label || deal.status}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {deal.contactPerson && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {deal.contactPerson}
            </span>
          )}
          {deal.phoneNumber && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {deal.phoneNumber}
            </span>
          )}
          {deal.archivedByName && (
            <span className="flex items-center gap-1">
              <Archive className="w-3.5 h-3.5" />
              Archived by {deal.archivedByName}
            </span>
          )}
        </div>

        <div>
          <p className="text-xs text-slate-500 font-bold uppercase">Deal Value</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(deal.price || 0)}</p>
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
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 rounded-lg p-3 border border-white/40 dark:border-[#13ec6d]/10">
            💬 {deal.notes}
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800/60 flex flex-wrap gap-2">
        <button onClick={onViewProfile} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all">
          <Eye className="w-4 h-4" />
          <span>View Profile</span>
        </button>
        {deal.editHistory && deal.editHistory.length > 0 && (
          <button onClick={onViewHistory} className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg font-medium transition-all">
            <Clock className="w-4 h-4" />
            <span>History ({deal.editHistory.length})</span>
          </button>
        )}
        <button onClick={onRestore} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-medium transition-all">
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
