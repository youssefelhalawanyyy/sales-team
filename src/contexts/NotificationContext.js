import React, { createContext, useState, useCallback, useContext, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const desktopNotifiedIdsRef = useRef(new Set());
  const initialSnapshotRef = useRef(true);

  const isElectronRuntime = typeof window !== 'undefined' && Boolean(window.electron?.isElectron?.());

  // Real-time notifications listener
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('❌ NotificationProvider: No currentUser.uid, skipping listener');
      return;
    }

    // Reset desktop-notification cache when user changes
    desktopNotifiedIdsRef.current = new Set();
    initialSnapshotRef.current = true;

    console.log('🔔 NotificationProvider: Setting up listener for user:', currentUser.uid);

    let unsubscribe = null;
    let fellBackToUnordered = false;

    const normalizeNotifications = (snapshot) => {
      const notifs = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt =
          data?.createdAt?.toDate?.() ||
          (data?.createdAt instanceof Date ? data.createdAt : null) ||
          (data?.createdAt ? new Date(data.createdAt) : new Date());
        return {
          id: doc.id,
          ...data,
          createdAt
        };
      });
      return notifs
        .filter(n => !n.deleted)
        .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
    };

    const subscribe = (useOrderedQuery) => {
      const q = useOrderedQuery
        ? query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
          )
        : query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid)
          );

      unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('📬 NotificationProvider: Got snapshot with', snapshot.docs.length, 'notifications');
        let notifs = normalizeNotifications(snapshot);
        if (!useOrderedQuery) {
          notifs = notifs.slice(0, 50);
        }
        console.log('📋 NotificationProvider: Parsed notifications:', notifs);
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.read).length;
        console.log('🔴 NotificationProvider: Unread count:', unread);
        setUnreadCount(unread);
      }, (error) => {
        console.error('❌ NotificationProvider: Snapshot error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Fallback for missing composite index on (userId, createdAt)
        if (!fellBackToUnordered && error?.code === 'failed-precondition') {
          fellBackToUnordered = true;
          console.warn('⚠️ Missing index for notifications. Falling back to unordered query.');
          if (unsubscribe) {
            unsubscribe();
          }
          subscribe(false);
        }
      });
    };

    subscribe(true);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid]);

  // Request desktop notification permission for Electron only
  useEffect(() => {
    if (!isElectronRuntime || typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [isElectronRuntime]);

  // Show laptop notifications when new unread notifications arrive (Electron app only)
  useEffect(() => {
    if (!isElectronRuntime || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (!currentUser?.uid) return;

    // Ignore initial batch to avoid replaying old notifications on app start
    if (initialSnapshotRef.current) {
      notifications.forEach((notif) => desktopNotifiedIdsRef.current.add(notif.id));
      initialSnapshotRef.current = false;
      return;
    }

    notifications.forEach((notif) => {
      if (notif.read) return;
      if (desktopNotifiedIdsRef.current.has(notif.id)) return;

      desktopNotifiedIdsRef.current.add(notif.id);

      try {
        const popup = new Notification(notif.title || 'New Notification', {
          body: notif.message || 'You have a new update.',
          tag: notif.id,
          renotify: false
        });
        popup.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
          }
        };
      } catch (error) {
        console.error('❌ Desktop notification failed:', error);
      }
    });
  }, [notifications, isElectronRuntime, currentUser?.uid]);

  const markAsRead = useCallback(async (notificationId) => {
    const { updateDoc, doc } = await import('firebase/firestore');
    try {
      console.log('✏️ Marking notification as read:', notificationId);
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const { writeBatch, doc } = await import('firebase/firestore');
    try {
      console.log('📝 Marking all notifications as read, total:', notifications.length);
      const batch = writeBatch(db);
      let updateCount = 0;
      notifications.forEach(notif => {
        if (!notif.read) {
          console.log('  - Updating notification:', notif.id);
          batch.update(doc(db, 'notifications', notif.id), {
            read: true,
            readAt: new Date()
          });
          updateCount++;
        }
      });
      console.log('💾 Committing batch with', updateCount, 'updates');
      await batch.commit();
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId) => {
    const { deleteDoc, doc } = await import('firebase/firestore');
    try {
      console.log('🗑️ Deleting notification:', notificationId);
      await deleteDoc(doc(db, 'notifications', notificationId));
      console.log('✅ Notification deleted');
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
