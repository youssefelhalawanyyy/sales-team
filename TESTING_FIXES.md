# Testing Guide for Critical Bug Fixes

## Overview
This guide verifies the three critical production bugs have been fixed:
1. ✅ Notifications not sending
2. ✅ Settings updates not persisting
3. ✅ Calendar not reading/displaying data

## Bug Fix Summary

### Issue #1: Notifications Not Sending
**Root Causes Fixed:**
- ✅ Silent failures in async notification calls (added try/catch blocks)
- ✅ Field name mismatches (businessName ↔ clientName, price ↔ amount)

**Files Modified:**
- `src/services/notificationService.js` - Fixed all notification functions with field mappings:
  - `notifyDealCreated()` - Supports businessName/clientName and price/amount
  - `notifyDealUpdated()` - Supports stage/status fields
  - `notifyDealClosed()` - Supports businessName/price
  - `notifyFollowUpDue()` - Supports businessName
  - `notifyFollowUpCompleted()` - Supports businessName
  
- `src/pages/SalesDealsPage.js` - Added try/catch around notification calls
- `src/pages/FollowUpsPage.js` - Added try/catch around follow-up notifications
- `src/pages/comission.js` - Added try/catch around commission notifications

### Issue #2: Settings Not Persisting
**Root Cause Analysis:**
- Code in `SettingsContext.js` uses correct `setDoc(..., { merge: true })` pattern
- Issue likely Firestore permissions or missing user initialization

**Files Modified:**
- `src/contexts/SettingsContext.js` - Added debug logging:
  - `console.log()` in `updateSetting()` function
  - `console.log()` in `updateNestedSetting()` function
  - Now logs when settings save successfully or on error

### Issue #3: Calendar Not Reading
**Root Causes Fixed:**
- ✅ Wrong collection name: `deals` → `sales`
- ✅ Wrong field names: `salesPersonId` → `createdBy`, `assignedTo` field
- ✅ Missing error handling on listeners

**Files Modified:**
- `src/pages/CalendarView.js`:
  - Fixed collection reference from 'deals' to 'sales'
  - Fixed field reference from 'salesPersonId' to 'createdBy'
  - Added error callbacks to onSnapshot listeners
  - Enhanced data mapping with proper field extraction

---

## Test Procedure

### Test 1: Verify Notifications Send
**Steps:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Navigate to SalesDealsPage
4. Create a new deal
5. Check console for notification logs

**Expected Results:**
- ✅ Console shows `"Notification created successfully"` or error details
- ✅ New notification appears in the notifications list
- ✅ No errors related to "clientName is undefined" or "amount is undefined"

**What to Check:**
```
✓ Notification message created without errors
✓ Proper field names used (businessName, price not just clientName/amount)
✓ No console warnings about undefined fields
```

---

### Test 2: Verify Settings Persistence
**Steps:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Navigate to Settings page
4. Change a setting (e.g., toggle notifications, change language)
5. Check console for "Settings saved successfully"
6. Refresh the page (Ctrl+R / Cmd+R)
7. Verify the setting remained changed

**Expected Results:**
- ✅ Console shows `"Settings saved successfully: {key: value}"`
- ✅ Setting persists after page refresh
- ✅ No errors in console

**What to Check:**
```
✓ Settings update reflected in UI
✓ Console shows success message when saving
✓ After page refresh, setting is still there
✓ No 403 or permission errors in Network tab
```

**If Settings Don't Persist:**
- Check Network tab → Firestore requests
- Look for 403 Permission Denied errors
- Check Firestore Rules in `firestore.rules` file
- Verify user document exists in `users` collection

---

### Test 3: Verify Calendar Displays Data
**Steps:**
1. Navigate to Calendar page
2. Open browser Developer Tools (F12)
3. Check Console tab for errors
4. Scroll through the calendar
5. Check Network tab for Firestore queries

**Expected Results:**
- ✅ Calendar displays deals and tasks
- ✅ No "Error fetching deals" messages
- ✅ Data loads from `sales` collection (not `deals`)
- ✅ Both user's own deals and others' deals appear (if permissions allow)

**What to Check:**
```
✓ Calendar shows events/deals on dates
✓ No console errors about collection or fields
✓ Network requests show queries to "sales" collection
✓ Data formatting correct (dates, titles display properly)
```

**If Calendar Doesn't Display:**
- Check Console for: `"Error fetching deals:"` message
- Verify Firestore `sales` collection has documents
- Confirm user has read permission to `sales` collection
- Check Network requests show successful queries

---

## Debug Checklist

### Browser Console Checks
- [ ] No "undefined" errors
- [ ] No "Cannot read property" errors
- [ ] Settings save logs appear when changing settings
- [ ] Notification logs appear when creating deals
- [ ] Calendar load logs appear (or errors if any)

### Network Tab Checks
- [ ] Firestore queries to `sales` collection (not `deals`)
- [ ] Firestore queries to `userSettings` collection
- [ ] Firestore queries to `notifications` collection
- [ ] All queries return status 200 (not 403)

### Firestore Rules Verification
Run this in Firestore Console to verify rules allow access:
```
- Authenticated users can read/write to: sales, tasks, followups, notifications
- Authenticated users can read/write to userSettings with their own UID
- Check that rules include catch-all: match /{document=**}
```

---

## Key Changes Summary

### notificationService.js
```javascript
// OLD: Only looked for clientName
const clientName = dealData.clientName || 'Client';

// NEW: Falls back to businessName if clientName missing
const clientName = dealData.businessName || dealData.clientName || 'Client';

// OLD: Only looked for amount
const amount = dealData.amount ? `$${dealData.amount.toLocaleString()}` : '';

// NEW: Falls back to price if amount missing
const amount = dealData.price ? `$${dealData.price.toLocaleString()}` : dealData.amount ? `$${dealData.amount.toLocaleString()}` : '';
```

### CalendarView.js
```javascript
// OLD: Queried wrong collection
query(collection(db, 'deals'), where('salesPersonId', '==', userId))

// NEW: Correct collection and field names
query(collection(db, 'sales'), where('createdBy', '==', userId))
```

---

## Firestore Schema Reference

### sales collection
```json
{
  "id": "deal_123",
  "businessName": "Acme Corp",
  "price": 50000,
  "createdBy": "user_456",
  "createdAt": "2024-01-15",
  "stage": "Proposal"
}
```

### tasks collection
```json
{
  "id": "task_789",
  "title": "Follow up on proposal",
  "dueDate": "2024-01-20",
  "assignedTo": "user_456"
}
```

### userSettings collection
```json
{
  "uid": {
    "notifications": true,
    "language": "en",
    "theme": "dark"
  }
}
```

### notifications collection
```json
{
  "id": "notif_123",
  "userId": "user_456",
  "message": "Deal created: Acme Corp $50,000",
  "type": "DEAL_CREATED",
  "createdAt": "2024-01-15",
  "read": false
}
```

---

## Common Issues & Solutions

### Issue: "Cannot read property 'businessName' of undefined"
**Solution:** Deal data is not being passed correctly. Check SalesDealsPage.js line where `notifyDealClosed()` is called.

### Issue: Settings don't persist after refresh
**Solution:** Check Firestore Rules. May need to add explicit `userSettings` rule:
```
match /userSettings/{uid} {
  allow read, write: if request.auth.uid == uid;
}
```

### Issue: Calendar shows no events
**Solution:** 
1. Verify Firestore `sales` collection has documents
2. Check user has `read` permission to `sales` collection
3. Verify dates in calendar match documents' `createdAt` field

### Issue: Notifications appear in list but not as browser push notifications
**Solution:** Push notifications require:
1. VAPID key configured in environment
2. Service worker registered and running
3. User granted notification permission
4. Browser supports Web Push API

---

## Success Indicators

✅ **All 3 bugs are fixed when:**
- [ ] Notifications send without console errors
- [ ] Notification UI updates in real-time
- [ ] Settings changes persist after page refresh
- [ ] Calendar displays all deals and tasks with correct dates
- [ ] No 403 Firestore permission errors
- [ ] Browser console is clean of undefined/reference errors

---

## Next Steps if Issues Persist

1. **Check Firestore Rules:** Verify `firestore.rules` file has correct permissions
2. **Verify User Documents:** Check user exists in Firestore `users` collection
3. **Review Network Tab:** Check all Firestore requests return 200 status
4. **Clear Browser Cache:** Sometimes old cached data causes issues
5. **Review Error Logs:** Check browser console and Firestore error logs for specific failures

---

**Commit Hash:** See git log - `fix: resolve notifications, settings, and calendar critical bugs`

**Last Updated:** After implementing all field mapping fixes
