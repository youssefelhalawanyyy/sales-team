import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';

export const CalendarView = () => {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day

  // Real-time listeners
  useEffect(() => {
    if (!currentUser?.uid) return;

    const isAdmin = userRole === 'admin' || userRole === 'sales_manager';
    
    const dealsQuery = isAdmin
      ? query(collection(db, 'deals'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'deals'),
          where('salesPersonId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', currentUser.uid),
      orderBy('dueDate', 'asc')
    );

    const dealsUnsub = onSnapshot(dealsQuery, (snap) => {
      const dealsData = snap.docs.map(doc => ({
        id: doc.id,
        type: 'deal',
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setDeals(dealsData);
    });

    const tasksUnsub = onSnapshot(tasksQuery, (snap) => {
      const tasksData = snap.docs.map(doc => ({
        id: doc.id,
        type: 'task',
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate?.() || new Date()
      }));
      setTasks(tasksData);
    });

    return () => {
      dealsUnsub();
      tasksUnsub();
    };
  }, [currentUser?.uid, userRole]);

  // Get events for selected date
  const eventsForDate = useMemo(() => {
    const dateStr = currentDate.toDateString();
    
    const dealEvents = deals.filter(deal => 
      new Date(deal.createdAt).toDateString() === dateStr
    ).map(d => ({ ...d, type: 'deal' }));

    const taskEvents = tasks.filter(task => 
      new Date(task.dueDate).toDateString() === dateStr
    ).map(t => ({ ...t, type: 'task' }));

    return [...dealEvents, ...taskEvents];
  }, [deals, tasks, currentDate]);

  // Calendar grid
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

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentDate]);

  const hasEvent = (day) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toDateString();
    return deals.some(d => new Date(d.createdAt).toDateString() === dateStr) ||
           tasks.some(t => new Date(t.dueDate).toDateString() === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === currentDate.getDate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Calendar</h1>
            <p className="text-blue-100">Manage your deals and tasks</p>
          </div>
          <div className="flex gap-2">
            {['month', 'week', 'day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  view === v
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => {
                  if (day) {
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                  }
                }}
                className={`aspect-square relative rounded-lg font-semibold transition-all flex items-center justify-center ${
                  !day
                    ? 'bg-gray-50'
                    : isToday(day)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isSelected(day)
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{day}</span>
                {hasEvent(day) && !isToday(day) && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {currentDate.toLocaleDateString('default', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {eventsForDate.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No events scheduled</p>
            ) : (
              eventsForDate.map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${
                    event.type === 'deal'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-green-50 border-green-500'
                  }`}
                >
                  {event.type === 'deal' ? (
                    <>
                      <p className="font-semibold text-gray-900 text-sm">{event.clientName}</p>
                      <p className="text-xs text-gray-600 mt-1">€{parseFloat(event.amount || 0).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {event.status}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          event.priority === 'high' ? 'bg-red-100 text-red-700' :
                          event.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {event.priority}
                        </span>
                      </div>
                    </>
                  )}
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
