# Task Management System - Quick Start Guide

## 🚀 Getting Started

### For Admins
1. **Create Tasks:** Navigate to `/tasks` → Click "Create Task"
   - Select any team member
   - Set deadline and priority
   - Team leaders can only assign to their team

2. **Review Tasks:** Go to `/tasks` → "Created by Me" tab
   - See all submissions
   - Approve or reject
   - Provide feedback

3. **View Performance:** Navigate to `/admin/performance`
   - Select team member
   - View deal and task metrics
   - Export reports

### For Team Leaders
1. **Assign Tasks:** `/tasks` → "Create Task"
   - Only your team members appear
   - Set priorities and deadlines

2. **Review Team:** `/tasks` → "Created by Me"
   - Manage your team's tasks

3. **Team Analytics:** `/admin/performance`
   - Only see your team's performance
   - Track deals and task completion

### For Sales Members
1. **View Tasks:** Navigate to `/tasks`
   - See "Assigned to Me" tab
   - "Created by Me" is hidden

2. **Complete Tasks:**
   - Mark as "In Progress" when starting
   - Submit work with details
   - Receive feedback and approval

## 📋 Task Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| **Pending** | Task just created | Mark as In Progress |
| **In Progress** | You're working on it | Submit work when done |
| **Submitted** | Waiting for review | Creator reviews submission |
| **Approved** | ✓ Complete! | No action needed |
| **Rejected** | Needs revision | Review feedback, resubmit |

## 🎯 Key Features

### Task Creation
- **Title** - What needs to be done
- **Description** - How to do it
- **Assigned To** - Who does it
- **Deadline** - When it's due
- **Priority** - Low/Medium/High/Urgent

### Task Review
- **View Submissions** - See what was submitted
- **Add Notes** - Comment throughout process
- **Approve** - Mark as complete
- **Reject & Redo** - Send back with feedback
- **New Deadline** - Set when rejecting

### Performance Tracking
- **Deal Metrics** - Total, closed, won, paid
- **Task Metrics** - Total, approved, pending
- **Revenue** - Total from paid deals
- **Completion Rate** - Task completion %

## 📊 Performance Page

1. **Select Member** (left sidebar)
2. **View Metrics** (center)
3. **Filter Deals** (by paid/unpaid status)
4. **Export Report** (download as text file)

## 🔒 Who Can Do What?

| Action | Admin | Team Leader | Sales Manager | Sales Member |
|--------|-------|-------------|---------------|--------------|
| Create Tasks | ✅ | ✅ (team only) | ✅ | ❌ |
| Assign Anyone | ✅ | ❌ | ✅ | ❌ |
| Submit Tasks | ✅ | ✅ | ✅ | ✅ |
| Approve Tasks | ✅ | ✅ (own) | ❌ | ❌ |
| View Performance | ✅ | ✅ (team only) | ❌ | ❌ |
| Export Reports | ✅ | ✅ (team only) | ❌ | ❌ |

## 🔗 Menu Navigation

**Admin/Team Leader:**
```
Dashboard → Tasks & Performance (submenu)
  ├─ Tasks
  └─ Performance
```

**Sales Member:**
```
Dashboard → Tasks
```

## 📱 Common Tasks

### Create a Task
```
/tasks/create → Fill form → Select assignee → Set deadline → Create
```

### Submit Your Work
```
/tasks → Click task → Enter submission → "Submit Task"
```

### Review a Submission
```
/tasks → "Created by Me" → Click task → Review submission → Approve or Reject
```

### Check Performance
```
/admin/performance → Select member → View metrics → Filter deals
```

### Export Performance Report
```
/admin/performance → Select member → "Export Report" button
```

## ⚡ Tips & Tricks

### Creating Effective Tasks
- ✓ Be specific and clear
- ✓ Include all needed information
- ✓ Set realistic deadlines
- ✓ Specify expected format

### Submitting Work
- ✓ Read full instructions
- ✓ Provide detailed work description
- ✓ Mention any challenges
- ✓ Ask for clarification via notes

### Reviewing Submissions
- ✓ Check all requirements met
- ✓ Provide constructive feedback
- ✓ Set clear new deadlines if rejecting
- ✓ Use notes for ongoing communication

## 🆘 Troubleshooting

**Q: Can't create tasks?**
A: Check your role - only Admin, Team Leader, and Sales Manager can create.

**Q: Team member not in "Assign To" list?**
A: Team leaders can only see their own team members.

**Q: Performance page empty?**
A: First select a team member from the left sidebar.

**Q: Can't see other people's tasks?**
A: You can only see tasks assigned to you or created by you.

**Q: Deadline shows wrong date?**
A: Set deadline to future date/time only.

## 📞 Need Help?

See **TASK_MANAGEMENT_GUIDE.md** for:
- Detailed feature documentation
- Workflow examples
- Database structure
- Security rules
- Complete troubleshooting guide

---

**Quick Links:**
- 📖 Full Guide: `TASK_MANAGEMENT_GUIDE.md`
- 📋 Implementation: `TASK_IMPLEMENTATION_SUMMARY.md`
- 🔧 Routes: `/tasks`, `/tasks/create`, `/admin/performance`
