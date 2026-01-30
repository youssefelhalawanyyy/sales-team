# Task Management & Performance System Documentation

## Overview
A comprehensive task management and performance tracking system has been added to your sales team application. This system enables:
- Task creation and assignment
- Task submission and approval workflows
- Performance tracking for team members
- Revenue and deal tracking
- Team leader control over their team members

## Features

### 1. Task Management System

#### Create Tasks (`/tasks/create`)
**Who can access:** Admin, Sales Manager, Team Leader

**Capabilities:**
- Create tasks with title, description, and deadline
- Assign tasks to specific team members
- Set priority level (Low, Medium, High, Urgent)
- Team leaders can only assign to their team members
- Admins and Sales Managers can assign to any user

**Task Workflow:**
1. **Pending** - Task created, waiting for assignee to start
2. **In Progress** - Assignee marks task as started
3. **Submitted** - Assignee submits work for review
4. **Approved** - Creator approves the submission
5. **Rejected** - Creator rejects and sets new deadline

#### View & Manage Tasks (`/tasks`)
**Who can access:** All authenticated users

**Tab 1: Assigned to Me**
- View all tasks assigned to you
- Mark as "In Progress"
- Submit work with detailed description
- Add notes and comments
- Track task status

**Tab 2: Created by Me** (Admin/Team Leader/Sales Manager)
- View all tasks you created
- Review submissions
- Approve or reject tasks
- Provide feedback with new deadlines
- Add notes for assignees

**Features:**
- Filter by status
- View task details and timeline
- Add notes throughout task lifecycle
- View submissions and feedback
- Export task reports

### 2. Performance & Analytics Page (`/admin/performance`)

**Who can access:** Admin, Team Leader

**Features:**
- Select team member to view performance
- Comprehensive performance dashboard

**Metrics Tracked:**

**Deals Performance:**
- Total deals handled
- Closed deals count
- Won deals count
- Deals with payment received
- Total revenue generated
- Payment received rate percentage

**Tasks Performance:**
- Total tasks assigned
- Approved/completed tasks
- Pending tasks
- Task completion rate (%)
- Progress visualization

**Deal Analysis:**
- List of all deals
- Filter by payment status
- Filter by deal status
- Individual deal details
- Payment tracking

**Export Functionality:**
- Generate performance report in text format
- Download as file with member name and date
- Includes all metrics and deal details

### 3. Access Control

#### Admin
- Create tasks for anyone
- View all tasks
- View performance of any team member
- Approve/reject all tasks
- Access to all features

#### Team Leader
- Create tasks only for their team members
- View tasks created/assigned to team
- View performance of their team members
- Approve/reject team's tasks
- Cannot see other teams' performance

#### Sales Manager
- Create tasks for any team member (like admin)
- View all tasks
- No performance viewing (only admins and team leaders)

#### Sales Member
- View and manage only their assigned tasks
- Submit work
- Add notes
- View task status
- View single Tasks page (no creation)

## User Interface

### Tasks Page
**Components:**
- Header with "Create Task" button (for eligible roles)
- Tab navigation (Assigned to Me / Created by Me)
- Status filter dropdown
- Task grid with:
  - Task title and status badge
  - Description preview
  - Deadline and notes count
  - Quick status indicator

### Task Detail Modal
- Full task information
- Complete notes section (scrollable)
- For assignees: submission form with "Submit Task" button
- For creators: submission review with Approve/Reject buttons
- For rejected tasks: show rejection reason
- Add notes functionality throughout

### Create Task Page
- Back navigation
- Form with fields:
  - Task Title (200 char limit)
  - Description (2000 char limit)
  - Assign To (filtered based on role)
  - Priority selector
  - Deadline picker (datetime)
- Validation for:
  - Required fields
  - Future deadline only
  - Valid team member selection
- Tips/help box with best practices

### Performance Page
**Layout:**
- Left sidebar: Team member selection list
- Right content: Performance metrics and charts

**Sections:**
- Member header with export button
- Deals Performance metrics grid
- Tasks Performance metrics with progress bar
- Deals list with filtering options

## Database Schema

### Tasks Collection

```javascript
{
  id: "taskId",
  title: "Task Title",
  description: "Detailed description",
  assignedTo: "userId of assignee",
  createdBy: "userId of creator",
  createdByEmail: "creator@email.com",
  creatorRole: "admin|team_leader|sales_manager",
  status: "pending|in_progress|submitted|approved|rejected",
  deadline: Timestamp,
  priority: "low|medium|high|urgent",
  notes: [
    {
      addedBy: "userId",
      addedByEmail: "user@email.com",
      text: "note text",
      addedAt: Timestamp
    }
  ],
  submissions: [
    {
      submittedBy: "userId",
      submittedByEmail: "user@email.com",
      submissionText: "detailed work description",
      attachments: [],
      submittedAt: Timestamp
    }
  ],
  rejectionReason: "reason if rejected",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Firestore Security Rules

**Read Access:**
- Users can read tasks assigned to them
- Users can read tasks they created
- Admins can read all tasks
- Team leaders can read tasks for their team members

**Create Access:**
- Admins, Sales Managers, Team Leaders only

**Update Access:**
- Task creator can update their own tasks
- Assigned user can submit/update status
- Admins can update any task

**Delete Access:**
- Task creator can delete
- Admins can delete

## Workflow Examples

### Admin Creating Task for Sales Member
1. Admin clicks "Create Task"
2. Fills in task details (title, description, deadline)
3. Selects sales member from "Assign To" dropdown
4. Sets priority
5. Clicks "Create Task"
6. Task appears in sales member's "Assigned to Me" tab
7. Sales member marks as "In Progress" when starting
8. Sales member submits work with description
9. Admin reviews in "Created by Me" tab
10. Admin approves (task complete) or rejects with feedback
11. If rejected, new deadline set automatically

### Team Leader Managing Team Tasks
1. Team leader creates task for their team member
2. Only sees their own team members in "Assign To"
3. Can view performance of their team members
4. Receives updates as tasks progress through workflow

### Sales Member Completing Task
1. Sees task in "Assigned to Me" tab
2. Reads task details and deadline
3. Marks as "In Progress" when starting work
4. Completes work and submits with description
5. Receives feedback from creator
6. If rejected, updates work and resubmits
7. Task marked as approved when complete

## Navigation Updates

### Admin Menu
```
Dashboard
JONIX Calculator
Sales (submenu with contacts, deals, visits, etc.)
Finance (submenu with finance, commissions, etc.)
Tasks & Performance (submenu with Tasks, Performance)
Information
Users
```

### Team Leader Menu
```
Dashboard
JONIX Calculator
Sales (submenu)
Tasks & Performance (submenu with Tasks, Performance)
Information
```

### Sales Member Menu
```
Dashboard
JONIX Calculator
Sales (submenu)
Tasks
Information
```

## File Structure

**New Files Created:**
```
src/
├── contexts/
│   └── TasksContext.js (Task management context and hooks)
├── pages/
│   ├── TasksPage.js (View and manage tasks)
│   ├── CreateTaskPage.js (Create new tasks)
│   └── PerformancePage.js (View performance analytics)
```

**Modified Files:**
```
src/
├── App.js (Added routes and TasksProvider wrapper)
├── components/
│   └── Navigation.js (Updated menu items)
firestore.rules (Updated security rules)
```

## Deployment Steps

1. **Deploy to Firebase:**
```bash
npm install @google-cloud/firestore (if not already installed)
firebase deploy --only firestore:rules
firebase deploy --only functions
```

2. **Update Firestore Rules:**
   - The updated firestore.rules file includes task-specific security rules
   - Deploy using: `firebase deploy --only firestore:rules`

3. **No database migration needed:**
   - Tasks collection is created automatically on first task creation
   - Firestore creates collections on-demand

## Best Practices

### For Admins/Team Leaders Creating Tasks
- Be specific and clear in descriptions
- Set realistic deadlines
- Include all necessary information and resources
- Specify expected format or deliverables
- Use priority levels appropriately

### For Task Assignees
- Read full task description carefully
- Ask for clarification if needed (via notes)
- Keep deadline in mind
- Provide detailed submissions
- Respond to feedback promptly if rejected

### For Performance Review
- Review task completion rates monthly
- Track revenue trends
- Monitor deal payment status
- Identify top performers
- Use performance data for motivation and support

## Troubleshooting

**Q: Can't create tasks?**
A: Check your role. Only Admin, Sales Manager, and Team Leader can create tasks.

**Q: Can't see team members to assign?**
A: Team leaders must have team members linked in the users collection. Admin can see all users except themselves.

**Q: Performance page shows no data?**
A: Select a team member from the left sidebar first. Ensure they have deals and tasks.

**Q: Task status not updating?**
A: Refresh the page or check Firestore rules are deployed correctly.

**Q: Can't access certain sections?**
A: Verify your user role in Firestore users collection.

## Future Enhancements

Potential improvements:
- Task templates for repeated tasks
- Bulk task creation
- Task dependencies
- Time tracking integration
- Email notifications for task updates
- Mobile app support
- Advanced reporting with charts
- Task attachment uploads
- Recurring tasks
- Task history and audit logs
- AI-powered task recommendations
