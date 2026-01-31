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
  ChevronUp
} from 'lucide-react';

export default function ClientCommunicationHistoryPage() {
  const { currentUser, userRole } = useAuth();
  const [clients, setClients] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [expandedClient, setExpandedClient] = useState(null);

  const [form, setForm] = useState({
    type: 'call',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    subject: '',
    notes: '',
    outcome: 'pending'
  });

  const communicationTypes = [
    { value: 'call', label: 'Phone Call', icon: Phone, color: 'from-blue-50 to-blue-100 border-blue-300' },
    { value: 'email', label: 'Email', icon: Mail, color: 'from-purple-50 to-purple-100 border-purple-300' },
    { value: 'meeting', label: 'In-Person Meeting', icon: Calendar, color: 'from-green-50 to-green-100 border-green-300' },
    { value: 'message', label: 'Message', icon: MessageSquare, color: 'from-yellow-50 to-yellow-100 border-yellow-300' },
    { value: 'note', label: 'Internal Note', icon: FileText, color: 'from-gray-50 to-gray-100 border-gray-300' }
  ];

  useEffect(() => {
    loadClientsAndCommunications();
  }, [currentUser, userRole]);

  async function loadClientsAndCommunications() {
    try {
      setLoading(true);

      // Get all deals to build client list
      let dealsQuery;
      if (userRole === 'admin') {
        dealsQuery = query(collection(db, 'sales'), where('archived', '==', false));
      } else {
        dealsQuery = query(
          collection(db, 'sales'),
          where('createdBy', '==', currentUser.uid),
          where('archived', '==', false)
        );
      }

      const dealsSnap = await getDocs(dealsQuery);
      const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Get unique clients
      const uniqueClients = {};
      deals.forEach(deal => {
        const clientName = deal.clientName || deal.businessName || 'Unknown';
        if (!uniqueClients[clientName]) {
          uniqueClients[clientName] = {
            name: clientName,
            email: deal.email,
            phone: deal.phone,
            company: deal.company || deal.companyName,
            dealCount: 0
          };
        }
        uniqueClients[clientName].dealCount += 1;
      });

      setClients(Object.values(uniqueClients));

      // Get communications
      let comQuery;
      if (userRole === 'admin') {
        comQuery = query(collection(db, 'communications'));
      } else {
        comQuery = query(
          collection(db, 'communications'),
          where('createdBy', '==', currentUser.uid)
        );
      }

      const comSnap = await getDocs(comQuery);
      const comData = comSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by date descending
      comData.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(a.date);
        const dateB = b.timestamp?.toDate?.() || new Date(b.date);
        return dateB - dateA;
      });

      setCommunications(comData);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCommunication() {
    if (!selectedClient || !form.subject) {
      alert('Please select a client and enter a subject');
      return;
    }

    try {
      const dateTime = new Date(`${form.date}T${form.time}`);
      
      await addDoc(collection(db, 'communications'), {
        clientName: selectedClient.name,
        clientEmail: selectedClient.email,
        clientPhone: selectedClient.phone,
        type: form.type,
        subject: form.subject,
        notes: form.notes,
        outcome: form.outcome,
        date: form.date,
        time: form.time,
        timestamp: serverTimestamp(),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });

      setForm({
        type: 'call',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        subject: '',
        notes: '',
        outcome: 'pending'
      });
      setShowForm(false);
      loadClientsAndCommunications();
      alert('Communication logged!');
    } catch (e) {
      console.error('Error adding communication:', e);
      alert('Failed to log communication');
    }
  }

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getClientCommunications = (clientName) => {
    return communications.filter(c => c.clientName === clientName && (filterType === 'all' || c.type === filterType));
  };

  const getTypeIcon = (type) => {
    return communicationTypes.find(t => t.value === type)?.icon || MessageSquare;
  };

  const getTypeColor = (type) => {
    return communicationTypes.find(t => t.value === type)?.color || 'from-gray-50 to-gray-100 border-gray-300';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl">
              <MessageSquare className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Communication History</h1>
              <p className="text-gray-500">Track all interactions with clients</p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Log Communication
          </button>
        </div>
      </div>

      {/* Add Communication Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Log Communication</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
              <select
                value={selectedClient?.name || ''}
                onChange={(e) => {
                  const client = clients.find(c => c.name === e.target.value);
                  setSelectedClient(client);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.name} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Communication Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {communicationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="What was discussed?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional details..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Outcome</label>
              <select
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="pending">Pending Action</option>
                <option value="interested">Interested</option>
                <option value="not-interested">Not Interested</option>
                <option value="followup-scheduled">Follow-up Scheduled</option>
                <option value="deal-advanced">Deal Advanced</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddCommunication}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
            >
              Log Communication
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                filterType === 'all' ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {communicationTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  filterType === type.value ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {React.createElement(type.icon, { size: 16 })}
                {type.label}
              </button>
            ))}
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
          </div>
        ) : (
          filteredClients.map(client => {
            const clientComms = getClientCommunications(client.name);
            const isExpanded = expandedClient === client.name;

            return (
              <div key={client.name} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all">
                {/* Client Header */}
                <button
                  onClick={() => setExpandedClient(isExpanded ? null : client.name)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 text-left">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                      <User className="text-cyan-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                      <div className="flex flex-col lg:flex-row gap-3 text-sm text-gray-600 mt-1">
                        {client.email && (
                          <a href={`mailto:${client.email}`} className="hover:text-cyan-600 flex items-center gap-1">
                            📧 {client.email}
                          </a>
                        )}
                        {client.phone && (
                          <a href={`tel:${client.phone}`} className="hover:text-cyan-600 flex items-center gap-1">
                            📞 {client.phone}
                          </a>
                        )}
                        {client.company && (
                          <span className="flex items-center gap-1">
                            🏢 {client.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{clientComms.length}</p>
                      <p className="text-xs text-gray-500">communications</p>
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
                        return (
                          <div key={com.id} className={`bg-gradient-to-r ${getTypeColor(com.type)} rounded-xl border-2 p-4`}>
                            <div className="flex items-start gap-3 mb-3">
                              <TypeIcon size={20} className="mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-bold text-gray-900">{com.subject}</p>
                                  <span className="text-xs font-semibold bg-white/70 px-2 py-1 rounded">
                                    {com.type}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Clock size={14} />
                                  {formatDate(com.date)} at {com.time}
                                </p>
                              </div>
                            </div>

                            {com.notes && (
                              <p className="text-sm text-gray-700 mb-2 p-2 bg-white/50 rounded">{com.notes}</p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                com.outcome === 'deal-advanced' ? 'bg-green-200 text-green-800' :
                                com.outcome === 'interested' ? 'bg-blue-200 text-blue-800' :
                                com.outcome === 'not-interested' ? 'bg-red-200 text-red-800' :
                                com.outcome === 'followup-scheduled' ? 'bg-purple-200 text-purple-800' :
                                com.outcome === 'postponed' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {com.outcome}
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
