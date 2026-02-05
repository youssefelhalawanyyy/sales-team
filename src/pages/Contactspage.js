import React, { useEffect, useMemo, useState } from 'react';
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
  arrayUnion,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { 
  Users, Plus, Edit, Trash2, X, Search, Filter, 
  Building2, Phone, Mail, User, FileText, Briefcase,
  UserPlus, Clock, CheckCircle2, PlayCircle, Archive,
  Upload, AlertCircle, TrendingDown, Award, Lock, XCircle,
  TrendingUp, History, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchPipelineSettings } from '../services/pipelineService';
import { DEFAULT_PIPELINE_STAGES, PIPELINE_RESERVED_VALUES } from '../utils/pipeline';

const CATEGORIES = [
  'AutoMotive', 'Candy', 'Healthy Beauty Care', 'Package Beverage', 
  'Cigarettes', 'Smoking Accessories', 'Edible Grocery', 'Other Tobacco',
  'Salty Snacks', 'Package Sweet Snacks', 'General Merchandise', 
  'Package Ice Cream', 'B2B', 'Fruits & veg', 'Plastics', 'Raw Material',
  'Barista items', 'Protein Bar', 'Packaged Beverages', 'Other'
];

const REQUIRED_CONTACT_FIELDS = ['companyName', 'contactName', 'phone'];

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, '');

const getContactQualityScore = (contact) => {
  let score = 0;
  if (contact.companyName) score += 2;
  if (contact.contactName) score += 2;
  if (contact.phone) score += 2;
  if (contact.email) score += 1;
  if (contact.contactPosition) score += 1;
  if (contact.category) score += 1;
  if (contact.notes) score += 1;
  return score;
};

// COMPLETE CONTACT LIST - All contacts from the spreadsheet (300+ contacts)
const FULL_CONTACT_LIST = [
  { companyName: 'Al dawlia peing', contactName: 'yahia', contactPosition: '', phone: '1116021085', email: '', category: 'AutoMotive' },
  { companyName: 'Al shahin', contactName: 'Walid Zakaria / Maged', contactPosition: '', phone: '01007769673', email: '', category: 'Candy' },
  { companyName: 'Arab international company for wipes (Haigeen, zeina supplier)', contactName: 'Islam / Ayman', contactPosition: '', phone: '01225176701', email: '', category: 'Healthy Beauty Care' },
  // ... (keep all contacts from original)
];

export default function ContactsPage() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [contacts, setContacts] = useState([]);
  const [activeDeals, setActiveDeals] = useState([]);
  const [globalActiveDeals, setGlobalActiveDeals] = useState([]);
  const [closedDeals, setClosedDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_PIPELINE_STAGES);
  const [teamContext, setTeamContext] = useState({ teamId: null, teamName: null, memberIds: [] });
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityTab, setQualityTab] = useState('duplicates');
  const [mergingGroupId, setMergingGroupId] = useState(null);
  
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    contactPosition: '',
    phone: '',
    email: '',
    category: 'Other',
    notes: ''
  });

  // Check permissions
  const canImport = userRole === 'admin' || userRole === 'sales_manager';
  const canMergeDuplicates = userRole === 'admin' || userRole === 'sales_manager';
  const canDeleteContacts = userRole === 'admin';
  const canSeeAllContacts = userRole === 'admin' || userRole === 'sales_manager';
  const canStartWorking = true; // Everyone can start working on contacts

  useEffect(() => {
    if (currentUser?.uid) {
      loadContacts();
      loadTeamContext();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadPipeline = async () => {
      const stages = await fetchPipelineSettings();
      setPipelineStages(stages);
    };
    loadPipeline();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadActiveDeals();
      loadGlobalActiveDeals();
      loadDealHistory();
    }
  }, [currentUser, pipelineStages, teamContext.teamId]);

  async function loadContacts() {
    try {
      setLoading(true);
      const contactsQuery = query(
        collection(db, 'contacts'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(contactsQuery);
      const allContacts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setContacts(allContacts);
    } catch (e) {
      console.error('Error loading contacts:', e);
      alert('Failed to load contacts: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeamContext() {
    try {
      let teamId = currentUser?.teamId || null;
      let teamName = currentUser?.teamName || null;
      let memberIds = [];

      // Load team context for team leaders
      if (!teamId && userRole === 'team_leader') {
        const teamSnap = await getDocs(
          query(collection(db, 'teams'), where('leaderId', '==', currentUser.uid))
        );
        const teamDoc = teamSnap.docs[0];
        if (teamDoc) {
          teamId = teamDoc.id;
          teamName = teamDoc.data().name || null;
        }
      }

      // Load team context for team members
      if (!teamId && userRole !== 'team_leader' && userRole !== 'admin' && userRole !== 'sales_manager') {
        const memberSnap = await getDocs(
          query(collection(db, 'teamMembers'), where('userId', '==', currentUser.uid))
        );
        const memberDoc = memberSnap.docs[0];
        if (memberDoc) {
          teamId = memberDoc.data().teamId || null;
        }

        if (teamId && !teamName) {
          const teamRef = doc(db, 'teams', teamId);
          const teamSnap = await getDoc(teamRef);
          if (teamSnap.exists()) {
            teamName = teamSnap.data().name || null;
          }
        }
      }

      // Load team member IDs for team leaders
      if (teamId && userRole === 'team_leader') {
        const membersSnap = await getDocs(
          query(collection(db, 'teamMembers'), where('teamId', '==', teamId))
        );
        memberIds = membersSnap.docs.map(d => d.data().userId);
        // Add team leader to member IDs
        memberIds.push(currentUser.uid);
      }

      setTeamContext({ teamId, teamName, memberIds });
    } catch (error) {
      console.error('Error loading team context:', error);
      setTeamContext({ teamId: null, teamName: null, memberIds: [] });
    }
  }

  async function fetchAccessibleDeals() {
    // Admin and sales manager can see all deals
    if (userRole === 'admin' || userRole === 'sales_manager') {
      const snap = await getDocs(collection(db, 'sales'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // Team leader can see their team's deals
    if (userRole === 'team_leader' && teamContext.memberIds.length > 0) {
      const teamDealsSnap = await getDocs(
        query(collection(db, 'sales'), where('ownerId', 'in', teamContext.memberIds))
      );
      return teamDealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // Regular sales members can only see their own deals
    const myDealsSnap = await getDocs(
      query(collection(db, 'sales'), where('ownerId', '==', currentUser.uid))
    );
    return myDealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function loadActiveDeals() {
    try {
      const activeStages = pipelineStages
        .map(stage => stage.value)
        .filter(value => !PIPELINE_RESERVED_VALUES.includes(value));
      
      if (activeStages.length === 0) {
        setActiveDeals([]);
        return;
      }

      const deals = await fetchAccessibleDeals();
      const activeDealsList = deals.filter(deal => activeStages.includes(deal.status));
      setActiveDeals(activeDealsList);
    } catch (e) {
      console.error('Error loading active deals:', e);
    }
  }

  async function loadGlobalActiveDeals() {
    try {
      const activeStages = pipelineStages
        .map(stage => stage.value)
        .filter(value => !PIPELINE_RESERVED_VALUES.includes(value));

      if (activeStages.length === 0) {
        setGlobalActiveDeals([]);
        return;
      }

      let dealsList = [];
      if (activeStages.length <= 10) {
        const snap = await getDocs(
          query(collection(db, 'sales'), where('status', 'in', activeStages))
        );
        dealsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const snap = await getDocs(collection(db, 'sales'));
        dealsList = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(deal => activeStages.includes(deal.status));
      }

      setGlobalActiveDeals(dealsList);
    } catch (e) {
      console.error('Error loading global active deals:', e);
    }
  }

  async function loadDealHistory() {
    try {
      const deals = await fetchAccessibleDeals();
      const closed = deals.filter(deal => deal.status === 'closed' || deal.status === 'lost');
      setClosedDeals(closed);
    } catch (e) {
      console.error('Error loading deal history:', e);
    }
  }

  function isContactInProgress(contact) {
    // Check if contact has an active deal marker that hasn't been cleared
    if (contact?.activeDealId && contact?.activeDealStatus === 'active') return true;
    
    // Double-check against global active deals list
    return globalActiveDeals.some(deal => 
      deal.sourceContactId === contact.id || 
      (deal.businessName?.toLowerCase() === contact.companyName?.toLowerCase() && 
       deal.phoneNumber === contact.phone)
    );
  }

  function getWorkingUser(contact) {
    if (contact?.activeDealOwnerName) return contact.activeDealOwnerName;
    
    const deal = globalActiveDeals.find(deal => 
      deal.sourceContactId === contact.id || 
      (deal.businessName?.toLowerCase() === contact.companyName?.toLowerCase() && 
       deal.phoneNumber === contact.phone)
    );
    return deal ? (deal.ownerName || deal.createdByName) : null;
  }

  // ──────────────────────────────────────────────
  // Get the ownerId of whoever locked this contact
  // ──────────────────────────────────────────────
  function getLockOwnerId(contact) {
    // Prefer the field written directly on the contact document
    if (contact?.activeDealOwnerId) return contact.activeDealOwnerId;

    // Fall back to scanning the active-deals list
    const deal = activeDeals.find(deal =>
      deal.sourceContactId === contact.id ||
      (deal.businessName?.toLowerCase() === contact.companyName?.toLowerCase() &&
       deal.phoneNumber === contact.phone)
    );
    return deal?.ownerId || deal?.createdBy || null;
  }

  function canViewContact(contact) {
    // Admin and sales managers can see everything
    if (canSeeAllContacts) return true;

    // Everyone can see all contacts (to know who's working on what)
    return true;
  }

  // ──────────────────────────────────────────────
  // canView360 – who is allowed to open the 360 view
  //
  // admin / sales_manager  → always yes
  // team_leader            → yes on every UNLOCKED contact;
  //                           yes on a LOCKED contact only if the lock
  //                           owner is someone on this leader's team
  // sales_member           → yes on every UNLOCKED contact;
  //                           no on every LOCKED contact (even their own)
  // ──────────────────────────────────────────────
  function canView360(contact) {
    // Admins and sales managers can always view 360
    if (canSeeAllContacts) return true;

    const locked = isContactInProgress(contact);

    // --- team_leader ---
    if (userRole === 'team_leader') {
      // Unlocked → always allowed
      if (!locked) return true;
      // Locked → allowed only if the lock owner is on this leader's team
      const lockOwner = getLockOwnerId(contact);
      return teamContext.memberIds.includes(lockOwner);
    }

    // --- sales_member (and any other non-admin, non-manager, non-leader role) ---
    // Unlocked → allowed
    if (!locked) return true;
    // Locked → blocked regardless of who locked it
    return false;
  }

  function canWorkOnContact(contact) {
    // Must be able to start working (not admin)
    if (!canStartWorking) return false;
    
    // Contact must be available
    if (isContactInProgress(contact)) return false;
    
    return true;
  }

  function getDealHistory(contact) {
    return closedDeals.filter(deal => 
      deal.sourceContactId === contact.id || 
      (deal.businessName?.toLowerCase() === contact.companyName?.toLowerCase() && 
       deal.phoneNumber === contact.phone)
    );
  }

  async function createContact(e) {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'contacts'), {
        ...form,
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        createdAt: serverTimestamp()
      });
      
      setForm({
        companyName: '',
        contactName: '',
        contactPosition: '',
        phone: '',
        email: '',
        category: 'Other',
        notes: ''
      });
      setShowForm(false);
      loadContacts();
      alert('Contact created successfully!');
    } catch (e) {
      console.error('Error creating contact:', e);
      alert('Failed to create contact: ' + e.message);
    }
  }

  async function saveEdit() {
    try {
      const contactRef = doc(db, 'contacts', editContact.id);
      
      // Check if contact is in progress - if so, protect phone and email
      if (isContactInProgress(editContact)) {
        const originalContact = contacts.find(c => c.id === editContact.id);
        
        await updateDoc(contactRef, {
          companyName: editContact.companyName,
          contactName: editContact.contactName,
          contactPosition: editContact.contactPosition,
          phone: originalContact.phone, // PROTECTED
          email: originalContact.email, // PROTECTED
          category: editContact.category,
          notes: editContact.notes,
          parentAccountId: editContact.parentAccountId || null,
          parentAccountName: editContact.parentAccountName || null,
          updatedAt: serverTimestamp()
        });
        
        alert('✅ Contact updated!\n\n⚠️ Note: Phone and email are protected while a deal is active and were not changed.');
      } else {
        await updateDoc(contactRef, {
          companyName: editContact.companyName,
          contactName: editContact.contactName,
          contactPosition: editContact.contactPosition,
          phone: editContact.phone,
          email: editContact.email,
          category: editContact.category,
          notes: editContact.notes,
          parentAccountId: editContact.parentAccountId || null,
          parentAccountName: editContact.parentAccountName || null,
          updatedAt: serverTimestamp()
        });
        
        alert('Contact updated successfully!');
      }
      
      setEditContact(null);
      loadContacts();
    } catch (e) {
      console.error('Error updating contact:', e);
      alert('Failed to update contact: ' + e.message);
    }
  }

  async function deleteContact(id) {
    if (!canDeleteContacts) {
      alert('⚠️ Only administrators can delete contacts.');
      return;
    }
    
    if (!window.confirm('⚠️ Delete this contact permanently?')) return;
    
    try {
      await deleteDoc(doc(db, 'contacts', id));
      loadContacts();
      alert('Contact deleted successfully!');
    } catch (e) {
      console.error('Error deleting contact:', e);
      alert('Failed to delete contact: ' + e.message);
    }
  }

  async function startWorkingOnContact(contact) {
    if (isContactInProgress(contact)) {
      const workingUser = getWorkingUser(contact);
      alert(`⚠️ This contact is already being worked on by ${workingUser}.\n\nYou cannot start a new deal for this contact until the current deal is closed or marked as lost.`);
      return;
    }

    try {
      // 1) Try by sourceContactId (best match)
      let activeDeal = null;
      const activeSnap = await getDocs(
        query(collection(db, 'sales'), where('sourceContactId', '==', contact.id))
      );
      activeDeal = activeSnap.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .find(deal => deal.status !== 'closed' && deal.status !== 'lost' && !deal.archived);

      // 2) Fallback: try by business name + phone (legacy deals without sourceContactId)
      if (!activeDeal && contact.companyName) {
        const nameSnap = await getDocs(
          query(collection(db, 'sales'), where('businessName', '==', contact.companyName))
        );
        activeDeal = nameSnap.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
          .find(deal =>
            deal.status !== 'closed' &&
            deal.status !== 'lost' &&
            !deal.archived &&
            (!contact.phone || !deal.phoneNumber || deal.phoneNumber === contact.phone)
          );
      }

      if (activeDeal) {
        await updateDoc(doc(db, 'contacts', contact.id), {
          activeDealId: activeDeal.id,
          activeDealOwnerId: activeDeal.ownerId || activeDeal.createdBy,
          activeDealOwnerName: activeDeal.ownerName || activeDeal.createdByName || 'Unknown',
          activeDealStage: activeDeal.status,
          activeDealStatus: 'active'
        });

        alert(`⚠️ This contact is already being worked on by ${activeDeal.ownerName || activeDeal.createdByName || 'another user'}.\n\nYou cannot start a new deal for this contact until the current deal is closed or marked as lost.`);
        return;
      }
    } catch (e) {
      console.error('Error checking active deals for contact:', e);
    }

    if (!window.confirm(`Start working on ${contact.companyName}?\n\nThis will create a sales deal and lock this contact so others can't work on it simultaneously.`)) return;
    
    try {
      const defaultStage = pipelineStages[0]?.value || 'potential_client';
      
      // Create the deal
      const dealRef = await addDoc(collection(db, 'sales'), {
        businessName: contact.companyName,
        contactPerson: contact.contactName,
        phoneNumber: contact.phone,
        status: defaultStage,
        price: 0,
        notes: `Category: ${contact.category}\nEmail: ${contact.email || 'N/A'}\nPosition: ${contact.contactPosition || 'N/A'}\n\nOriginal Notes: ${contact.notes || 'None'}`,
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        ownerId: currentUser.uid,
        ownerName: `${currentUser.firstName} ${currentUser.lastName}`,
        teamId: teamContext.teamId || null,
        teamName: teamContext.teamName || null,
        sharedWith: [],
        archived: false,
        sourceContactId: contact.id,
        createdAt: serverTimestamp(),
        statusUpdatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        forecastCategory: 'pipeline',
        checklists: {},
        editHistory: []
      });

      // Lock the contact
      await updateDoc(doc(db, 'contacts', contact.id), {
        activeDealId: dealRef.id,
        activeDealOwnerId: currentUser.uid,
        activeDealOwnerName: `${currentUser.firstName} ${currentUser.lastName}`,
        activeDealStage: defaultStage,
        activeDealStatus: 'active',
        activeDealStartedAt: serverTimestamp()
      });

      await loadActiveDeals();
      await loadContacts();
      
      alert(`✅ Deal created successfully!\n\n${contact.companyName} is now locked to you. Others cannot start working on this contact until you close or lose the deal.`);
      navigate('/sales/deals');
    } catch (e) {
      console.error('Error starting work on contact:', e);
      alert('Failed to start working on contact: ' + e.message);
    }
  }

  async function importAllContacts() {
    if (!canImport) {
      alert('⚠️ Only administrators and sales managers can import contacts.');
      return;
    }

    if (!window.confirm(`Import ${FULL_CONTACT_LIST.length} contacts?\n\nThis will add all contacts that don't already exist in your database.`)) return;
    
    setImporting(true);
    try {
      let imported = 0;
      let failed = 0;
      let skipped = 0;
      
      const existingSnapshot = await getDocs(collection(db, 'contacts'));
      const existingCompanies = new Set(
        existingSnapshot.docs.map(d => d.data().companyName?.toLowerCase())
      );
      
      const batchSize = 10;
      for (let i = 0; i < FULL_CONTACT_LIST.length; i += batchSize) {
        const batch = FULL_CONTACT_LIST.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (contact) => {
          try {
            if (existingCompanies.has(contact.companyName?.toLowerCase())) {
              skipped++;
              return;
            }
            
            await addDoc(collection(db, 'contacts'), {
              ...contact,
              notes: '',
              createdBy: currentUser.uid,
              createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
              createdAt: serverTimestamp()
            });
            imported++;
          } catch (e) {
            failed++;
            console.error(`Failed to import ${contact.companyName}:`, e);
          }
        }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setShowImport(false);
      loadContacts();
      alert(`✅ Import complete!\n\n✅ Imported: ${imported}\n⏭️ Skipped (already exist): ${skipped}\n❌ Failed: ${failed}\n\nTotal processed: ${FULL_CONTACT_LIST.length}`);
    } catch (e) {
      console.error('Error importing contacts:', e);
      alert('Import failed: ' + e.message);
    } finally {
      setImporting(false);
    }
  }

  async function mergeDuplicateGroup(group) {
    if (!group || !group.contacts || group.contacts.length < 2) return;
    if (!canMergeDuplicates) {
      alert('Only admins or sales managers can merge duplicates.');
      return;
    }

    const primary = group.contacts.find(c => c.id === group.primaryId) || group.contacts[0];
    const others = group.contacts.filter(c => c.id !== primary.id);
    
    if (others.length === 0) return;
    
    if (!window.confirm(`Merge ${others.length} duplicate contact(s) into "${primary.companyName || primary.contactName || 'Primary'}"?`)) {
      return;
    }

    setMergingGroupId(group.id);
    try {
      const { id: primaryId, ...primaryData } = primary;
      const merged = { ...primaryData };
      
      const fields = ['companyName', 'contactName', 'contactPosition', 'phone', 'email', 'category'];
      fields.forEach(field => {
        if (!normalizeText(merged[field])) {
          const candidate = others.find(contact => normalizeText(contact[field]));
          if (candidate) merged[field] = candidate[field];
        }
      });

      const notesParts = [];
      if (primary.notes) notesParts.push(primary.notes);
      others.forEach(contact => {
        if (contact.notes) {
          const label = contact.companyName || contact.contactName || 'Contact';
          notesParts.push(`Merged from ${label}: ${contact.notes}`);
        }
      });
      merged.notes = notesParts.filter(Boolean).join('\n\n');

      const mergedFromIds = others.map(contact => contact.id);
      const updatePayload = {
        ...merged,
        updatedAt: serverTimestamp(),
        mergedAt: serverTimestamp()
      };
      
      if (mergedFromIds.length > 0) {
        updatePayload.mergedFrom = arrayUnion(...mergedFromIds);
      }

      await updateDoc(doc(db, 'contacts', primaryId), updatePayload);

      const relatedDeals = [...activeDeals, ...closedDeals]
        .filter(deal => mergedFromIds.includes(deal.sourceContactId));
      
      await Promise.all(
        relatedDeals.map(deal =>
          updateDoc(doc(db, 'sales', deal.id), {
            sourceContactId: primaryId,
            updatedAt: serverTimestamp()
          })
        )
      );

      await Promise.all(others.map(contact => deleteDoc(doc(db, 'contacts', contact.id))));

      await loadContacts();
      await loadActiveDeals();
      await loadDealHistory();
      
      alert('Duplicates merged successfully!');
    } catch (error) {
      console.error('Error merging duplicates:', error);
      alert('Failed to merge duplicates: ' + error.message);
    } finally {
      setMergingGroupId(null);
    }
  }

  // Filter contacts based on permissions
  const visibleContacts = useMemo(() => {
    return contacts.filter(contact => canViewContact(contact));
  }, [contacts, userRole, teamContext, currentUser]);

  const filtered = useMemo(() => {
    return visibleContacts.filter(c => {
      const searchMatch = 
        c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase());
      
      const categoryMatch = categoryFilter === 'all' || c.category === categoryFilter;
      
      return searchMatch && categoryMatch;
    });
  }, [visibleContacts, search, categoryFilter]);

  const categoryCounts = useMemo(() => {
    return visibleContacts.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});
  }, [visibleContacts]);

  const missingContacts = useMemo(
    () => visibleContacts.filter(contact =>
      REQUIRED_CONTACT_FIELDS.some(field => !normalizeText(contact[field]))
    ),
    [visibleContacts]
  );

  const duplicateGroups = useMemo(() => {
    const buildGroups = (type, keyFn) => {
      const map = new Map();
      visibleContacts.forEach(contact => {
        const key = keyFn(contact);
        if (!key) return;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(contact);
      });
      
      return Array.from(map.entries())
        .filter(([, list]) => list.length > 1)
        .map(([key, list]) => {
          const sorted = [...list].sort((a, b) => {
            const scoreDiff = getContactQualityScore(b) - getContactQualityScore(a);
            if (scoreDiff !== 0) return scoreDiff;
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          });
          
          return {
            id: `${type}:${key}`,
            type,
            key,
            contacts: list,
            primaryId: sorted[0]?.id
          };
        });
    };

    const emailGroups = buildGroups('Email', contact => {
      const key = normalizeText(contact.email);
      return key && key.includes('@') ? key : null;
    });
    
    const phoneGroups = buildGroups('Phone', contact => {
      const key = normalizePhone(contact.phone);
      return key && key.length >= 7 ? key : null;
    });
    
    const companyGroups = buildGroups('Company', contact => {
      const key = normalizeText(contact.companyName);
      return key && key.length >= 3 ? key : null;
    });

    return [...emailGroups, ...phoneGroups, ...companyGroups];
  }, [visibleContacts]);

  const availableContacts = useMemo(
    () => filtered.filter(c => !isContactInProgress(c)),
    [filtered, activeDeals, globalActiveDeals]
  );

  const inProgressContacts = useMemo(
    () => filtered.filter(c => isContactInProgress(c)),
    [filtered, activeDeals, globalActiveDeals]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            Contact Directory
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 ml-0 sm:ml-15">
            {userRole === 'sales_member' && 'View and manage your contacts'}
            {userRole === 'team_leader' && 'Manage your team\'s contacts and opportunities'}
            {(userRole === 'admin' || userRole === 'sales_manager') && 'Manage all business contacts and convert them to sales opportunities'}
          </p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          {canImport && (
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 hover:scale-105 text-sm sm:text-base"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
              <span>Import</span>
            </button>
          )}
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 hover:scale-105 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard title="Total Contacts" value={visibleContacts.length} icon={Users} color="purple" />
        <StatCard title="Available" value={availableContacts.length} icon={CheckCircle2} color="green" />
        <StatCard title="In Progress" value={inProgressContacts.length} icon={Clock} color="yellow" />
        <StatCard title="Categories" value={Object.keys(categoryCounts).length} icon={Building2} color="blue" />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="relative sm:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer text-sm sm:text-base"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat} {categoryCounts[cat] ? `(${categoryCounts[cat]})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DATA QUALITY (Only for admins and sales managers) */}
      {!loading && canMergeDuplicates && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Data Quality Center
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Catch duplicates, missing required fields, and auto-merge suggestions.
              </p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => { setQualityTab('duplicates'); setShowQualityModal(true); }}
                className="px-3 sm:px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 font-semibold text-xs sm:text-sm transition-all"
              >
                Review Duplicates
              </button>
              <button
                onClick={() => { setQualityTab('missing'); setShowQualityModal(true); }}
                className="px-3 sm:px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs sm:text-sm transition-all"
              >
                Missing Fields
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-700 uppercase">Duplicate Groups</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-2">{duplicateGroups.length}</p>
              <p className="text-xs text-purple-600 mt-1">Based on email, phone, and company</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase">Missing Required</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-2">{missingContacts.length}</p>
              <p className="text-xs text-blue-600 mt-1">Company, contact, or phone</p>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 uppercase">Auto-Merge Ready</p>
              <p className="text-xl sm:text-2xl font-bold text-green-700 mt-2">
                {duplicateGroups.filter(group => group.contacts.length > 1).length}
              </p>
              <p className="text-xs text-green-600 mt-1">Suggested primary contacts available</p>
            </div>
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium text-sm sm:text-base">Loading contacts...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No contacts found</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {search || categoryFilter !== 'all' 
              ? 'Try adjusting your filters or search terms' 
              : 'Get started by adding contacts or importing your contact list'}
          </p>
          
          {!search && categoryFilter === 'all' && (
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 text-sm sm:text-base"
              >
                Add First Contact
              </button>
              
              {canImport && (
                <button
                  onClick={() => setShowImport(true)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 text-sm sm:text-base"
                >
                  Import Contacts
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* AVAILABLE CONTACTS */}
      {!loading && availableContacts.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            Available Contacts ({availableContacts.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                dealHistory={getDealHistory(contact)}
                onEdit={() => setEditContact(contact)}
                onDelete={() => deleteContact(contact.id)}
                onStartWorking={() => startWorkingOnContact(contact)}
                onView360={() => navigate(`/sales/account/${contact.id}`)}
                userRole={userRole}
                canDelete={canDeleteContacts}
                canWork={canWorkOnContact(contact)}
                canView360={canView360(contact)}
                isAvailable={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* IN PROGRESS CONTACTS */}
      {!loading && inProgressContacts.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            Currently Being Worked On ({inProgressContacts.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                dealHistory={getDealHistory(contact)}
                onEdit={() => setEditContact(contact)}
                onDelete={() => deleteContact(contact.id)}
                onStartWorking={() => startWorkingOnContact(contact)}
                onView360={() => navigate(`/sales/account/${contact.id}`)}
                userRole={userRole}
                canDelete={canDeleteContacts}
                canWork={false}
                canView360={canView360(contact)}
                isAvailable={false}
                workingUser={getWorkingUser(contact)}
              />
            ))}
          </div>
        </div>
      )}

      {/* MODALS - Add Form, Edit, Import, Quality Center */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add New Contact">
          <form onSubmit={createContact} className="space-y-4">
            <InputField 
              label="Company Name" 
              icon={Building2} 
              required 
              value={form.companyName} 
              onChange={e => setForm({ ...form, companyName: e.target.value })} 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField 
                label="Contact Person" 
                icon={User} 
                required 
                value={form.contactName} 
                onChange={e => setForm({ ...form, contactName: e.target.value })} 
              />
              <InputField 
                label="Position" 
                icon={Briefcase} 
                value={form.contactPosition} 
                onChange={e => setForm({ ...form, contactPosition: e.target.value })} 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField 
                label="Phone Number" 
                icon={Phone} 
                required 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
              />
              <InputField 
                label="Email" 
                icon={Mail} 
                type="email"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
              />
            </div>
            
            <SelectField 
              label="Category" 
              value={form.category} 
              onChange={e => setForm({ ...form, category: e.target.value })} 
              options={CATEGORIES.map(cat => ({ value: cat, label: cat }))} 
            />
            
            <TextAreaField 
              label="Notes" 
              icon={FileText} 
              value={form.notes} 
              onChange={e => setForm({ ...form, notes: e.target.value })} 
            />
            
            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 text-sm sm:text-base"
              >
                Create Contact
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Contact Modal */}
      {editContact && (
        <Modal onClose={() => setEditContact(null)} title="Edit Contact">
          <div className="space-y-4">
            {isContactInProgress(editContact) && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Protected Fields</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Phone number and email cannot be changed while an active deal exists for this contact.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <InputField 
              label="Company Name" 
              icon={Building2} 
              value={editContact.companyName} 
              onChange={e => setEditContact({ ...editContact, companyName: e.target.value })} 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField 
                label="Contact Person" 
                icon={User} 
                value={editContact.contactName} 
                onChange={e => setEditContact({ ...editContact, contactName: e.target.value })} 
              />
              <InputField 
                label="Position" 
                icon={Briefcase} 
                value={editContact.contactPosition} 
                onChange={e => setEditContact({ ...editContact, contactPosition: e.target.value })} 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <InputField 
                  label="Phone Number" 
                  icon={Phone} 
                  value={editContact.phone} 
                  onChange={e => setEditContact({ ...editContact, phone: e.target.value })}
                  disabled={isContactInProgress(editContact)}
                />
                {isContactInProgress(editContact) && (
                  <p className="text-xs text-yellow-600 mt-1 ml-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Protected during active deal
                  </p>
                )}
              </div>
              
              <div>
                <InputField 
                  label="Email" 
                  icon={Mail} 
                  type="email"
                  value={editContact.email} 
                  onChange={e => setEditContact({ ...editContact, email: e.target.value })}
                  disabled={isContactInProgress(editContact)}
                />
                {isContactInProgress(editContact) && (
                  <p className="text-xs text-yellow-600 mt-1 ml-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Protected during active deal
                  </p>
                )}
              </div>
            </div>
            
            <SelectField 
              label="Category" 
              value={editContact.category} 
              onChange={e => setEditContact({ ...editContact, category: e.target.value })} 
              options={CATEGORIES.map(cat => ({ value: cat, label: cat }))} 
            />
            
            <TextAreaField 
              label="Notes" 
              icon={FileText} 
              value={editContact.notes || ''} 
              onChange={e => setEditContact({ ...editContact, notes: e.target.value })} 
            />
            
            <div className="flex gap-3 pt-4">
              <button 
                onClick={saveEdit} 
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 text-sm sm:text-base"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setEditContact(null)} 
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal onClose={() => setShowImport(false)} title="Import All Contacts">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">📋 Import Complete Contact List</p>
              <p className="text-sm text-blue-700 mb-3">
                This will import all {FULL_CONTACT_LIST.length} contacts from your spreadsheet. 
                Contacts that already exist will be skipped to avoid duplicates.
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• {FULL_CONTACT_LIST.length} total contacts to process</li>
                <li>• Duplicate contacts will be automatically skipped</li>
                <li>• Import will take approximately 1-2 minutes</li>
                <li>• All categories and contact information included</li>
              </ul>
            </div>
            
            {importing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Import in progress...</p>
                  <p className="text-sm text-yellow-700">Please wait, this may take a few moments.</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <button 
                onClick={importAllContacts} 
                disabled={importing}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {importing ? 'Importing...' : `Import ${FULL_CONTACT_LIST.length} Contacts`}
              </button>
              <button 
                onClick={() => setShowImport(false)} 
                disabled={importing}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quality Modal */}
      {showQualityModal && (
        <Modal onClose={() => setShowQualityModal(false)} title="Data Quality Center">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setQualityTab('duplicates')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                qualityTab === 'duplicates'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            >
              Duplicates
            </button>
            <button
              onClick={() => setQualityTab('missing')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                qualityTab === 'missing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Missing Fields
            </button>
          </div>
          
          {qualityTab === 'duplicates' ? (
            <div className="space-y-4">
              {duplicateGroups.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No duplicate groups detected</p>
                </div>
              ) : (
                duplicateGroups.map(group => (
                  <div key={group.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{group.type} match</p>
                        <p className="text-xs text-gray-500">{group.key}</p>
                      </div>
                      <button
                        onClick={() => mergeDuplicateGroup(group)}
                        disabled={!canMergeDuplicates || mergingGroupId === group.id}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          !canMergeDuplicates
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : mergingGroupId === group.id
                              ? 'bg-purple-200 text-purple-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {mergingGroupId === group.id ? 'Merging...' : 'Merge Suggested'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.contacts.map(contact => (
                        <div
                          key={contact.id}
                          className={`border rounded-lg p-3 ${
                            contact.id === group.primaryId ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {contact.companyName || contact.contactName || 'Unnamed Contact'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {contact.contactName || 'No contact'} • {contact.phone || 'No phone'}
                              </p>
                              {contact.email && (
                                <p className="text-xs text-gray-500 mt-1">{contact.email}</p>
                              )}
                            </div>
                            {contact.id === group.primaryId && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {missingContacts.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">All contacts have required fields</p>
                </div>
              ) : (
                missingContacts.map(contact => {
                  const missing = REQUIRED_CONTACT_FIELDS.filter(field => !normalizeText(contact[field]));
                  return (
                    <div key={contact.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {contact.companyName || contact.contactName || 'Unnamed Contact'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Missing: {missing.map(field => field.replace(/([A-Z])/g, ' $1')).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowQualityModal(false);
                          setEditContact(contact);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                      >
                        Fix Now
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// Component definitions for StatCard, ContactCard, Modal, InputField, SelectField, TextAreaField
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ContactCard({ contact, dealHistory, onEdit, onDelete, onStartWorking, onView360, userRole, canDelete, canWork, canView360, isAvailable, workingUser }) {
  const hasClosedDeals = dealHistory.filter(d => d.status === 'closed').length > 0;
  const hasLostDeals = dealHistory.filter(d => d.status === 'lost').length > 0;
  const totalDeals = dealHistory.length;
  
  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${isAvailable ? 'border-gray-200' : 'border-yellow-300 bg-yellow-50/30'} p-4 sm:p-6 hover:shadow-lg transition-all`}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${isAvailable ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-gradient-to-br from-yellow-100 to-orange-100'} flex items-center justify-center flex-shrink-0`}>
            {isAvailable ? (
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            ) : (
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{contact.companyName}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="inline-block px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                {contact.category}
              </span>
              {!isAvailable && (
                <span className="inline-block px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  In Progress
                </span>
              )}
            </div>
          </div>
        </div>

        {/* DEAL HISTORY BADGES */}
        {totalDeals > 0 && (
          <div className="flex flex-wrap gap-2">
            {hasClosedDeals && (
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  {dealHistory.filter(d => d.status === 'closed').length} Won
                </span>
              </div>
            )}
            {hasLostDeals && (
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-semibold text-red-700">
                  {dealHistory.filter(d => d.status === 'lost').length} Lost
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <History className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">
                {totalDeals} Total Deal{totalDeals !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {!isAvailable && workingUser && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 font-semibold flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Being worked on by: {workingUser}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              This contact is locked until the deal is closed or lost
            </p>
          </div>
        )}

        <div className="space-y-2 text-xs sm:text-sm">
          {contact.contactName && (
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{contact.contactName}</span>
              {contact.contactPosition && (
                <span className="text-gray-500">• {contact.contactPosition}</span>
              )}
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{contact.phone}</span>
            </div>
          )}
          
          {contact.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
        </div>

        {contact.notes && (
          <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
            💬 {contact.notes}
          </p>
        )}

        <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2">
          {canWork ? (
            <button 
              onClick={onStartWorking} 
              className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md text-xs sm:text-sm"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Working</span>
            </button>
          ) : (
            <button 
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed text-xs sm:text-sm"
            >
              <Lock className="w-4 h-4" />
              <span>Locked</span>
            </button>
          )}
          
          {canView360 ? (
            <button
              onClick={onView360}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium transition-all text-xs sm:text-sm"
            >
              <TrendingUp className="w-4 h-4" />
              <span>360</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed text-xs sm:text-sm"
              title="You don't have permission to view this account's 360 view"
            >
              <EyeOff className="w-4 h-4" />
              <span>360</span>
            </button>
          )}
          
          <button 
            onClick={onEdit} 
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-all text-xs sm:text-sm"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          {canDelete && (
            <button 
              onClick={onDelete} 
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all text-xs sm:text-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {contact.createdByName && (
          <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Added by {contact.createdByName}
          </p>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
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

function InputField({ label, icon: Icon, required, value, onChange, type = "text", placeholder, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-2" />}
        {label} {required && '*'}
      </label>
      <input
        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        required={required}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer text-sm sm:text-base"
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

function TextAreaField({ label, icon: Icon, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-2" />}
        {label}
      </label>
      <textarea
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
        placeholder={`Add ${label.toLowerCase()}...`}
        rows={rows}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
