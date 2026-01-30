import React, {
  createContext,
  useContext,
  useState,
  useCallback
} from 'react';

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
  arrayUnion,
  getDoc,
  onSnapshot
} from 'firebase/firestore';

import { db } from '../firebase';
import { useAuth } from './AuthContext';

/* ===============================
   CONTEXT
=============================== */

const TasksContext = createContext();

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return context;
};

/* ===============================
   PROVIDER
=============================== */

export const TasksProvider = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ===============================
     CREATE TASK
  =============================== */

  const createTask = useCallback(async (taskData) => {
    try {
      setError(null);

      const newTask = {
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assignedTo,
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        creatorRole: userRole,
        status: 'pending', // pending, in_progress, submitted, approved, rejected
        deadline: taskData.deadline,
        priority: taskData.priority || 'medium',
        notes: [],
        submissions: [],
        rejectionReason: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTask);

      return {
        id: docRef.id,
        ...newTask
      };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [currentUser, userRole]);

  /* ===============================
     GET ASSIGNED TASKS
  =============================== */

  const getAssignedTasks = useCallback(async (userId = null) => {
    try {
      setError(null);
      setLoading(true);

      const targetUserId = userId || currentUser.uid;

      const q = query(
        collection(db, 'tasks'),
        where('assignedTo', '==', targetUserId)
      );

      const snapshot = await getDocs(q);
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTasks(taskList);
      return taskList;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /* ===============================
     GET CREATED TASKS
  =============================== */

  const getCreatedTasks = useCallback(async (creatorId = null) => {
    try {
      setError(null);
      setLoading(true);

      const targetCreatorId = creatorId || currentUser.uid;

      const q = query(
        collection(db, 'tasks'),
        where('createdBy', '==', targetCreatorId)
      );

      const snapshot = await getDocs(q);
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return taskList;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /* ===============================
     SUBMIT TASK
  =============================== */

  const submitTask = useCallback(async (taskId, submissionData) => {
    try {
      setError(null);

      const taskRef = doc(db, 'tasks', taskId);

      const submission = {
        submittedBy: currentUser.uid,
        submittedByEmail: currentUser.email,
        submissionText: submissionData.submissionText,
        attachments: submissionData.attachments || [],
        submittedAt: serverTimestamp()
      };

      await updateDoc(taskRef, {
        submissions: arrayUnion(submission),
        status: 'submitted',
        updatedAt: serverTimestamp()
      });

      return submission;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  /* ===============================
     ADD NOTE
  =============================== */

  const addNoteToTask = useCallback(async (taskId, noteText) => {
    try {
      setError(null);

      const taskRef = doc(db, 'tasks', taskId);

      const note = {
        addedBy: currentUser.uid,
        addedByEmail: currentUser.email,
        text: noteText,
        addedAt: serverTimestamp()
      };

      await updateDoc(taskRef, {
        notes: arrayUnion(note),
        updatedAt: serverTimestamp()
      });

      return note;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  /* ===============================
     APPROVE TASK
  =============================== */

  const approveTask = useCallback(async (taskId) => {
    try {
      setError(null);

      const taskRef = doc(db, 'tasks', taskId);

      await updateDoc(taskRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /* ===============================
     REJECT TASK
  =============================== */

  const rejectTask = useCallback(async (taskId, reason, newDeadline) => {
    try {
      setError(null);

      const taskRef = doc(db, 'tasks', taskId);

      await updateDoc(taskRef, {
        status: 'rejected',
        rejectionReason: reason,
        deadline: newDeadline,
        submissions: [],
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /* ===============================
     UPDATE TASK STATUS
  =============================== */

  const updateTaskStatus = useCallback(async (taskId, newStatus) => {
    try {
      setError(null);

      const taskRef = doc(db, 'tasks', taskId);

      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /* ===============================
     VALUE
  =============================== */

  const value = {
    tasks,
    loading,
    error,
    createTask,
    getAssignedTasks,
    getCreatedTasks,
    submitTask,
    addNoteToTask,
    approveTask,
    rejectTask,
    updateTaskStatus
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};
