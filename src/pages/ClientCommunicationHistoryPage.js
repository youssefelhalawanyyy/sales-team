import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  User,
  Search,
  Plus,
  Clock,
  MapPin,
  FileText,
  Paperclip,
  Heart,
  Send,
  Filter,
  ChevronDown,
  ChevronUp,
  Bell
} from 'lucide-react';

export default function ClientCommunicationHistoryPage() {
  const { currentUser, userRole } = useAuth();
  const [clients, setClients] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedClient, setExpandedClient] = useState(null);

  const communicationTypes = [
    { value: 'all', label: 'All', icon: MessageSquare, color: 'from-gray-50 to-gray-100 border-gray-300' },
    { value: 'visit', label: 'Visit', icon: MapPin, color: 'from-blue-50 to-blue-100 border-blue-300' },
    { value: 'followup', label: 'Follow-up', icon: Bell, color: 'from-purple-50 to-purple-100 border-purple-300' }
  ];

  useEffect(() => {
    loadClientsAndCommunications();
  }, [currentUser, userRole]);

  async function loadClientsAndCommunications() {
    try {
      setLoading(true);

      // Get all deals to build client list
      let dealsQuery;
      if (userRole === 'admin' || userRole === 'sales_manager') {
        dealsQuery = collection(db, 'sales');
      } else {
        dealsQuery = query(
          collection(db, 'sales'),
          where('createdBy', '==', currentUser.uid)
        );
      }

      const dealsSnap = await getDocs(dealsQuery);
      const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Get unique clients from deals
      const uniqueClients = {};
      deals.forEach(deal => {
        const clientName = deal.clientName || deal.businessName || deal.companyName || 'Unknown';
        if (!uniqueClients[clientName]) {
          uniqueClients[clientName] = {
            name: clientName,
            email: deal.email || deal.clientEmail,
            phone: deal.phone || deal.clientPhone,
            company: deal.company || deal.companyName,
            dealCount: 0,
            dealIds: []
          };
        }
        uniqueClients[clientName].dealCount += 1;
        uniqueClients[clientName].dealIds.push(deal.id);
      });

      setClients(Object.values(uniqueClients));

      // Get visits
      let visitsQuery;
      if (userRole === 'admin' || userRole === 'sales_manager') {
        visitsQuery = collection(db, 'visits');
      } else {
        visitsQuery = query(
          collection(db, 'visits'),
          where('createdBy', '==', currentUser.uid)
        );
      }

      const visitsSnap = await getDocs(visitsQuery);
      const visits = visitsSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        type: 'visit',
        communicationType: 'Visit'
      }));

      // Get follow-ups
      let followupsQuery;
      if (userRole === 'admin' || userRole === 'sales_manager') {
        followupsQuery = collection(db, 'followups');
      } else {
        followupsQuery = query(
          collection(db, 'followups'),
          where('createdBy', '==', currentUser.uid)
        );
      }

      const followupsSnap = await getDocs(followupsQuery);
      const followups = followupsSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        type: 'followup',
        communicationType: 'Follow-up'
      }));

      // Combine all communications
      const allCommunications = [...visits, ...followups];
      
      // Sort by date descending
      allCommunications.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || a.date?.toDate?.() || new Date(a.date || a.visitDate);
        const dateB = b.createdAt?.toDate?.() || b.date?.toDate?.() || new Date(b.date || b.visitDate);
        return dateB - dateA;
      });

      setCommunications(allCommunications);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const getClientCommunications = (client) => {
    return communications.filter(com => {
      // Match by client name
      const comClientName = com.clientName || com.businessName || com.companyName || '';
      const nameMatch = comClientName.toLowerCase() === client.name.toLowerCase();
      
      // Match by deal ID if available
      const dealMatch = client.dealIds && com.dealId && client.dealIds.includes(com.dealId);
      
      // Apply type filter
      const typeMatch = filterType === 'all' || com.type === filterType;
      
      return (nameMatch || dealMatch) && typeMatch;
    });
  };

  const getTypeIcon = (type) => {
    if (type === 'visit') return MapPin;
    if (type === 'followup') return Bell;
    return MessageSquare;
  };

  const getTypeColor = (type) => {
    if (type === 'visit') return 'from-blue-50 to-blue-100 border-blue-300';
    if (type === 'followup') return 'from-purple-50 to-purple-100 border-purple-300';
    return 'from-gray-50 to-gray-100 border-gray-300';
  };

  const formatDate = (communication) => {
    // Try to get date from various fields
    const dateObj = communication.createdAt?.toDate?.() || 
                    communication.date?.toDate?.() || 
                    new Date(communication.date || communication.visitDate || communication.followupDate);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) return 'Today';
    if (dateObj.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return dateObj.toLocaleDateString('default', { 
      month: 'short', 
      day: 'numeric', 
      year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    });
  };

  const formatTime = (communication) => {
    if (communication.time) return communication.time;
    
    const dateObj = communication.createdAt?.toDate?.() || 
                    communication.date?.toDate?.() || 
                    new Date(communication.date || communication.visitDate || communication.followupDate);
    
    return dateObj.toLocaleTimeString('default', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSubject = (communication) => {
    if (communication.type === 'visit') {
      return communication.purpose || communication.notes || 'Site Visit';
    }
    if (communication.type === 'followup') {
      return communication.description || communication.notes || 'Follow-up Call';
    }
    return 'Communication';
  };

  const getNotes = (communication) => {
    return communication.notes || communication.description || communication.outcome || '';
  };

  const getOutcome = (communication) => {
    if (communication.status) return communication.status;
    if (communication.outcome) return communication.outcome;
    if (communication.type === 'visit') return 'completed';
    if (communication.type === 'followup') return 'scheduled';
    return 'pending';
  };

  // Calculate stats
  const totalCommunications = communications.length;
  const totalVisits = communications.filter(c => c.type === 'visit').length;
  const totalFollowups = communications.filter(c => c.type === 'followup').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl">
              <MessageSquare className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Communication History</h1>
              <p className="text-gray-500">Track all visits and follow-ups with clients</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">Total Communications</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{totalCommunications}</p>
              </div>
              <MessageSquare className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700">Total Follow-ups</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{totalFollowups}</p>
              </div>
              <Bell className="text-purple-500" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border-2 border-cyan-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-700">Total Visits</p>
                <p className="text-3xl font-bold text-cyan-900 mt-1">{totalVisits}</p>
              </div>
              <MapPin className="text-cyan-500" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {communicationTypes.map(type => {
              const TypeIcon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    filterType === type.value ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TypeIcon size={16} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clients Communication History */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading communication history...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No clients found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredClients.map(client => {
            const clientComms = getClientCommunications(client);
            const isExpanded = expandedClient === client.name;
            const visitCount = clientComms.filter(c => c.type === 'visit').length;
            const followupCount = clientComms.filter(c => c.type === 'followup').length;

            return (
              <div key={client.name} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all">
                {/* Client Header */}
                <button
                  onClick={() => setExpandedClient(isExpanded ? null : client.name)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 text-left">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="text-cyan-600" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{client.name}</h3>
                      <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 text-sm text-gray-600 mt-1 flex-wrap">
                        {client.email && (
                          <a 
                            href={`mailto:${client.email}`} 
                            className="hover:text-cyan-600 flex items-center gap-1 truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail size={14} />
                            {client.email}
                          </a>
                        )}
                        {client.phone && (
                          <a 
                            href={`tel:${client.phone}`} 
                            className="hover:text-cyan-600 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone size={14} />
                            {client.phone}
                          </a>
                        )}
                        {client.company && (
                          <span className="flex items-center gap-1 truncate">
                            <FileText size={14} />
                            {client.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{clientComms.length}</p>
                      <p className="text-xs text-gray-500">
                        {visitCount} visits · {followupCount} follow-ups
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </button>

                {/* Communications List */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
                    {clientComms.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No communications logged yet</p>
                    ) : (
                      clientComms.map(com => {
                        const TypeIcon = getTypeIcon(com.type);
                        const subject = getSubject(com);
                        const notes = getNotes(com);
                        const outcome = getOutcome(com);

                        return (
                          <div key={com.id} className={`bg-gradient-to-r ${getTypeColor(com.type)} rounded-xl border-2 p-4`}>
                            <div className="flex items-start gap-3 mb-3">
                              <TypeIcon size={20} className="mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1 gap-2">
                                  <p className="font-bold text-gray-900 flex-1">{subject}</p>
                                  <span className="text-xs font-semibold bg-white/70 px-2 py-1 rounded whitespace-nowrap">
                                    {com.communicationType || com.type}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Clock size={14} />
                                  {formatDate(com)} at {formatTime(com)}
                                </p>
                              </div>
                            </div>

                            {notes && (
                              <p className="text-sm text-gray-700 mb-2 p-2 bg-white/50 rounded">{notes}</p>
                            )}

                            {com.location && (
                              <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                                <MapPin size={14} />
                                {com.location}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                outcome === 'completed' || outcome === 'done' ? 'bg-green-200 text-green-800' :
                                outcome === 'scheduled' || outcome === 'pending' ? 'bg-blue-200 text-blue-800' :
                                outcome === 'cancelled' ? 'bg-red-200 text-red-800' :
                                outcome === 'postponed' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {outcome}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}