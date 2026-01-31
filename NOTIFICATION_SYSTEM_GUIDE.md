# Notification System - Complete Setup Guide

## Overview

This document provides a comprehensive guide to the automatic notification system that has been set up for the sales team platform. The system includes:

- ✅ Auto-sending notifications for various events
- ✅ Real-time notification UI with dropdown and toast notifications
- ✅ Push notifications support
- ✅ Integration with deals, follow-ups, and commissions
- ✅ Priority-based notification levels

---

## 1. Architecture

### Components

#### **NotificationService** (`src/services/notificationService.js`)
Central service for managing all notification types and sending.

**Features:**
- Notification type enumeration
- Priority levels (low, medium, high, urgent)
- Functions for each event type
- Push notification integration

**Key Functions:**
```javascript
// Send single notification
sendNotification(userId, payload)

// Send to multiple users
sendNotificationToMultiple(userIds, payload)

// Event-specific notifications
notifyDealCreated(userId, dealData)
notifyDealUpdated(userId, dealData)
notifyDealClosed(userId, dealData, status)
notifyFollowUpDue(userId, followUpData)
notifyFollowUpCompleted(userId, followUpData)
notifyCommissionEarned(userId, commissionData)
notifyAchievementUnlocked(userId, achievementData)
notifySettlementReady(userId, settlementData)
```

#### **NotificationCenter** (`src/components/NotificationCenter.js`)
UI component for displaying notifications.

**Features:**
- Bell icon with unread count badge
- Dropdown notification list
- Toast notifications (auto-dismiss after 5s)
- Mark as read / Delete actions
- Priority-based visual indicators

#### **NotificationContext** (`src/contexts/NotificationContext.js`)
Manages notification state and real-time updates from Firestore.

**Provides:**
- Real-time notification listener
- Unread count tracking
- Mark as read / delete actions
- Auto-updates when new notifications arrive

---

## 2. Event-Based Notifications

### Deal Notifications

#### When a deal is created:
```javascript
await notifyDealCreated(userId, {
  id: deal.id,
  clientName: deal.clientName,
  amount: deal.amount
});
```
**Message:** "New deal created: [Client Name] - $[Amount]"
**Icon:** 📊 **Priority:** Medium

#### When a deal is updated:
```javascript
await notifyDealUpdated(userId, {
  id: deal.id,
  clientName: deal.clientName,
  stage: deal.stage
});
```
**Message:** "Deal updated: [Client Name] - Now in [Stage] stage"
**Icon:** ✏️ **Priority:** Medium

#### When a deal is closed/lost:
```javascript
await notifyDealClosed(userId, dealData, 'Won' | 'Lost');
```
**Message:** "Deal Won/Lost: [Client Name] $[Amount]"
**Icon:** 🎉 (Won) or ❌ (Lost)
**Priority:** High

### Follow-Up Notifications

#### When a follow-up is due:
```javascript
await notifyFollowUpDue(userId, {
  id: followup.id,
  clientName: followup.clientName,
  dueDate: followup.dueDate
});
```
**Message:** "[Type] due for [Client Name]"
**Icon:** 📞 **Priority:** High

#### When a follow-up is completed:
```javascript
await notifyFollowUpCompleted(userId, {
  id: followup.id,
  clientName: followup.clientName
});
```
**Message:** "Follow-up completed with [Client Name]"
**Icon:** ✅ **Priority:** Low

### Commission Notifications

#### When a commission is earned:
```javascript
await notifyCommissionEarned(userId, {
  id: commission.id,
  amount: commission.amount,
  dealName: commission.dealName
});
```
**Message:** "Commission earned: $[Amount] for [Deal Name]"
**Icon:** 💰 **Priority:** High

---

## 3. Integration Points

### SalesDealsPage (`src/pages/SalesDealsPage.js`)
- ✅ Import: `notifyDealUpdated`, `notifyDealClosed`
- ✅ Integration: In `saveEdit()` function
- ✅ Notifications sent when deal status changes

### FollowUpsPage (`src/pages/FollowUpsPage.js`)
- ✅ Import: `notifyFollowUpDue`, `notifyFollowUpCompleted`
- ✅ Integration: In `markAsDone()` function
- ✅ Notifications sent when follow-up is marked complete

### CommissionPage (`src/pages/comission.js`)
- ✅ Import: `notifyCommissionEarned`
- ✅ Integration: In `submit()` function
- ✅ Notifications sent to user when commission is added

---

## 4. Push Notifications

### Setup Requirements

1. **VAPID Keys:** Generate public/private key pair for Web Push
   ```bash
   # Generate VAPID keys (use web-push library)
   npx web-push generate-vapid-keys
   ```

2. **Environment Variables:**
   ```env
   REACT_APP_VAPID_PUBLIC_KEY=<your-public-key>
   ```

3. **Service Worker:** Automatic registration in `public/service-worker.js`

### Push Notification Hook (`src/hooks/usePushNotifications.js`)

**Features:**
- Detects push notification support
- Registers service worker
- Requests user permission
- Manages subscriptions
- Saves subscription to Firebase

**Usage:**
```javascript
import { usePushNotifications } from '../hooks/usePushNotifications';

const MyComponent = () => {
  const {
    isPushSupported,
    isSubscribed,
    isLoading,
    requestNotificationPermission,
    unsubscribeFromPushNotifications
  } = usePushNotifications();

  const handleEnable = async () => {
    await requestNotificationPermission();
  };

  return (
    <button onClick={handleEnable} disabled={isLoading}>
      {isSubscribed ? 'Disable' : 'Enable'} Notifications
    </button>
  );
};
```

### Push Notification Settings (`src/components/PushNotificationSettings.js`)

A complete UI component for managing push notification preferences.

**Features:**
- Browser compatibility check
- Enable/disable toggle
- Error handling
- Success feedback
- Usage information

---

## 5. Notification Firestore Schema

### Collection: `notifications`

```javascript
{
  userId: string,           // Recipient user ID
  message: string,          // Notification message
  type: string,             // Notification type (see NOTIFICATION_TYPES)
  priority: string,         // Priority level (low, medium, high, urgent)
  read: boolean,            // Read status
  readAt: timestamp,        // When marked as read
  createdAt: timestamp,     // When created
  metadata: object,         // Additional data (dealId, clientName, etc)
  actionUrl: string,        // URL to navigate to on click
  icon: string             // Emoji or icon identifier
}
```

---

## 6. Notification Types

```javascript
NOTIFICATION_TYPES = {
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
}

NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}
```

---

## 7. Usage Examples

### Example 1: Sending a Notification on Deal Creation

```javascript
import { notifyDealCreated } from '../services/notificationService';

// In your component
const handleCreateDeal = async (deal) => {
  // ... create deal in database

  // Send notification
  await notifyDealCreated(currentUser.uid, {
    id: deal.id,
    clientName: deal.businessName,
    amount: deal.price
  });
};
```

### Example 2: Broadcasting to Multiple Users

```javascript
import { sendNotificationToMultiple } from '../services/notificationService';

// Send to all team members
const teamIds = ['user1', 'user2', 'user3'];
await sendNotificationToMultiple(teamIds, {
  message: 'New team announcement: Project deadline extended',
  type: NOTIFICATION_TYPES.TEAM_MEMBER_ADDED,
  priority: NOTIFICATION_PRIORITY.HIGH,
  actionUrl: '/announcements'
});
```

### Example 3: Custom Notification

```javascript
import { sendNotification } from '../services/notificationService';

await sendNotification(userId, {
  message: 'Your custom notification message',
  type: 'custom_event',
  priority: 'medium',
  metadata: { customData: 'value' },
  actionUrl: '/page-to-navigate-to',
  icon: '🎯',
  sendPush: true  // Send push notification if subscribed
});
```

---

## 8. UI Components

### NotificationCenter Location
- Integrated into `Navigation.js`
- Visible in top-right corner of header
- Accessible to all authenticated users

### Visual States

**Bell Icon:**
- Shows unread count badge (red circle)
- Tooltip shows "Notifications" on hover

**Dropdown:**
- Displays up to 50 most recent notifications
- Sorted by newest first
- Each notification shows:
  - Icon
  - Message
  - Time elapsed (e.g., "5m ago")
  - Mark as read button
  - Delete button
  - Priority indicator (colored left border)

**Toast Notifications:**
- Appear at top-right corner
- Auto-dismiss after 5 seconds
- Show icon, message, and close button
- Styled by priority level

---

## 9. Colors & Priority Indicators

| Priority | Color | Hex | Border Color |
|----------|-------|-----|--------------|
| Urgent | Red | #dc2626 | Left 4px border |
| High | Amber | #f59e0b | Left 4px border |
| Medium | Blue | #3b82f6 | Left 4px border |
| Low | Gray | #6b7280 | Left 4px border |

---

## 10. Advanced Features

### Auto-Dismiss Toast Notifications
- Configured to auto-dismiss after 5 seconds
- Can be customized in `NotificationCenter.js`

### Real-time Updates
- Uses Firestore `onSnapshot` listener
- Automatically updates when new notifications arrive
- Maintains unread count

### Notification Actions
- Click notification to mark as read
- Delete notifications individually
- Mark all as read from dropdown

### Analytics Ready
- All notifications stored in Firestore
- Metadata for tracking user actions
- Can analyze notification effectiveness

---

## 11. Testing the System

### Manual Testing

1. **Test Deal Notifications:**
   - Navigate to Sales > Deals
   - Create/update a deal
   - Check notification center for new notification

2. **Test Follow-Up Notifications:**
   - Navigate to Sales > Follow-Ups
   - Mark a follow-up as done
   - Verify notification appears

3. **Test Commission Notifications:**
   - Navigate to Finance > Commissions
   - Add a new commission
   - Check for commission notification

4. **Test Push Notifications:**
   - Go to Settings
   - Enable push notifications
   - Request browser permission
   - Send a notification and check device

### Debug Mode
Add this to your browser console to send test notifications:

```javascript
// Import in console (if available)
import { sendNotification } from './services/notificationService';

// Send test notification
sendNotification('YOUR_USER_ID', {
  message: 'Test notification',
  type: 'test',
  priority: 'high',
  metadata: { test: true }
});
```

---

## 12. Troubleshooting

### Notifications Not Appearing

**Cause:** NotificationContext not properly wrapped
**Solution:** Ensure app is wrapped with `NotificationProvider` in `App.js`

**Cause:** User not subscribed to real-time updates
**Solution:** Check Firebase permissions and authentication state

### Push Notifications Not Working

**Cause:** Service Worker not registered
**Solution:** Check browser console for errors, try in different browser

**Cause:** VAPID key not configured
**Solution:** Generate VAPID keys and add to `.env`

**Cause:** Browser doesn't support push notifications
**Solution:** Use Chrome, Firefox, Edge, or other modern browsers

### Notifications Sent to Wrong User

**Cause:** Incorrect userId in notification payload
**Solution:** Verify userId matches authenticated user

---

## 13. Performance Optimization

- Notifications limited to 50 most recent (Firestore query)
- Real-time listener only activates when needed
- NotificationCenter memoized to prevent unnecessary re-renders
- Toast notifications auto-dismiss to prevent memory leaks

---

## 14. Security Considerations

- ✅ Notifications respect user authentication
- ✅ Users only see their own notifications
- ✅ Push subscriptions stored securely in Firestore
- ✅ Service Worker limited to same origin
- ✅ VAPID key kept in environment variables

---

## Files Modified/Created

### Created:
- `src/services/notificationService.js` - Core service
- `src/components/NotificationCenter.js` - UI component
- `src/components/NotificationCenter.css` - Styling
- `src/components/PushNotificationSettings.js` - Settings UI
- `src/hooks/usePushNotifications.js` - Hook
- `public/service-worker.js` - Service worker

### Modified:
- `src/App.js` - Added service worker registration
- `src/pages/SalesDealsPage.js` - Added deal notifications
- `src/pages/FollowUpsPage.js` - Added follow-up notifications
- `src/pages/comission.js` - Added commission notifications

---

## Next Steps

1. **Generate VAPID Keys:** Create keys for push notifications
2. **Configure Environment:** Add VAPID keys to `.env`
3. **Test Notifications:** Use the manual testing guide above
4. **User Training:** Inform users about notification features
5. **Monitor Analytics:** Track notification engagement

---

## Support

For issues or questions about the notification system, check:
1. Browser console for errors
2. Firestore rules for permissions
3. Service Worker status in DevTools
4. Network tab for failed requests

---

*Last Updated: January 31, 2026*
*System: JONIX Sales Team Management Platform*
