import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TasksContext';
import { useNavigate } from 'react-router-dom';
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
  PlayCircle
} from 'lucide-react';

const TasksPage = () => {
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [approveConfirmId, setApproveConfirmId] = useState(null);

  /* ===============================
     LOAD TASKS
  =============================== */

  useEffect(() => {
    const loadTasks = async () => {
      try {
        if (activeTab === 'assigned') {
          await getAssignedTasks();
        } else {
          const created = await getCreatedTasks();
          setCreatedTasks(created);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };

    loadTasks();
  }, [activeTab, getAssignedTasks, getCreatedTasks]);

  /* ===============================
     SUBMIT TASK
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

      // Reload tasks
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

  /* ===============================
     ADD NOTE
  =============================== */

  const handleAddNote = async (taskId) => {
    try {
      if (!noteText.trim()) {
        alert('Please enter a note');
        return;
      }

      await addNoteToTask(taskId, noteText);
      setNoteText('');

      // Reload tasks
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

  /* ===============================
     HANDLE APPROVE
  =============================== */

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

  /* ===============================
     HANDLE REJECT
  =============================== */

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

  /* ===============================
     MARK IN PROGRESS
  =============================== */

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
     FILTER TASKS
  =============================== */

  const currentTasksList = activeTab === 'assigned' ? tasks : createdTasks;
  const filteredTasks = filterStatus === 'all'
    ? currentTasksList
    : currentTasksList.filter(task => task.status === filterStatus);

  /* ===============================
     GET STATUS COLOR
  =============================== */

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      submitted: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  /* ===============================
     GET STATUS ICON
  =============================== */

  const getStatusIcon = (status) => {
    const iconProps = { size: 16, className: 'mr-1' };
    switch (status) {
      case 'pending':
        return <Clock {...iconProps} />;
      case 'in_progress':
        return <PlayCircle {...iconProps} />;
      case 'submitted':
        return <AlertCircle {...iconProps} />;
      case 'approved':
        return <CheckCircle {...iconProps} />;
      case 'rejected':
        return <XCircle {...iconProps} />;
      default:
        return null;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            {(userRole === 'admin' || userRole === 'team_leader' || userRole === 'sales_manager') && (
              <button
                onClick={() => navigate('/tasks/create')}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={20} className="mr-2" />
                Create Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-4 px-2 font-medium transition ${activeTab === 'assigned'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`py-4 px-2 font-medium transition ${activeTab === 'created'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Created by Me
            </button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Clock className="text-blue-600" size={32} />
            </div>
            <p className="text-gray-600 mt-4">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 text-lg">No tasks found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{task.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Deadline: {formatDate(task.deadline)}</span>
                  </div>
                  {activeTab === 'created' && (
                    <div className="flex items-center text-gray-600">
                      <User size={16} className="mr-2" />
                      <span>Assigned to: {task.assignedTo}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <MessageSquare size={16} className="mr-2" />
                    <span>Notes: {task.notes?.length || 0}</span>
                  </div>
                  {activeTab === 'created' && task.submissions?.length > 0 && (
                    <div className="flex items-center text-gray-600">
                      <FileText size={16} className="mr-2" />
                      <span>Submissions: {task.submissions.length}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                <span className={`flex items-center w-fit px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                  {getStatusIcon(selectedTask.status)}
                  {selectedTask.status.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Task Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                <p className="text-gray-600 mb-4">{selectedTask.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Deadline:</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedTask.deadline)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Priority:</span>
                    <p className="font-medium text-gray-900 capitalize">{selectedTask.priority}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Created by:</span>
                    <p className="font-medium text-gray-900">{selectedTask.createdByEmail}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Created at:</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedTask.createdAt)}</p>
                  </div>
                </div>

                {selectedTask.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Rejection Reason:</span> {selectedTask.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Notes ({selectedTask.notes?.length || 0})</h3>
                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                  {selectedTask.notes?.map((note, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm text-gray-900">{note.addedByEmail}</span>
                        <span className="text-xs text-gray-500">{formatDate(note.addedAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{note.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note */}
                {activeTab === 'created' || (activeTab === 'assigned' && selectedTask.status !== 'approved') && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleAddNote(selectedTask.id);
                      }}
                    />
                    <button
                      onClick={() => handleAddNote(selectedTask.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Submissions Section - For Created Tasks */}
              {activeTab === 'created' && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Submissions ({selectedTask.submissions?.length || 0})</h3>
                  <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                    {selectedTask.submissions?.map((submission, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-gray-900">{submission.submittedByEmail}</span>
                          <span className="text-xs text-gray-500">{formatDate(submission.submittedAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{submission.submissionText}</p>
                      </div>
                    ))}
                  </div>

                  {/* Approval/Rejection Actions */}
                  {selectedTask.status === 'submitted' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setApproveConfirmId(selectedTask.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectionModal(true)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center"
                      >
                        <XCircle size={16} className="mr-2" />
                        Reject & Redo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Submission Section - For Assigned Tasks */}
              {activeTab === 'assigned' && selectedTask.status !== 'approved' && selectedTask.status !== 'submitted' && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Submit Work</h3>
                  <div className="space-y-3">
                    <textarea
                      placeholder="Describe your work/submission..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                    />
                    <div className="flex gap-3">
                      {selectedTask.status === 'pending' && (
                        <button
                          onClick={() => handleMarkInProgress(selectedTask.id)}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                        >
                          <PlayCircle size={16} className="mr-2" />
                          Mark In Progress
                        </button>
                      )}
                      <button
                        onClick={() => handleSubmitTask(selectedTask.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                      >
                        <Send size={16} className="mr-2" />
                        Submit Task
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {approveConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Task?</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to approve this task submission?</p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setApproveConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(approveConfirmId)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
              >
                <CheckCircle size={16} className="mr-2" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reject and Set New Deadline</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this submission needs to be redone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Deadline</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setNewDeadline('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectSubmit(selectedTask.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Reject & Redo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
