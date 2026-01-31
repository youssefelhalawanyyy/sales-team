# 🗓️ Calendar Not Showing Events - FIX & DEBUGGING GUIDE

## 🎯 The Problem

"Calendar doesn't add anything when I try to add to it or when I add a task or anything doesn't show on calendar"

### Symptoms
- ✗ Created tasks don't appear on calendar
- ✗ New deals don't show on calendar  
- ✗ Follow-ups not visible on calendar
- ✗ Calendar appears empty

---

## 🔍 Root Causes Identified

### Issue 1: Calendar Queries Filter by User Assignment
**What happens:**
- Calendar only shows tasks assigned TO the current user (`assignedTo == currentUser.uid`)
- Calendar only shows deals created BY the current user (`createdBy == currentUser.uid`)
- If you create a task FOR another user, YOU won't see it on your calendar
- If another user creates a deal, you won't see it (unless you're admin)

**Solution:**
- Admin users see ALL deals
- Regular users see only their own deals
- All users see tasks assigned to them

### Issue 2: Date Fields Not Set Correctly
**What happens:**
- Tasks need `dueDate` field populated
- Deals need proper date field (`expectedCloseDate`, `createdAt`, or `closedDate`)
- If date fields are missing/null, events won't appear

**Solution:**
- Always set deadlines when creating tasks
- Ensure deals have date information

### Issue 3: Data Structure Mismatch
**What happens:**
- Calendar expects certain field names
- Newly created data might use different field names
- Events don't map correctly to calendar

**Solution:**
- Verified field names are correct in calendar queries
- Added detailed logging to identify mismatches

---

## 🧪 Step-by-Step Debugging Guide

### Step 1: Check Browser Console
1. Open your browser (Chrome, Firefox, Safari)
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for messages starting with:
   - `👤 Loading calendar for user:`
   - `📊 Admin: Loading ALL deals:` or `📊 User: Loading only user deals`
   - `✅ Loaded deals: [number]`
   - `✅ Loaded tasks: [number]`

**What to look for:**
```
✅ Loaded deals: 0  ← Problem! No deals found
✅ Loaded tasks: 0  ← Problem! No tasks found
```

### Step 2: Create Test Task
1. Log in as Admin or Manager
2. Go to **Tasks & Performance** → **Tasks**
3. Click **"Create Task"** button
4. Fill in:
   - Title: "Test Task"
   - Description: "Testing calendar"
   - Assigned To: Select YOUR name
   - Deadline: Pick tomorrow's date
   - Priority: Medium
5. Click **"Create"**

**Check console for:**
```
📢 Task created successfully
✅ Loaded tasks: 1  ← Should increase from 0 to 1
```

### Step 3: Check Calendar
1. Go to **Calendar**
2. Look at the calendar grid for dots/indicators
3. Check sidebar for events
4. Select today's date - should show new task

**Expected:**
- Green dot on calendar for task dates
- Event listed in sidebar under that date
- Event details showing task info

### Step 4: Create Test Deal
1. Go to **Sales** → **Contacts**
2. Click on any contact
3. Click **"Start Working"** to create a deal
4. Fill in deal details
5. Save

**Check console for:**
```
📊 Deal created
✅ Loaded deals: 1  ← Should increase
```

### Step 5: Verify Date Fields in Firestore
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Go to Firestore Database
3. Check `tasks` collection
4. Look for your test task document
5. Verify fields:
   - `assignedTo`: Should equal your user ID
   - `dueDate`: Should have a date timestamp
   - `title`: "Test Task"

**If missing:**
- ✗ `assignedTo` - Task assigned to wrong user
- ✗ `dueDate` - Task has no deadline

### Step 6: Check Queries Match Data
**For tasks to show:**
- Tasks must have: `assignedTo == currentUser.uid`
- Tasks must have: `dueDate` timestamp field

**For deals to show:**
- Regular users: Deals must have `createdBy == currentUser.uid`
- Admins: See ALL deals regardless

---

## 📋 Common Issues & Solutions

### Issue: "No tasks showing but I created them"

**Possible Causes:**
1. Task created BUT assigned to different user
2. You're looking at another user's calendar
3. Task has no deadline date

**Solution:**
- Create task and assign to yourself
- Verify in Firestore that `assignedTo` = your user ID
- Make sure `dueDate` is populated

### Issue: "Deals don't show on admin calendar"

**Possible Causes:**
1. Admin role not detected properly
2. Deals created by different user
3. Deal has no date field

**Solution:**
- Log out and back in to refresh role
- Check Firestore for `createdBy` field
- Ensure deal has a date (any of: `expectedCloseDate`, `createdAt`, `closedDate`)

### Issue: "See random events from other users"

**Possible Causes:**
1. Admin permissions showing all data (expected)
2. Task reassigned to you
3. Deal shared with you

**Solution:**
- This is expected for admins
- Check `assignedTo` field matches your ID
- Review deal details to understand assignment

### Issue: "Calendar loads but shows 'No events scheduled'"

**Possible Causes:**
1. No tasks/deals created yet
2. Tasks/deals don't match your filter
3. Listeners not connecting properly

**Solution:**
- Create your first task
- Check console for listener messages
- Refresh page if listeners didn't connect

---

## 🔧 Console Debugging Reference

### Good Console Output ✅
```
👤 Loading calendar for user: abc123def456
👔 User role: sales_member
📊 User: Loading only user deals (createdBy = abc123def456)
✅ Tasks: Loading assigned tasks (assignedTo = abc123def456)
✅ Loaded deals: 3
✅ Loaded tasks: 5
🔍 Looking for events on: [current date]
📋 Events found for selected date: 2
```

### Bad Console Output ❌
```
❌ No current user  ← Not logged in
❌ Error fetching deals: [error message]  ← Permission issue
✅ Loaded deals: 0  ← No data found
✅ Loaded tasks: 0  ← No data found
📋 Events found for selected date: 0  ← Calendar empty
```

---

## 📊 Data Structure Verification

### Tasks Should Look Like:
```json
{
  "title": "Test Task",
  "description": "Testing calendar",
  "assignedTo": "user-id-here",
  "dueDate": {timestamp},
  "status": "pending",
  "priority": "medium",
  "createdAt": {timestamp}
}
```

### Deals Should Look Like:
```json
{
  "businessName": "Company Name",
  "stage": "potential_client",
  "createdBy": "user-id-here",
  "createdAt": {timestamp},
  "expectedCloseDate": {timestamp},
  "amount": 5000
}
```

---

## 🚀 Testing Checklist

- [ ] Create a new task
- [ ] Assign task to yourself
- [ ] Set deadline for tomorrow
- [ ] Go to calendar
- [ ] Check console for "✅ Loaded tasks: 1"
- [ ] Verify task appears on calendar
- [ ] Click on task to see details
- [ ] Create a deal
- [ ] Go to calendar
- [ ] Check console for "✅ Loaded deals: [number]"
- [ ] Verify deal appears on calendar
- [ ] Check browser console has no errors
- [ ] Test with another user if possible

---

## 📝 Fixes Applied

### Commit: b530b83

**Changes Made:**
1. ✅ Added admin role check - admins now see ALL deals
2. ✅ Added detailed console logging
3. ✅ Fixed query variable declarations
4. ✅ Improved error messages

**What This Does:**
- Better visibility into why events aren't showing
- Console logs clearly show:
  - Which user is being queried
  - How many events were found
  - Any errors that occurred

---

## 💡 Tips for Success

### When Creating Tasks
1. ✅ Assign to yourself first (for testing)
2. ✅ Always set a deadline date
3. ✅ Set a priority level
4. ✅ Refresh calendar after creating
5. ✅ Check console for loading messages

### When Creating Deals
1. ✅ Enter business name
2. ✅ Set deal stage/status
3. ✅ Enter expected close date
4. ✅ Add amount if known
5. ✅ Refresh calendar to see update

### When Troubleshooting
1. ✅ Always open browser console (F12)
2. ✅ Check for error messages
3. ✅ Look for "✅ Loaded" confirmation
4. ✅ Verify Firestore data structure
5. ✅ Try refreshing the page
6. ✅ Log out and back in
7. ✅ Clear browser cache

---

## 📞 If Problems Persist

**Share this information:**
1. Screenshot of browser console (F12)
2. Type of data you created (task/deal/followup)
3. Expected date on calendar
4. User role (admin/sales_manager/sales_member/etc)
5. Exact error messages from console

**Check these files:**
- `src/pages/CalendarView.js` - Calendar page logic
- `src/contexts/TasksContext.js` - Task creation
- Firestore database - Actual stored data

---

**Last Updated**: After commit b530b83  
**Status**: ✅ Calendar queries improved and debugged  
**Next**: Test by creating tasks and checking console

---
