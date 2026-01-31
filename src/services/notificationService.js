import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc,
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Centralized notification service for managing all types of notifications
 * ✅ FIXED VERSION - Works for all users
 */

// Notification types
export const NOTIFICATION_TYPES = {
  DEAL_CREATED: 'deal_created',
  DEAL_UPDATED: 'deal_updated',
  DEAL_CLOSED: 'deal_closed',
  FOLLOW_UP_DUE: 'follow_up_due',
  FOLLOW_UP_COMPLETED: 'follow_up_completed',
  COMMISSION_EARNED: 'commission_earned',
  CLIENT_PROFILE_UPDATED: 'client_profile_updated',
  TEAM_MEMBER_ADDED: 'team_member_added',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  SETTLEMENT_READY: 'settlement_ready'
};

// Notification priority levels
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Send a notification to a user
 * ✅ FIXED: Now properly creates notifications for all users
 */
export async function sendNotification(userId, payload) {
  if (!userId || !payload?.message) {
    console.error('❌ Missing userId or message', { userId, message: payload?.message });
    return null;
  }

  try {
    console.log('📢 Sending notification to user:', userId);
    console.log('📝 Payload:', payload);
    
    const notification = {
      userId,
      title: payload.title || 'Notification',
      message: payload.message,
      type: payload.type || NOTIFICATION_TYPES.DEAL_CREATED,
      priority: payload.priority || NOTIFICATION_PRIORITY.MEDIUM,
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
      metadata: payload.metadata || {},
      actionUrl: payload.actionUrl || null,
      icon: payload.icon || null
    };

    console.log('💾 Creating notification document:', notification);
    
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    
    console.log('✅ Notification created successfully!');
    console.log('📄 Document ID:', docRef.id);
    console.log('👤 User ID:', userId);
    
    // If push notifications are enabled, send push notification
    if (payload.sendPush) {
      console.log('🔔 Attempting push notification...');
      await sendPushNotification(userId, payload);
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    return null;
  }
}

/**
 * Send notifications to multiple users
 * ✅ FIXED: Better error handling and logging
 */
export async function sendNotificationToMultiple(userIds, payload) {
  if (!userIds || userIds.length === 0) {
    console.error('❌ No user IDs provided');
    return false;
  }

  console.log(`📢 Sending notifications to ${userIds.length} users`);
  
  try {
    const promises = userIds.map((userId, index) => {
      console.log(`Sending to user ${index + 1}/${userIds.length}:`, userId);
      return sendNotification(userId, payload);
    });
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r !== null).length;
    
    console.log(`✅ Sent ${successful}/${userIds.length} notifications successfully`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending batch notifications:', error);
    return false;
  }
}

/**
 * Deal-related notifications
 */
export async function notifyDealCreated(userId, dealData) {
  console.log('🎯 notifyDealCreated called for user:', userId);
  console.log('Deal data:', dealData);
  
  const clientName = dealData.businessName || dealData.clientName || 'New Client';
  const amount = dealData.price ? `$${dealData.price.toLocaleString()}` : dealData.amount ? `$${dealData.amount.toLocaleString()}` : 'No amount';

  return sendNotification(userId, {
    title: 'New Deal Created',
    message: `New deal created: ${clientName} - ${amount}`,
    type: NOTIFICATION_TYPES.DEAL_CREATED,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    metadata: {
      dealId: dealData.id,
      clientName,
      amount: dealData.price || dealData.amount
    },
    actionUrl: `/deals/${dealData.id}`,
    icon: '📊'
  });
}

export async function notifyDealUpdated(userId, dealData) {
  console.log('🎯 notifyDealUpdated called for user:', userId);
  
  const clientName = dealData.businessName || dealData.clientName || 'Client';
  const stage = dealData.stage || dealData.status || 'Updated';

  return sendNotification(userId, {
    title: 'Deal Updated',
    message: `Deal updated: ${clientName} - Now in ${stage} stage`,
    type: NOTIFICATION_TYPES.DEAL_UPDATED,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    metadata: {
      dealId: dealData.id,
      clientName,
      stage: dealData.stage || dealData.status
    },
    actionUrl: `/deals/${dealData.id}`,
    icon: '✏️'
  });
}

export async function notifyDealClosed(userId, dealData, status) {
  console.log('🎯 notifyDealClosed called for user:', userId);
  
  const clientName = dealData.businessName || dealData.clientName || 'Client';
  const amount = dealData.price ? `$${dealData.price.toLocaleString()}` : dealData.amount ? `$${dealData.amount.toLocaleString()}` : '';

  return sendNotification(userId, {
    title: `Deal ${status}`,
    message: `Deal ${status}: ${clientName} ${amount}`,
    type: NOTIFICATION_TYPES.DEAL_CLOSED,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: {
      dealId: dealData.id,
      clientName,
      amount: dealData.price || dealData.amount,
      status
    },
    actionUrl: `/deals/${dealData.id}`,
    icon: status === 'Won' ? '🎉' : '❌'
  });
}

/**
 * Follow-up related notifications
 */
export async function notifyFollowUpDue(userId, followUpData) {
  console.log('🎯 notifyFollowUpDue called for user:', userId);
  
  const clientName = followUpData.businessName || followUpData.clientName || 'Client';
  const type = followUpData.type || 'Follow-up';

  return sendNotification(userId, {
    title: `${type} Due`,
    message: `${type} due for ${clientName}`,
    type: NOTIFICATION_TYPES.FOLLOW_UP_DUE,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: {
      followUpId: followUpData.id,
      clientName,
      dueDate: followUpData.dueDate
    },
    actionUrl: `/follow-ups`,
    icon: '📞'
  });
}

export async function notifyFollowUpCompleted(userId, followUpData) {
  console.log('🎯 notifyFollowUpCompleted called for user:', userId);
  
  const clientName = followUpData.businessName || followUpData.clientName || 'Client';

  return sendNotification(userId, {
    title: 'Follow-up Completed',
    message: `Follow-up completed with ${clientName}`,
    type: NOTIFICATION_TYPES.FOLLOW_UP_COMPLETED,
    priority: NOTIFICATION_PRIORITY.LOW,
    metadata: {
      followUpId: followUpData.id,
      clientName
    },
    actionUrl: `/follow-ups`,
    icon: '✅'
  });
}

/**
 * Commission-related notifications
 */
export async function notifyCommissionEarned(userId, commissionData) {
  console.log('🎯 notifyCommissionEarned called for user:', userId);
  
  const amount = `$${commissionData.amount.toLocaleString()}`;
  const dealName = commissionData.dealName || 'Deal';

  return sendNotification(userId, {
    title: 'Commission Earned',
    message: `Commission earned: ${amount} for ${dealName}`,
    type: NOTIFICATION_TYPES.COMMISSION_EARNED,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: {
      commissionId: commissionData.id,
      amount: commissionData.amount,
      dealName
    },
    actionUrl: `/finance`,
    icon: '💰'
  });
}

/**
 * Achievement-related notifications
 */
export async function notifyAchievementUnlocked(userId, achievementData) {
  console.log('🎯 notifyAchievementUnlocked called for user:', userId);
  
  return sendNotification(userId, {
    title: 'Achievement Unlocked!',
    message: `Achievement unlocked: ${achievementData.name}`,
    type: NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    metadata: {
      achievementId: achievementData.id,
      name: achievementData.name,
      description: achievementData.description
    },
    actionUrl: `/achievements`,
    icon: '🏆'
  });
}

/**
 * Settlement-related notifications
 */
export async function notifySettlementReady(userId, settlementData) {
  console.log('🎯 notifySettlementReady called for user:', userId);
  
  const amount = `$${settlementData.totalAmount.toLocaleString()}`;

  return sendNotification(userId, {
    title: 'Settlement Ready',
    message: `Settlement ready for processing: ${amount}`,
    type: NOTIFICATION_TYPES.SETTLEMENT_READY,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: {
      settlementId: settlementData.id,
      totalAmount: settlementData.totalAmount
    },
    actionUrl: `/settlements`,
    icon: '📋'
  });
}

/**
 * Team member notifications
 */
export async function notifyTeamMemberAdded(userId, teamData, newMemberData) {
  console.log('🎯 notifyTeamMemberAdded called for user:', userId);
  
  const memberName = newMemberData.name || newMemberData.email || 'New member';
  const teamName = teamData.name || 'your team';

  return sendNotification(userId, {
    title: 'New Team Member',
    message: `${memberName} joined ${teamName}`,
    type: NOTIFICATION_TYPES.TEAM_MEMBER_ADDED,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    metadata: {
      teamId: teamData.id,
      memberId: newMemberData.id,
      memberName,
      teamName
    },
    actionUrl: `/teams/${teamData.id}`,
    icon: '👥'
  });
}

/**
 * Push notification support
 * ✅ FIXED: Proper user document retrieval
 */
async function sendPushNotification(userId, payload) {
  try {
    console.log('🔔 Attempting to send push notification to:', userId);
    
    // ✅ FIX: Use getDoc with document reference instead of query
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn('⚠️ User document not found:', userId);
      return false;
    }

    const userData = userDoc.data();
    console.log('👤 User data retrieved:', { 
      hasSubscription: !!userData.pushSubscription,
      pushEnabled: userData.pushNotificationsEnabled 
    });
    
    if (!userData.pushSubscription) {
      console.warn('⚠️ User has no push subscription:', userId);
      return false;
    }

    // Check if running in browser with service worker support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('⚠️ Service worker or PushManager not available');
      return false;
    }

    // Send push notification via service worker
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(payload.title || 'Notification', {
      body: payload.message,
      badge: '/badge-icon.png',
      icon: '/notification-icon.png',
      tag: payload.type,
      requireInteraction: payload.priority === NOTIFICATION_PRIORITY.URGENT,
      vibrate: [200, 100, 200],
      data: {
        url: payload.actionUrl,
        type: payload.type,
        metadata: payload.metadata
      }
    });
    
    console.log('✅ Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    console.error('Error details:', { message: error.message, stack: error.stack });
    return false;
  }
}

/**
 * Request push notification permission
 * ✅ FIXED: Proper document existence check and error handling
 */
export async function requestPushNotificationPermission(userId) {
  try {
    console.log('📱 Requesting push notification permission for:', userId);
    
    // Check browser support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('⚠️ Push notifications not supported in this browser');
      return false;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('📋 Permission status:', permission);
    
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied');
      return false;
    }

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready');

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
    });

    console.log('✅ Push subscription created:', subscription.endpoint);

    // ✅ FIX: Check if user document exists before updating
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User document not found:', userId);
      return false;
    }

    // Save subscription to database
    await updateDoc(userRef, {
      pushSubscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
        }
      },
      pushNotificationsEnabled: true,
      lastPushSubscriptionUpdate: serverTimestamp()
    });

    console.log('✅ Push subscription saved to database');
    return true;
  } catch (error) {
    console.error('❌ Error requesting push notification permission:', error);
    console.error('Error details:', { message: error.message, stack: error.stack });
    return false;
  }
}

/**
 * Disable push notifications for a user
 */
export async function disablePushNotifications(userId) {
  try {
    console.log('🔕 Disabling push notifications for:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User document not found:', userId);
      return false;
    }

    await updateDoc(userRef, {
      pushNotificationsEnabled: false,
      lastPushSubscriptionUpdate: serverTimestamp()
    });

    console.log('✅ Push notifications disabled');
    return true;
  } catch (error) {
    console.error('❌ Error disabling push notifications:', error);
    return false;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    console.log('📖 Marking notification as read:', notificationId);
    
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });

    console.log('✅ Notification marked as read');
    return true;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    console.log('📖 Marking all notifications as read for user:', userId);
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} unread notifications`);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
    
    console.log('✅ All notifications marked as read');
    return true;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return 0;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  try {
    console.log('🗑️ Deleting notification:', notificationId);
    
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    });

    console.log('✅ Notification deleted');
    return true;
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return false;
  }
}

/**
 * Test notification (for debugging)
 */
export async function sendTestNotification(userId) {
  console.log('🧪 Sending test notification to:', userId);
  
  return sendNotification(userId, {
    title: 'Test Notification',
    message: 'This is a test notification. If you can see this, notifications are working!',
    type: NOTIFICATION_TYPES.DEAL_CREATED,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    icon: '🧪',
    actionUrl: '/notifications'
  });
}

// Export everything
export default {
  // Core functions
  sendNotification,
  sendNotificationToMultiple,
  
  // Deal notifications
  notifyDealCreated,
  notifyDealUpdated,
  notifyDealClosed,
  
  // Follow-up notifications
  notifyFollowUpDue,
  notifyFollowUpCompleted,
  
  // Commission notifications
  notifyCommissionEarned,
  
  // Achievement notifications
  notifyAchievementUnlocked,
  
  // Settlement notifications
  notifySettlementReady,
  
  // Team notifications
  notifyTeamMemberAdded,
  
  // Push notifications
  requestPushNotificationPermission,
  disablePushNotifications,
  
  // Notification management
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  
  // Testing
  sendTestNotification,
  
  // Constants
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY
};