import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { History, Filter, Calendar, User, FileText } from 'lucide-react';

export const AuditLog = () => {
  const { currentUser, userRole } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    entity: 'all',
    dateRange: 'all'
  });

  // Load audit logs
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
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));
      setLogs(logsData);
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
        const daysAgo = filters.dateRange === 'today' ? 1 :
                        filters.dateRange === 'week' ? 7 :
                        filters.dateRange === 'month' ? 30 : 365;
        
        const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
        if (logDate < cutoffDate) return false;
      }
      
      return true;
    });
  }, [logs, filters]);

  // Get action color and icon
  const getActionStyle = (action) => {
    const styles = {
      'create': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
      'update': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
      'delete': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
      'login': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
      'export': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' }
    };
    return styles[action] || styles['update'];
  };

  const getActionEmoji = (action) => {
    const emojis = {
      'create': '➕',
      'update': '✏️',
      'delete': '🗑️',
      'login': '🔐',
      'export': '📤'
    };
    return emojis[action] || '📝';
  };

  const uniqueActions = useMemo(() => {
    return [...new Set(logs.map(l => l.action))];
  }, [logs]);

  const uniqueEntities = useMemo(() => {
    return [...new Set(logs.map(l => l.entity))];
  }, [logs]);

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
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.entity}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                        
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                          <User size={14} />
                          <span>{log.userName || log.userId}</span>
                          <span className="mx-1">•</span>
                          <Calendar size={14} />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${style.badge} ${style.text}`}>
                          {log.action}
                        </span>
                        {log.entityId && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                            {log.entityId.slice(-6)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Changes */}
                    {log.changes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Changes:</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {Object.entries(log.changes).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <FileText size={12} />
                              <span><strong>{key}:</strong> {JSON.stringify(value)}</span>
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
