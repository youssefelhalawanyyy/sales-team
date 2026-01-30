import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TasksContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  MessageSquare,
  Calendar,
  User,
  FileText,
  Send,
  XCircle,
  PlayCircle,
  Zap,
  Target,
  TrendingUp,
  ChevronRight,
  Filter
} from 'lucide-react';

const TasksPageV2 = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const {
    tasks,
    loading,
    getAssignedTasks,
    getCreatedTasks,
    submitTask,
    addNoteToTask,
    approveTask,
    rejectTask,
    updateTaskStatus
  } = useTasks();

  const [activeTab, setActiveTab] = useState('assigned');
  const [createdTasks, setCreatedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approveConfirmId, setApproveConfirmId] = useState(null);
  const [userNames, setUserNames] = useState({});

  /* ===============================
     LOAD TASKS AND USER DATA
  =============================== */

  useEffect(() => {
    let unsubscribe;

    const setupListeners = () => {
      try {
        if (activeTab === 'assigned') {
          // Subscribe to real-time updates
          unsubscribe = getAssignedTasks(null, (updatedTasks) => {
            // Tasks will be updated automatically via context
          });
        } else {
          // Subscribe to real-time updates for created tasks
          unsubscribe = getCreatedTasks(null, (updatedTasks) => {
            setCreatedTasks(updatedTasks);
          });
        }
      } catch (error) {
        console.error('Error setting up listeners:', error);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [activeTab, getAssignedTasks, getCreatedTasks]);

  // Load user names for display
  useEffect(() => {
    const loadUserNames = async () => {
      const currentList = activeTab === 'assigned' ? tasks : createdTasks;
      const userIds = new Set();

      currentList.forEach(task => {
        if (activeTab === 'assigned' && task.createdBy) userIds.add(task.createdBy);
        if (activeTab === 'created' && task.assignedTo) userIds.add(task.assignedTo);
      });

      for (const userId of userIds) {
        if (!userNames[userId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              setUserNames(prev => ({
                ...prev,
                [userId]: userDoc.data().name || userDoc.data().email
              }));
            }
          } catch (error) {
            console.error('Error loading user name:', error);
          }
        }
      }
    };

    loadUserNames();
  }, [tasks, createdTasks, activeTab, userNames]);

  /* ===============================
     CATEGORIZE TASKS
  =============================== */

  const categorizeTasksByStatus = (taskList) => {
    const now = new Date();
    return {
      pending: taskList.filter(t => t.status === 'pending'),
      upcoming: taskList.filter(t => 
        t.status === 'in_progress' &&
        new Date(t.deadline?.toDate?.() || t.deadline) > now
      ),
      overdue: taskList.filter(t =>
        (t.status === 'pending' || t.status === 'in_progress') &&
        new Date(t.deadline?.toDate?.() || t.deadline) <= now
      ),
      submitted: taskList.filter(t => t.status === 'submitted'),
      approved: taskList.filter(t => t.status === 'approved'),
      rejected: taskList.filter(t => t.status === 'rejected')
    };
  };

  /* ===============================
     HANDLE ACTIONS
  =============================== */

  const handleSubmitTask = async (taskId) => {
    try {
      if (!submissionText.trim()) {
        alert('Please enter submission details');
        return;
      }

      await submitTask(taskId, { submissionText });
      setSubmissionText('');
      setSelectedTask(null);

      if (activeTab === 'assigned') {
        await getAssignedTasks();
      } else {
        const created = await getCreatedTasks();
        setCreatedTasks(created);
      }

      alert('Task submitted successfully');
    } catch (error) {
      alert('Error submitting task: ' + error.message);
    }
  };

  const handleAddNote = async (taskId) => {
    try {
      if (!noteText.trim()) {
        alert('Please enter a note');
        return;
      }

      await addNoteToTask(taskId, noteText);
      setNoteText('');

      if (activeTab === 'assigned') {
        await getAssignedTasks();
      } else {
        const created = await getCreatedTasks();
        setCreatedTasks(created);
      }
    } catch (error) {
      alert('Error adding note: ' + error.message);
    }
  };

  const handleApprove = async (taskId) => {
    try {
      await approveTask(taskId);
      const created = await getCreatedTasks();
      setCreatedTasks(created);
      setSelectedTask(null);
      setApproveConfirmId(null);
      alert('Task approved');
    } catch (error) {
      alert('Error approving task: ' + error.message);
    }
  };

  const handleRejectSubmit = async (taskId) => {
    try {
      if (!rejectionReason.trim() || !newDeadline) {
        alert('Please enter rejection reason and new deadline');
        return;
      }

      await rejectTask(taskId, rejectionReason, newDeadline);
      setRejectionReason('');
      setNewDeadline('');
      setShowRejectionModal(false);

      const created = await getCreatedTasks();
      setCreatedTasks(created);
      setSelectedTask(null);
      alert('Task rejected with new deadline');
    } catch (error) {
      alert('Error rejecting task: ' + error.message);
    }
  };

  const handleMarkInProgress = async (taskId) => {
    try {
      await updateTaskStatus(taskId, 'in_progress');
      await getAssignedTasks();
      alert('Task marked as in progress');
    } catch (error) {
      alert('Error updating task: ' + error.message);
    }
  };

  /* ===============================
     HELPERS
  =============================== */

  const currentTasksList = activeTab === 'assigned' ? tasks : createdTasks;
  const categories = categorizeTasksByStatus(currentTasksList);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      submitted: 'bg-purple-100 text-purple-800 border-purple-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-blue-600 bg-blue-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  const TaskCard = ({ task, onClick, isCreated }) => {
    const deadline = task.deadline?.toDate?.() || new Date(task.deadline);
    const now = new Date();
    const isOverdue = deadline < now && (task.status === 'pending' || task.status === 'in_progress');

    return (
      <div
        onClick={onClick}
        className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 animate-fadeIn"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex-1 group-hover:text-blue-600 transition">{task.title}</h3>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(task.status)} whitespace-nowrap ml-2`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>

        <div className="flex flex-wrap gap-3 items-center text-xs text-gray-600 mb-3">
          {isCreated && task.assignedToEmail && (
            <div className="flex items-center bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <User size={14} className="mr-1.5" />
              <span className="truncate">{userNames[task.assignedTo] || task.assignedToEmail}</span>
            </div>
          )}

          {!isCreated && task.createdByEmail && (
            <div className="flex items-center bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <User size={14} className="mr-1.5" />
              <span className="truncate">by {userNames[task.createdBy] || task.createdByEmail}</span>
            </div>
          )}

          <div className={`flex items-center px-2.5 py-1.5 rounded-lg ${isOverdue ? 'bg-red-50 text-red-700' : 'bg-blue-50'}`}>
            <Calendar size={14} className="mr-1.5" />
            {formatDate(task.deadline)}
          </div>

          {task.priority && (
            <div className={`px-2.5 py-1.5 rounded-lg font-medium ${getPriorityColor(task.priority)} capitalize`}>
              {task.priority}
            </div>
          )}
        </div>

        <div className="flex gap-2 text-xs text-gray-500">
          {task.notes?.length > 0 && (
            <span className="flex items-center bg-gray-50 px-2 py-1 rounded">
              <MessageSquare size={12} className="mr-1" />
              {task.notes.length}
            </span>
          )}
          {task.submissions?.length > 0 && isCreated && (
            <span className="flex items-center bg-purple-50 px-2 py-1 rounded text-purple-700">
              <FileText size={12} className="mr-1" />
              {task.submissions.length}
            </span>
          )}
        </div>
      </div>
    );
  };

  const TaskSection = ({ title, icon: Icon, tasks: sectionTasks, color, count }) => {
    if (sectionTasks.length === 0) return null;

    return (
      <div className="animate-slideInUp">
        <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 border-${color}-200`}>
          <Icon size={22} className={`text-${color}-600`} />
          <h3 className={`text-lg font-bold text-${color}-900`}>{title}</h3>
          <span className={`ml-auto bg-${color}-100 text-${color}-700 px-3 py-1 rounded-full text-sm font-semibold`}>
            {count}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {sectionTasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} isCreated={activeTab === 'created'} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg sticky top-0 z-20 animate-slideDown">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Tasks</h1>
              <p className="text-blue-100">Manage and track your workflow</p>
            </div>
            {(userRole === 'admin' || userRole === 'team_leader' || userRole === 'sales_manager') && (
              <button
                onClick={() => navigate('/tasks/create')}
                className="flex items-center bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Plus size={20} className="mr-2" />
                New Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-20 z-10 animate-slideDown">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-4 px-2 font-semibold transition-all duration-300 border-b-4 ${
                activeTab === 'assigned'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`py-4 px-2 font-semibold transition-all duration-300 border-b-4 ${
                activeTab === 'created'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Created by Me
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin">
              <Zap className="text-blue-600" size={40} />
            </div>
            <p className="text-gray-600 mt-6 text-lg font-medium">Loading tasks...</p>
          </div>
        ) : currentTasksList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300 animate-fadeIn">
            <Target className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg font-medium">No tasks yet</p>
            <p className="text-gray-500 text-sm">
              {activeTab === 'assigned' ? 'Start by creating a new task' : 'Assigned tasks will appear here'}
            </p>
          </div>
        ) : (
          <div>
            {categories.pending.length > 0 && (
              <TaskSection title="Pending" icon={Clock} tasks={categories.pending} color="yellow" count={categories.pending.length} />
            )}
            {categories.upcoming.length > 0 && (
              <TaskSection title="Upcoming" icon={Target} tasks={categories.upcoming} color="blue" count={categories.upcoming.length} />
            )}
            {categories.overdue.length > 0 && (
              <TaskSection title="Overdue" icon={AlertCircle} tasks={categories.overdue} color="red" count={categories.overdue.length} />
            )}
            {categories.submitted.length > 0 && activeTab === 'created' && (
              <TaskSection title="Awaiting Review" icon={FileText} tasks={categories.submitted} color="purple" count={categories.submitted.length} />
            )}
            {categories.approved.length > 0 && (
              <TaskSection title="Completed" icon={CheckCircle} tasks={categories.approved} color="green" count={categories.approved.length} />
            )}
            {categories.rejected.length > 0 && (
              <TaskSection title="Rejected" icon={XCircle} tasks={categories.rejected} color="red" count={categories.rejected.length} />
            )}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedTask.title}</h2>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full bg-white text-blue-600`}>
                  {selectedTask.status.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Details */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Task Details</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">{selectedTask.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-xs">Deadline</span>
                    <p className="font-semibold text-gray-900 mt-1">{formatDate(selectedTask.deadline)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-xs">Priority</span>
                    <p className={`font-semibold mt-1 capitalize ${getPriorityColor(selectedTask.priority).split(' ')[0]}`}>
                      {selectedTask.priority}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-xs">Created by</span>
                    <p className="font-semibold text-gray-900 mt-1 truncate">{userNames[selectedTask.createdBy] || selectedTask.createdByEmail}</p>
                  </div>
                  {activeTab === 'created' && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-600 text-xs">Assigned to</span>
                      <p className="font-semibold text-gray-900 mt-1 truncate">{userNames[selectedTask.assignedTo] || selectedTask.assignedToEmail}</p>
                    </div>
                  )}
                </div>

                {selectedTask.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <span className="font-bold">⚠️ Rejection Reason:</span> {selectedTask.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <MessageSquare size={20} className="mr-2 text-blue-600" />
                  Notes ({selectedTask.notes?.length || 0})
                </h3>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {selectedTask.notes?.map((note, idx) => (
                    <div key={idx} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400 animate-slideInLeft">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-gray-900">{userNames[note.addedBy] || note.addedByEmail}</span>
                        <span className="text-xs text-gray-500">{formatDate(note.addedAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{note.text}</p>
                    </div>
                  ))}
                </div>

                {(activeTab === 'created' || (activeTab === 'assigned' && selectedTask.status !== 'approved')) && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleAddNote(selectedTask.id);
                      }}
                    />
                    <button
                      onClick={() => handleAddNote(selectedTask.id)}
                      className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition flex items-center font-semibold"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Submissions */}
              {activeTab === 'created' && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <FileText size={20} className="mr-2 text-purple-600" />
                    Submissions ({selectedTask.submissions?.length || 0})
                  </h3>
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {selectedTask.submissions?.map((submission, idx) => (
                      <div key={idx} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400 animate-slideInLeft">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm text-gray-900">{userNames[submission.submittedBy] || submission.submittedByEmail}</span>
                          <span className="text-xs text-gray-500">{formatDate(submission.submittedAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{submission.submissionText}</p>
                      </div>
                    ))}
                  </div>

                  {selectedTask.status === 'submitted' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setApproveConfirmId(selectedTask.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center font-semibold hover:scale-105"
                      >
                        <CheckCircle size={18} className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectionModal(true)}
                        className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center font-semibold hover:scale-105"
                      >
                        <XCircle size={18} className="mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Submission Form */}
              {activeTab === 'assigned' && selectedTask.status !== 'approved' && selectedTask.status !== 'submitted' && (
                <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-4">Submit Your Work</h3>
                  <textarea
                    placeholder="Describe what you've completed..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition mb-4"
                    rows="4"
                  />
                  <div className="flex gap-3">
                    {selectedTask.status === 'pending' && (
                      <button
                        onClick={() => handleMarkInProgress(selectedTask.id)}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center font-semibold hover:scale-105"
                      >
                        <PlayCircle size={18} className="mr-2" />
                        Start Task
                      </button>
                    )}
                    <button
                      onClick={() => handleSubmitTask(selectedTask.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center font-semibold hover:scale-105"
                    >
                      <Send size={18} className="mr-2" />
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {approveConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-scaleIn text-center">
            <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Approve Task?</h2>
            <p className="text-gray-600 mb-8">Are you sure you want to approve this submission?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setApproveConfirmId(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(approveConfirmId)}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold hover:scale-105"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-scaleIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="mr-3 text-red-600" size={28} />
              Reject & Request Changes
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain what needs to be improved..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Deadline</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setNewDeadline('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectSubmit(selectedTask.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-semibold hover:scale-105"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPageV2;
