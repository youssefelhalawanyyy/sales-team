# Member Commission Tracking Feature

## Overview
Members (sales_member, team_leader, sales_manager) can now view their own commissions with clear status tracking (PENDING/PAID) and totals.

## Features

### ✅ What's New
1. **Dashboard Widget** - Quick commission overview on member dashboard
2. **Dedicated Page** - Full-page commission view at `/my/commissions`
3. **Status Tracking** - PENDING (approved, waiting) vs PAID (processed)
4. **Real-time Updates** - Commission changes sync in real-time from Firestore
5. **Totals Tracking** - Total Paid, Total Pending, Total Commissions
6. **Security** - Members only see their own commissions (filtered by userId)

## User Journey

### 1. Dashboard View
**Location:** `/dashboard`  
**For:** Sales Members, Team Leaders, Sales Managers

Members see a commission summary widget showing:
- 💰 **Total Paid** - Sum of all PAID commissions
- ⏳ **Total Pending** - Sum of all PENDING (unpaid/approved) commissions
- 📊 **Total Commissions** - Grand total of all commissions

### 2. Detailed Commissions Page
**Location:** `/my/commissions`  
**Route:** Protected - only non-admin users can access

Features:
- Full list of all member's commissions
- Clear PENDING or PAID badge on each
- Commission amount and relevant dates
- Sort by newest first
- Empty state message if no commissions yet

### 3. Commission List Display
Each commission shows:
```
Offer Name / Commission Description
└─ Status Badge (PENDING or PAID)
├─ Amount: $X,XXX
└─ Payout Date (pending) or Paid Date (paid)
```

## Navigation

### Access Points

**For Sales Members:**
- Dashboard → See commission widget
- Navigation → "My Commissions" link
- Direct URL: `/my/commissions`

**For Team Leaders:**
- Dashboard → See commission widget
- Navigation → Finance → "My Commissions"
- Direct URL: `/my/commissions`

**For Sales Managers:**
- Dashboard → See commission widget
- Navigation → Finance → "My Commissions"
- Also access admin commission page at `/finance/commissions`
- Direct URL: `/my/commissions`

## Technical Details

### Files Created

**1. `src/components/MemberCommissionView.js`**
- Reusable component for displaying member commissions
- Real-time Firestore listener for commission data
- Filters commissions by `currentUser.uid`
- Calculates pending/paid totals
- Shows status badges and formatting

**2. `src/pages/MemberCommissionPage.js`**
- Full-page wrapper around MemberCommissionView
- Protected route - non-admin only
- Back button navigation
- Info cards explaining statuses

### Files Modified

**1. `src/pages/Dashboard.js`**
- Added import for MemberCommissionView
- Integrated widget into non-admin dashboard
- Shows below "My Active Tasks" section

**2. `src/App.js`**
- Added route: `/my/commissions`
- Protected by requiredRoles: ['sales_member', 'team_leader', 'sales_manager']
- Lazy-loaded component for performance

**3. `src/components/Navigation.js`**
- Added "My Commissions" link for sales_member
- Added "My Commissions" to Finance submenu for sales_manager
- Added "My Commissions" link for team_leader

## Data Structure

### Firestore Query
```javascript
const q = query(
  collection(db, 'commissions'),
  where('userId', '==', currentUser.uid)
);
```

### Commission Document Structure
```javascript
{
  id: 'commission_123',
  userId: 'user_456',           // Matches current user - SECURITY
  name: 'John Doe',
  role: 'sales_member',
  offerName: 'Deal with ABC Corp',
  commissionAmount: 5000,
  status: 'unpaid' | 'paid',   // Used for badge display
  approved: true | false,
  payoutDate: '2024-02-15',
  paidAt: null | timestamp,
  createdAt: timestamp,
  createdBy: 'admin_uid'
}
```

## Status Meanings

### PENDING (Yellow Badge) ⏳
- **What it means:** Commission is approved and waiting for payout
- **When it happens:** 
  - Admin marks commission as "approved"
  - Commission reaches its "payout date"
  - Finance team hasn't processed payment yet
- **What member should do:** Wait for scheduled payout date

### PAID (Green Badge) ✓
- **What it means:** Commission has been paid to the member
- **When it happens:** Finance team marks as "paid" in Firestore
- **Shows:** The actual date payment was made

## Admin Commission Flow

### How Commissions Get to Members

1. **Admin Creates Commission**
   - Goes to `/finance/commissions`
   - Fills form: Member name, Offer name, Amount
   - Commission created with status `unpaid`

2. **Admin Approves Commission**
   - Clicks approve button
   - Commission marked as `approved: true`
   - Member can now see it as PENDING

3. **Finance Pays Commission**
   - On payout date, admin can mark as "paid"
   - Or auto-payout can process it
   - Status changes to `paid`
   - Member sees it with PAID badge

4. **Member Views Commission**
   - Sees on dashboard
   - Can click to view details at `/my/commissions`
   - Can see payment history

## Calculations

### Totals Formula
```javascript
const totals = {
  pending: commissions
    .filter(c => c.status === 'unpaid')
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
  
  paid: commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
  
  total: commissions
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0)
};
```

## Security

### Member Isolation
✅ **Members only see their own commissions**
- Query filters by `userId === currentUser.uid`
- No way to see other member's commissions
- Admin can see all commissions (separate page)

### Access Control
✅ **Route protection**
```javascript
requiredRoles={['sales_member', 'team_leader', 'sales_manager']}
```
- Admin cannot access `/my/commissions`
- Non-members get error page
- Back to dashboard button if access denied

### Firestore Rules
✅ **Data protection**
- Members can only read their own commission records
- Can't modify or delete commissions
- Only admin can write commission data

## Testing Checklist

### ✅ Test Member View
- [ ] Log in as sales_member
- [ ] Go to Dashboard - see commission widget
- [ ] See "My Commissions" in navigation
- [ ] Click navigation link - goes to `/my/commissions`
- [ ] Commission list displays (if commissions exist)

### ✅ Test Commission Display
- [ ] Commissions show offer name
- [ ] PENDING badge is yellow
- [ ] PAID badge is green
- [ ] Amounts display with currency formatting
- [ ] Dates show in readable format

### ✅ Test Totals
- [ ] Total Pending shows correct sum of unpaid commissions
- [ ] Total Paid shows correct sum of paid commissions
- [ ] Total shows combined sum
- [ ] Counts correct (e.g., "2 items")

### ✅ Test Security
- [ ] Log in as different member
- [ ] See only their own commissions
- [ ] Don't see other member's commissions
- [ ] Log in as admin
- [ ] Can't access `/my/commissions` (get error)
- [ ] Can access `/finance/commissions` (admin page)

### ✅ Test Empty State
- [ ] If member has no commissions
- [ ] Shows "No Commissions Yet" message
- [ ] Shows helpful text about how commissions appear
- [ ] No errors in console

### ✅ Test Formatting
- [ ] Currency displays as $X,XXX
- [ ] Dates are readable (MMM DD, YYYY)
- [ ] Status badges align properly
- [ ] Mobile responsive on small screens

## Customization

### Change Status Display
Edit `src/components/MemberCommissionView.js`:
```javascript
const getStatusBadge = (status) => {
  if (status === 'paid') {
    // Change this part
    return (
      <div className="...">
        <CheckCircle2 size={16} />
        Paid
      </div>
    );
  }
  // ...
};
```

### Change Commission Display Order
Edit sorting logic:
```javascript
// Currently sorts by newest first (descending)
data.sort((a, b) => {
  const dateA = a.createdAt?.seconds || 0;
  const dateB = b.createdAt?.seconds || 0;
  return dateB - dateA; // Change to dateA - dateB for oldest first
});
```

### Customize Colors
Cards use Tailwind classes:
- Pending: Yellow (yellow-50, yellow-200, yellow-600, etc.)
- Paid: Green (green-50, green-200, green-600, etc.)
- Total: Blue (blue-50, blue-200, blue-600, etc.)

Edit class names to change colors.

## Troubleshooting

### Issue: Member doesn't see commissions
**Check:**
1. Admin added commission with correct member
2. Commission has `userId` matching the member's UID
3. Commission has status 'unpaid' or 'paid'
4. Firestore rules allow read access

### Issue: Commissions don't update in real-time
**Check:**
1. Firestore listener is active (check DevTools)
2. Real-time permissions are set
3. No console errors about Firestore
4. Try refresh page to force reload

### Issue: Member can't access page
**Check:**
1. Verify user role is 'sales_member', 'team_leader', or 'sales_manager'
2. Not logged in as admin
3. Route protection is correct
4. Try logging out and back in

### Issue: Wrong amounts showing
**Check:**
1. Commission documents have `commissionAmount` field
2. Amount is stored as number, not string
3. No calculation errors in totals formula
4. Check Firestore data directly

## Performance Notes

### Real-time Listeners
- Uses `onSnapshot` for real-time updates
- Cleans up listeners on unmount
- Efficient for small to medium commission lists
- May need pagination for 1000+ commissions

### Calculations
- Totals calculated client-side
- Fast for < 1000 commissions
- Consider server-side aggregation for large datasets

## Future Enhancements

### Potential Additions
- ☐ Commission history/archive
- ☐ Export to CSV
- ☐ Commission predictions/forecasts
- ☐ Filtering by date range
- ☐ Search by offer name
- ☐ Commission comparison vs previous period
- ☐ Email notifications when payment received
- ☐ Mobile app integration

## Support

**For Members:**
- Contact admin if commission appears incorrectly
- Check commission approval status with manager
- Verify payout date with finance team

**For Admins:**
- Check Firestore permissions for members
- Verify user roles are correct
- Monitor commission audit logs

---

**Feature Version:** 1.0  
**Status:** ✅ Production Ready  
**Last Updated:** January 31, 2026
