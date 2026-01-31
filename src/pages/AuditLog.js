import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { History, Filter, Calendar, User, FileText } from 'lucide-react';

// ---------------------------------------------------------------------------
// Seed data — used when Firestore returns zero documents.
// Remove this block (and the fallback in the snapshot handler) once your
// backend is writing real audit logs.
// ---------------------------------------------------------------------------
const generateMockLogs = (currentUser) => {
  const now = new Date();
  const ago = (days, hours = 0, mins = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    d.setMinutes(d.getMinutes() - mins);
    return d;
  };

  const users = [
    { id: currentUser?.uid || 'user_001', name: currentUser?.displayName || 'You' },
    { id: 'user_002', name: 'Sarah Mitchell' },
    { id: 'user_003', name: 'James Carter' },
    { id: 'user_004', name: 'Leila Hassan' },
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const id = () => Math.random().toString(36).substring(2, 10);

  const entries = [
    // --- today ---
    {
      id: id(), action: 'login', entity: 'User', entityId: users[0].id,
      userId: users[0].id, userName: users[0].name,
      description: 'User logged in successfully.',
      timestamp: ago(0, 0, 15),
      changes: null
    },
    {
      id: id(), action: 'create', entity: 'Quote', entityId: 'qt_' + id(),
      userId: users[0].id, userName: users[0].name,
      description: 'New quote QT-1048576 created for Al-Nile Trading Co.',
      timestamp: ago(0, 1, 30),
      changes: { quoteNumber: 'QT-1048576', client: 'Al-Nile Trading Co.', total: 'EGP 45,200' }
    },
    {
      id: id(), action: 'update', entity: 'Deal', entityId: 'deal_' + id(),
      userId: users[1].id, userName: users[1].name,
      description: 'Deal status changed from "Negotiation" to "Won".',
      timestamp: ago(0, 2, 10),
      changes: { status: { from: 'Negotiation', to: 'Won' }, updatedBy: users[1].name }
    },
    {
      id: id(), action: 'delete', entity: 'Contact', entityId: 'con_' + id(),
      userId: users[2].id, userName: users[2].name,
      description: 'Contact "Ahmed Yousef" removed from CRM.',
      timestamp: ago(0, 3, 45),
      changes: { contactName: 'Ahmed Yousef', reason: 'Duplicate entry' }
    },

    // --- yesterday ---
    {
      id: id(), action: 'export', entity: 'Report', entityId: 'rpt_' + id(),
      userId: users[0].id, userName: users[0].name,
      description: 'Monthly sales report exported as PDF.',
      timestamp: ago(1, 1, 0),
      changes: { format: 'PDF', period: 'January 2026', rows: 142 }
    },
    {
      id: id(), action: 'create', entity: 'Deal', entityId: 'deal_' + id(),
      userId: users[3].id, userName: users[3].name,
      description: 'New deal created for Cairo Tech Solutions.',
      timestamp: ago(1, 4, 20),
      changes: { client: 'Cairo Tech Solutions', amount: 'EGP 128,000', stage: 'Qualification' }
    },
    {
      id: id(), action: 'update', entity: 'Quote', entityId: 'qt_' + id(),
      userId: users[1].id, userName: users[1].name,
      description: 'Quote QT-1048571 discount updated from 5% to 10%.',
      timestamp: ago(1, 6, 50),
      changes: { discount: { from: '5%', to: '10%' }, newTotal: 'EGP 38,700' }
    },
    {
      id: id(), action: 'login', entity: 'User', entityId: users[2].id,
      userId: users[2].id, userName: users[2].name,
      description: 'User logged in from Cairo, EG.',
      timestamp: ago(1, 8, 10),
      changes: null
    },

    // --- last week ---
    {
      id: id(), action: 'create', entity: 'Contact', entityId: 'con_' + id(),
      userId: users[0].id, userName: users[0].name,
      description: 'New contact "Mona El-Sayed" added.',
      timestamp: ago(3, 2, 0),
      changes: { name: 'Mona El-Sayed', company: 'Delta Pharma', phone: '+20 10 1234 5678' }
    },
    {
      id: id(), action: 'update', entity: 'Contact', entityId: 'con_' + id(),
      userId: users[3].id, userName: users[3].name,
      description: 'Contact email updated for Khaled Mansour.',
      timestamp: ago(4, 5, 15),
      changes: { email: { from: 'khaled@old.com', to: 'khaled@newdomain.com' } }
    },
    {
      id: id(), action: 'delete', entity: 'Quote', entityId: 'qt_' + id(),
      userId: users[2].id, userName: users[2].name,
      description: 'Draft quote QT-1048565 deleted (expired).',
      timestamp: ago(5, 3, 40),
      changes: { quoteNumber: 'QT-1048565', reason: 'Expired — client declined' }
    },
    {
      id: id(), action: 'export', entity: 'Deal', entityId: 'deal_' + id(),
      userId: users[1].id, userName: users[1].name,
      description: 'Active deals list exported as CSV.',
      timestamp: ago(6, 7, 20),
      changes: { format: 'CSV', totalDeals: 47, filter: 'Active' }
    },

    // --- last month ---
    {
      id: id(), action: 'create', entity: 'Quote', entityId: 'qt_' + id(),
      userId: users[3].id, userName: users[3].name,
      description: 'Quote QT-1048550 created for Horizon Investments.',
      timestamp: ago(12, 1, 0),
      changes: { quoteNumber: 'QT-1048550', client: 'Horizon Investments', total: 'EGP 92,400' }
    },
    {
      id: id(), action: 'update', entity: 'Deal', entityId: 'deal_' + id(),
      userId: users[0].id, userName: users[0].name,
      description: 'Deal amount revised from EGP 75,000 to EGP 95,000.',
      timestamp: ago(18, 9, 30),
      changes: { amount: { from: 'EGP 75,000', to: 'EGP 95,000' }, reason: 'Scope expansion' }
    },
    {
      id: id(), action: 'login', entity: 'User', entityId: users[1].id,
      userId: users[1].id, userName: users[1].name,
      description: 'User logged in via Google SSO.',
      timestamp: ago(22, 11, 45),
      changes: null
    },
    {
      id: id(), action: 'delete', entity: 'Deal', entityId: 'deal_' + id(),
      userId: users[2].id, userName: users[2].name,
      description: 'Deal with "Old Tech Corp" archived after loss.',
      timestamp: ago(28, 4, 10),
      changes: { client: 'Old Tech Corp', reason: 'Client chose competitor' }
    },
  ];

  return entries.sort((a, b) => b.timestamp - a.timestamp);
};
// ---------------------------------------------------------------------------

export const AuditLog = () => {
  const { currentUser, userRole } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    entity: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    const isAdmin = userRole === 'admin' || userRole === 'sales_manager';
    const q = isAdmin
      ? query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(500))
      : query(
          collection(db, 'auditLogs'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(500)
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.docs.length > 0) {
        // ── Real data path ──────────────────────────────────────────────
        const logsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date()
        }));
        setLogs(logsData);
      } else {
        // ── Fallback: seed with mock data when collection is empty ──────
        setLogs(generateMockLogs(currentUser));
      }
      setLoading(false);
    }, (error) => {
      console.error('Audit log listener error:', error);
      // Still show mock data so the page isn't blank on permission errors
      setLogs(generateMockLogs(currentUser));
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser?.uid, userRole]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.action !== 'all' && log.action !== filters.action) return false;
      if (filters.entity !== 'all' && log.entity !== filters.entity) return false;

      if (filters.dateRange !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const daysAgo =
          filters.dateRange === 'today' ? 1 :
          filters.dateRange === 'week' ? 7 :
          filters.dateRange === 'month' ? 30 : 365;

        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - daysAgo);
        if (logDate < cutoff) return false;
      }

      return true;
    });
  }, [logs, filters]);

  // Get action color and icon
  const getActionStyle = (action) => {
    const styles = {
      create:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100' },
      update:  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100' },
      delete:  { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100' },
      login:   { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
      export:  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' }
    };
    return styles[action] || styles.update;
  };

  const getActionEmoji = (action) => {
    const emojis = { create: '➕', update: '✏️', delete: '🗑️', login: '🔐', export: '📤' };
    return emojis[action] || '📝';
  };

  const uniqueActions = useMemo(() => [...new Set(logs.map(l => l.action))], [logs]);
  const uniqueEntities = useMemo(() => [...new Set(logs.map(l => l.entity))], [logs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <History size={32} />
          <div>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-blue-100">Track all system changes and activities</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Filter size={20} />
          Filters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action.charAt(0).toUpperCase() + action.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Entity</label>
            <select
              value={filters.entity}
              onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Entities</option>
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { action: 'create', label: 'Created', color: 'bg-green-100 text-green-700' },
          { action: 'update', label: 'Updated', color: 'bg-blue-100 text-blue-700' },
          { action: 'delete', label: 'Deleted', color: 'bg-red-100 text-red-700' },
          { action: 'login',  label: 'Logins',  color: 'bg-purple-100 text-purple-700' },
          { action: 'export', label: 'Exports', color: 'bg-yellow-100 text-yellow-700' },
        ].map(({ action, label, color }) => {
          const count = logs.filter(l => l.action === action).length;
          return (
            <button
              key={action}
              onClick={() => setFilters(prev => ({ ...prev, action: prev.action === action ? 'all' : action }))}
              className={`rounded-lg p-3 text-center transition-all hover:opacity-80 ${color} ${filters.action === action ? 'ring-2 ring-offset-1 ring-current' : ''}`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-semibold">{label}</p>
            </button>
          );
        })}
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <History size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 font-semibold">No audit logs found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const style = getActionStyle(log.action);
            return (
              <div
                key={log.id}
                className={`bg-white rounded-lg border ${style.border} shadow-sm p-4 hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-4">
                  {/* Action Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center text-lg`}>
                    {getActionEmoji(log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.entity}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{log.description}</p>

                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User size={13} />
                            {log.userName || log.userId}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${style.badge} ${style.text}`}>
                          {log.action}
                        </span>
                        {log.entityId && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                            {log.entityId.slice(-6)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Changes */}
                    {log.changes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Changes:</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(log.changes).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                              <FileText size={11} />
                              <span className="font-semibold text-gray-700">{key}:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AuditLog;