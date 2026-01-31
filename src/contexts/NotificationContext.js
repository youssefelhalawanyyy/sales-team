import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time notifications listener
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('❌ NotificationProvider: No currentUser.uid, skipping listener');
      return;
    }

    console.log('🔔 NotificationProvider: Setting up listener for user:', currentUser.uid);

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📬 NotificationProvider: Got snapshot with', snapshot.docs.length, 'notifications');
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      console.log('📋 NotificationProvider: Parsed notifications:', notifs);
      setNotifications(notifs);
      const unread = notifs.filter(n => !n.read).length;
      console.log('🔴 NotificationProvider: Unread count:', unread);
      setUnreadCount(unread);
    }, (error) => {
      console.error('❌ NotificationProvider: Snapshot error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    });

    return unsubscribe;
  }, [currentUser?.uid]);

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
