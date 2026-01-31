import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Centralized notification service for managing all types of notifications
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
 */
export async function sendNotification(userId, payload) {
  if (!userId || !payload?.message) {
    console.error('Missing userId or message');
    return null;
  }

  try {
    const notification = {
      userId,
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

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    
    // If push notifications are enabled, send push notification
    if (payload.sendPush) {
      await sendPushNotification(userId, payload);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendNotificationToMultiple(userIds, payload) {
  try {
    const promises = userIds.map(userId => sendNotification(userId, payload));
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error sending batch notifications:', error);
    return false;
  }
}

/**
 * Deal-related notifications
 */
export async function notifyDealCreated(userId, dealData) {
  const clientName = dealData.clientName || 'New Client';
  const amount = dealData.amount ? `$${dealData.amount.toLocaleString()}` : 'No amount';

  return sendNotification(userId, {
    message: `New deal created: ${clientName} - ${amount}`,
    type: NOTIFICATION_TYPES.DEAL_CREATED,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    metadata: {
      dealId: dealData.id,
      clientName,
      amount: dealData.amount
    },
    actionUrl: `/deals/${dealData.id}`,
    icon: '📊'
  });
}

export async function notifyDealUpdated(userId, dealData) {
  const clientName = dealData.clientName || 'Client';
  const stage = dealData.stage || 'Updated';

  return sendNotification(userId, {
    message: `Deal updated: ${clientName} - Now in ${stage} stage`,
    type: NOTIFICATION_TYPES.DEAL_UPDATED,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    metadata: {
      dealId: dealData.id,
      clientName,
      stage: dealData.stage
    },
    actionUrl: `/deals/${dealData.id}`,
    icon: '✏️'
  });
}

export async function notifyDealClosed(userId, dealData, status) {
  const clientName = dealData.clientName || 'Client';
  const amount = dealData.amount ? `$${dealData.amount.toLocaleString()}` : '';

  return sendNotification(userId, {
    message: `Deal ${status}: ${clientName} ${amount}`,
    type: NOTIFICATION_TYPES.DEAL_CLOSED,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: {
      dealId: dealData.id,
      clientName,
      amount: dealData.amount,
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
  const clientName = followUpData.clientName || 'Client';
  const type = followUpData.type || 'Follow-up';

  return sendNotification(userId, {
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
  const clientName = followUpData.clientName || 'Client';

  return sendNotification(userId, {
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
  const amount = `$${commissionData.amount.toLocaleString()}`;
  const dealName = commissionData.dealName || 'Deal';

  return sendNotification(userId, {
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
  return sendNotification(userId, {
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
  const amount = `$${settlementData.totalAmount.toLocaleString()}`;

  return sendNotification(userId, {
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
 * Push notification support
 */
async function sendPushNotification(userId, payload) {
  try {
    // Get user's push subscription
    const q = query(
      collection(db, 'users'),
      where('uid', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return false;

    const userData = querySnapshot.docs[0].data();
    if (!userData.pushSubscription) return false;

    // Send push notification via service worker
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.message, {
        badge: payload.icon || '🔔',
        icon: payload.icon || '/favicon.ico',
        tag: payload.type,
        requireInteraction: payload.priority === NOTIFICATION_PRIORITY.URGENT,
        data: {
          url: payload.actionUrl,
          type: payload.type
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Request push notification permission
 */
export async function requestPushNotificationPermission(userId) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
    });

    // Save subscription to database
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushSubscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Error requesting push notification permission:', error);
    return false;
  }
}

export default {
  sendNotification,
  sendNotificationToMultiple,
  notifyDealCreated,
  notifyDealUpdated,
  notifyDealClosed,
  notifyFollowUpDue,
  notifyFollowUpCompleted,
  notifyCommissionEarned,
  notifyAchievementUnlocked,
  notifySettlementReady,
  requestPushNotificationPermission,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY
};
