import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  DollarSign,
  Target,
  Phone,
  User,
  Briefcase
} from 'lucide-react';

export const CalendarView = () => {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, deals, tasks, followups

  // Real-time listeners
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('❌ No current user');
      return;
    }

    console.log('👤 Loading calendar for user:', currentUser.uid);
    console.log('👔 User role:', userRole);
    setLoading(true);
    
    // Build queries based on role
    // Admins see ALL data, others see only their own
    let dealsQuery, tasksQuery, followUpsQuery;
    
    if (userRole === 'admin') {
      // Admins see ALL deals
      console.log('📊 Admin: Loading ALL deals');
      dealsQuery = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Regular users see deals created by them + assigned to them
      console.log('📊 User: Loading user deals (createdBy or assigned to = ' + currentUser.uid + ')');
      dealsQuery = query(
        collection(db, 'sales'),
        where('createdBy', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    }

    // Tasks Query - Users see tasks assigned to them AND created by them
    console.log('✅ Tasks: Loading assigned tasks (assignedTo = ' + currentUser.uid + ')');
    tasksQuery = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', currentUser.uid),
      orderBy('dueDate', 'asc')
    );

    // Follow-ups Query - Users see follow-ups assigned to them
    console.log('📞 Follow-ups: Loading assigned follow-ups (assignedTo = ' + currentUser.uid + ')');
    followUpsQuery = query(
      collection(db, 'followUps'),
      where('assignedTo', '==', currentUser.uid),
      orderBy('scheduledDate', 'asc')
    );

    // Listen to deals
    const dealsUnsub = onSnapshot(dealsQuery, (snap) => {
      const dealsData = snap.docs.map(doc => {
        const data = doc.data();
        console.log('📊 Deal data:', data);
        return {
          id: doc.id,
          type: 'deal',
          ...data,
          // Use multiple date fields to ensure we capture the right date
          date: data.expectedCloseDate?.toDate?.() || 
                data.createdAt?.toDate?.() || 
                data.closedDate?.toDate?.() || 
                new Date(),
          title: data.businessName || data.clientName || data.companyName || 'Unnamed Deal',
          subtitle: `${data.stage || data.status || 'New'} • $${(data.amount || data.price || data.dealValue || 0).toLocaleString()}`,
          status: data.stage || data.status || 'new',
          priority: data.priority || 'medium',
          amount: data.amount || data.price || data.dealValue || 0
        };
      });
      console.log('✅ Loaded deals:', dealsData.length);
      console.log('Deals:', dealsData);
      setDeals(dealsData);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error fetching deals:', error);
      setLoading(false);
    });

    // Listen to tasks
    const tasksUnsub = onSnapshot(tasksQuery, (snap) => {
      const tasksData = snap.docs.map(doc => {
        const data = doc.data();
        console.log('✅ Task data:', data);
        return {
          id: doc.id,
          type: 'task',
          ...data,
          date: data.dueDate?.toDate?.() || new Date(),
          title: data.title || data.name || 'Unnamed Task',
          subtitle: data.description || 'No description',
          status: data.status || 'pending',
          priority: data.priority || 'medium'
        };
      });
      console.log('✅ Loaded tasks:', tasksData.length);
      console.log('Tasks:', tasksData);
      setTasks(tasksData);
    }, (error) => {
      console.error('❌ Error fetching tasks:', error);
    });

    // Listen to follow-ups
    const followUpsUnsub = onSnapshot(followUpsQuery, (snap) => {
      const followUpsData = snap.docs.map(doc => {
        const data = doc.data();
        console.log('📞 Follow-up data:', data);
        return {
          id: doc.id,
          type: 'followup',
          ...data,
          date: data.scheduledDate?.toDate?.() || 
                data.dueDate?.toDate?.() || 
                data.followUpDate?.toDate?.() || 
                new Date(),
          title: data.clientName || data.businessName || data.company || 'Follow-up',
          subtitle: data.notes || data.description || 'No notes',
          status: data.status || 'pending',
          priority: data.priority || 'medium'
        };
      });
      console.log('✅ Loaded follow-ups:', followUpsData.length);
      console.log('Follow-ups:', followUpsData);
      setFollowUps(followUpsData);
    }, (error) => {
      console.error('❌ Error fetching follow-ups:', error);
    });

    return () => {
      console.log('🔌 Unsubscribing from calendar listeners');
      dealsUnsub();
      tasksUnsub();
      followUpsUnsub();
    };
  }, [currentUser?.uid, userRole]);

  // Get all events combined
  const allEvents = useMemo(() => {
    let events = [];
    
    if (filterType === 'all' || filterType === 'deals') {
      events = [...events, ...deals];
    }
    if (filterType === 'all' || filterType === 'tasks') {
      events = [...events, ...tasks];
    }
    if (filterType === 'all' || filterType === 'followups') {
      events = [...events, ...followUps];
    }
    
    console.log('📅 Total events:', events.length);
    return events;
  }, [deals, tasks, followUps, filterType]);

  // Get events for selected date
  const eventsForDate = useMemo(() => {
    const dateStr = selectedDate.toDateString();
    console.log('🔍 Looking for events on:', dateStr);
    
    const filtered = allEvents.filter(event => {
      const eventDateStr = new Date(event.date).toDateString();
      return eventDateStr === dateStr;
    });
    
    console.log('📋 Events found for selected date:', filtered.length);
    return filtered;
  }, [allEvents, selectedDate]);

  // Check if a day has events
  const getEventsForDay = (day) => {
    if (!day) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toDateString();
    
    return allEvents.filter(event => {
      const eventDateStr = new Date(event.date).toDateString();
      return eventDateStr === dateStr;
    });
  };

  // Calendar grid calculation
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentDate]);

  // Navigation functions
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    if (!day) return false;
    return day === selectedDate.getDate() &&
           currentDate.getMonth() === selectedDate.getMonth() &&
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  // Get event type counts for stats
  const stats = useMemo(() => {
    return {
      totalDeals: deals.length,
      totalTasks: tasks.length,
      totalFollowUps: followUps.length,
      total: allEvents.length
    };
  }, [deals.length, tasks.length, followUps.length, allEvents.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Modern Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
              <CalendarIcon className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
              <p className="text-gray-500">Track your deals, tasks, and follow-ups</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Deals</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.totalDeals}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">Tasks</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.totalTasks}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Phone size={16} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Follow-ups</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats.totalFollowUps}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterType === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('deals')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterType === 'deals'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Deals
                </button>
                <button
                  onClick={() => setFilterType('tasks')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterType === 'tasks'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setFilterType('followups')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterType === 'followups'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Follow-ups
                </button>
              </div>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Today
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const hasDeals = dayEvents.some(e => e.type === 'deal');
              const hasTasks = dayEvents.some(e => e.type === 'task');
              const hasFollowUps = dayEvents.some(e => e.type === 'followup');

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (day) {
                      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                    }
                  }}
                  disabled={!day}
                  className={`aspect-square relative rounded-xl font-semibold transition-all flex flex-col items-center justify-center p-1 ${
                    !day
                      ? 'bg-transparent cursor-default'
                      : isToday(day)
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : isSelected(day)
                      ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-500'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <span className="text-base">{day}</span>
                  
                  {/* Event Indicators */}
                  {day && dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {hasDeals && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isToday(day) ? 'bg-white' : 'bg-blue-500'}`}></div>
                      )}
                      {hasTasks && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isToday(day) ? 'bg-white' : 'bg-green-500'}`}></div>
                      )}
                      {hasFollowUps && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isToday(day) ? 'bg-white' : 'bg-purple-500'}`}></div>
                      )}
                    </div>
                  )}
                  
                  {/* Event Count Badge */}
                  {day && dayEvents.length > 0 && (
                    <span className={`absolute -top-1 -right-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isToday(day)
                        ? 'bg-white text-blue-600'
                        : 'bg-red-500 text-white'
                    }`}>
                      {dayEvents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Deals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Follow-ups</span>
            </div>
          </div>
        </div>

        {/* Events Sidebar */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedDate.toLocaleDateString('default', { 
                  weekday: 'long'
                })}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedDate.toLocaleDateString('default', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
              {eventsForDate.length} {eventsForDate.length === 1 ? 'Event' : 'Events'}
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading events...</p>
              </div>
            ) : eventsForDate.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No events scheduled</p>
                <p className="text-gray-400 text-sm mt-1">Select a different date to see events</p>
              </div>
            ) : (
              eventsForDate.map(event => (
                <div
                  key={event.id}
                  className={`p-4 rounded-xl border-l-4 transition-all hover:shadow-lg cursor-pointer ${
                    event.type === 'deal'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500 hover:from-blue-100 hover:to-blue-200'
                      : event.type === 'task'
                      ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500 hover:from-green-100 hover:to-green-200'
                      : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-500 hover:from-purple-100 hover:to-purple-200'
                  }`}
                >
                  {/* Event Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    {event.type === 'deal' ? (
                      <div className="bg-blue-500 p-1.5 rounded-lg">
                        <TrendingUp size={14} className="text-white" />
                      </div>
                    ) : event.type === 'task' ? (
                      <div className="bg-green-500 p-1.5 rounded-lg">
                        <CheckCircle2 size={14} className="text-white" />
                      </div>
                    ) : (
                      <div className="bg-purple-500 p-1.5 rounded-lg">
                        <Phone size={14} className="text-white" />
                      </div>
                    )}
                    
                    <span className={`text-xs font-bold uppercase tracking-wide ${
                      event.type === 'deal' ? 'text-blue-700' :
                      event.type === 'task' ? 'text-green-700' :
                      'text-purple-700'
                    }`}>
                      {event.type}
                    </span>
                  </div>

                  {/* Event Title */}
                  <h4 className="font-bold text-gray-900 text-base mb-1">
                    {event.title}
                  </h4>

                  {/* Event Subtitle */}
                  <p className="text-sm text-gray-600 mb-3">
                    {event.subtitle}
                  </p>

                  {/* Event Details */}
                  <div className="flex items-center gap-3 text-xs">
                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-lg font-semibold ${
                      event.status === 'completed' || event.status === 'won' || event.status === 'closed'
                        ? 'bg-green-200 text-green-800'
                        : event.status === 'pending' || event.status === 'new' || event.status === 'lead'
                        ? 'bg-yellow-200 text-yellow-800'
                        : event.status === 'lost'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {event.status}
                    </span>

                    {/* Priority Badge */}
                    <span className={`px-2 py-1 rounded-lg font-semibold ${
                      event.priority === 'high' || event.priority === 'urgent'
                        ? 'bg-red-200 text-red-800'
                        : event.priority === 'medium'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {event.priority}
                    </span>

                    {/* Amount for deals */}
                    {event.type === 'deal' && event.amount && (
                      <span className="px-2 py-1 bg-white rounded-lg font-bold text-gray-900 ml-auto">
                        ${event.amount.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{new Date(event.date).toLocaleTimeString('default', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;