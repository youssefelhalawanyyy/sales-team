import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TasksContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import {
  ArrowLeft,
  Send,
  AlertCircle,
  Users
} from 'lucide-react';

const CreateTaskPage = () => {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const { createTask } = useTasks();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium'
  });

  const [users, setUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ===============================
     LOAD USERS
  =============================== */

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);

        // If team leader, only get their team members
        if (userRole === 'team_leader') {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();

          if (userData && userData.teamMembers) {
            const memberDocs = await Promise.all(
              userData.teamMembers.map(memberId =>
                getDoc(doc(db, 'users', memberId))
              )
            );

            const members = memberDocs
              .filter(snap => snap.exists())
              .map(snap => ({
                id: snap.id,
                email: snap.data().email,
                name: snap.data().name || snap.data().email
              }));

            setTeamMembers(members);
          }
        } else if (userRole === 'admin' || userRole === 'sales_manager') {
          // Admin and Sales Manager can assign to anyone
          const q = query(collection(db, 'users'), where('role', '!=', 'admin'));
          const snapshot = await getDocs(q);

          const allUsers = snapshot.docs.map(snap => ({
            id: snap.id,
            email: snap.data().email,
            name: snap.data().name || snap.data().email,
            role: snap.data().role
          }));

          setUsers(allUsers);
        }
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUser, userRole]);

  /* ===============================
     HANDLE SUBMIT
  =============================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!formData.title.trim()) {
        setError('Task title is required');
        return;
      }

      if (!formData.description.trim()) {
        setError('Task description is required');
        return;
      }

      if (!formData.assignedTo) {
        setError('Please select a team member');
        return;
      }

      if (!formData.deadline) {
        setError('Deadline is required');
        return;
      }

      // Check if deadline is in the future
      const selectedDate = new Date(formData.deadline);
      if (selectedDate <= new Date()) {
        setError('Deadline must be in the future');
        return;
      }

      setLoading(true);
      setError('');

      await createTask({
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        assignedToEmail: availableUsers.find(u => u.id === formData.assignedTo)?.email,
        deadline: selectedDate,
        priority: formData.priority
      });

      alert('Task created successfully');
      navigate('/tasks');
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const availableUsers = userRole === 'team_leader' ? teamMembers : users;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Tasks
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="text-red-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Complete Client Proposal"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                maxLength="200"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200</p>
            </div>

            {/* Task Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Task Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed instructions for the task..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                rows="5"
                maxLength="2000"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000</p>
            </div>

            {/* Assign To */}
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                Assign To *
              </label>
              {loading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading users...
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50">
                  <p className="text-red-700 flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    {userRole === 'team_leader'
                      ? 'No team members available. Please add team members first.'
                      : 'No users available to assign.'}
                  </p>
                </div>
              ) : (
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Select a team member...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} {user.role ? `(${user.role})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <input
                type="datetime-local"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">Select when this task should be completed</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.assignedTo}
                className="flex-1 flex items-center justify-center bg-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} className="mr-2" />
                Create Task
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Users size={18} className="mr-2" />
            Tips for Creating Effective Tasks
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Be clear and specific with task description</li>
            <li>✓ Set realistic deadlines</li>
            <li>✓ Include all necessary information and resources</li>
            <li>✓ Specify the expected format or deliverables</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskPage;
