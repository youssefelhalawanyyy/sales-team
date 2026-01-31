import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader, X, Briefcase, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const GlobalSearch = React.memo(() => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();

  // Handle search
  const handleSearch = useCallback(async (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const searchLower = term.toLowerCase();
      const isAdmin = userRole === 'admin' || userRole === 'sales_manager' || userRole === 'team_leader';
      
      // For non-admins, restrict search to their own data
      const dealsQuery = isAdmin
        ? query(collection(db, 'deals'), limit(5))
        : query(collection(db, 'deals'), where('salesPersonId', '==', currentUser.uid), limit(5));
      
      const contactsQuery = isAdmin
        ? query(collection(db, 'contacts'), limit(5))
        : query(collection(db, 'contacts'), where('salesPersonId', '==', currentUser.uid), limit(5));
      
      const [dealsSnap, contactsSnap, tasksSnap] = await Promise.all([
        getDocs(dealsQuery),
        getDocs(contactsQuery),
        getDocs(query(collection(db, 'tasks'), where('assignedTo', '==', currentUser.uid), limit(5)))
      ]);

      const deals = dealsSnap.docs
        .map(doc => ({ id: doc.id, type: 'deal', ...doc.data() }))
        .filter(d => 
          d.clientName?.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower) ||
          d.id.toLowerCase().includes(searchLower)
        );

      const contacts = contactsSnap.docs
        .map(doc => ({ id: doc.id, type: 'contact', ...doc.data() }))
        .filter(c => 
          c.name?.toLowerCase().includes(searchLower) ||
          c.company?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
        );

      const tasks = tasksSnap.docs
        .map(doc => ({ id: doc.id, type: 'task', ...doc.data() }))
        .filter(t => 
          t.title?.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
        );

      setResults({ deals, contacts, tasks });
    } catch (error) {
      console.error('Search error:', error);
      setResults({ deals: [], contacts: [], tasks: [] });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, userRole]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open]);

  const getIcon = (type) => {
    switch (type) {
      case 'deal':
        return <Briefcase size={16} className="text-blue-600" />;
      case 'contact':
        return <Users size={16} className="text-purple-600" />;
      case 'task':
        return <CheckCircle size={16} className="text-green-600" />;
      default:
        return <Search size={16} className="text-gray-600" />;
    }
  };

  const handleResultClick = (result) => {
    if (result.type === 'deal') {
      navigate(`/sales/deals?id=${result.id}`);
    } else if (result.type === 'contact') {
      navigate(`/sales/contacts?id=${result.id}`);
    } else if (result.type === 'task') {
      navigate(`/tasks?id=${result.id}`);
    }
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Button */}
      <button
        onClick={() => setOpen(!open)}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search size={16} />
        <span className="hidden lg:inline">Search...</span>
        <span className="hidden lg:inline text-xs text-gray-400">⌘K</span>
      </button>

      {/* Mobile Search Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Search size={20} className="text-gray-700" />
      </button>

      {/* Search Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-20">
          <div className="w-full max-w-2xl mx-auto px-4 animate-slideDown">
            {/* Search Input */}
            <div className="relative bg-white rounded-t-lg shadow-xl">
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <Search size={20} className="text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search deals, contacts, tasks... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                  className="w-full outline-none text-gray-900 placeholder-gray-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setResults(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X size={18} className="text-gray-500" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto bg-white">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader size={20} className="text-blue-600 animate-spin" />
                  </div>
                )}

                {results && !loading && (
                  <>
                    {/* Deals */}
                    {results.deals.length > 0 && (
                      <div className="border-b border-gray-200">
                        <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-500 uppercase">Deals</p>
                        {results.deals.map(deal => (
                          <button
                            key={deal.id}
                            onClick={() => handleResultClick(deal)}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex items-center gap-3"
                          >
                            {getIcon('deal')}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{deal.clientName}</p>
                              <p className="text-xs text-gray-600">€{parseFloat(deal.amount || 0).toLocaleString()}</p>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{deal.status}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Contacts */}
                    {results.contacts.length > 0 && (
                      <div className="border-b border-gray-200">
                        <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-500 uppercase">Contacts</p>
                        {results.contacts.map(contact => (
                          <button
                            key={contact.id}
                            onClick={() => handleResultClick(contact)}
                            className="w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors flex items-center gap-3"
                          >
                            {getIcon('contact')}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{contact.name}</p>
                              <p className="text-xs text-gray-600">{contact.company}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tasks */}
                    {results.tasks.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-500 uppercase">Tasks</p>
                        {results.tasks.map(task => (
                          <button
                            key={task.id}
                            onClick={() => handleResultClick(task)}
                            className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors flex items-center gap-3"
                          >
                            {getIcon('task')}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                              <p className="text-xs text-gray-600">{task.priority} priority</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Results */}
                    {results.deals.length === 0 && results.contacts.length === 0 && results.tasks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Search size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No results found for "{searchTerm}"</p>
                      </div>
                    )}
                  </>
                )}

                {!searchTerm && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Start typing to search</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default GlobalSearch;
