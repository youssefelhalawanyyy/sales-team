const BASE_STEPS = [
  {
    key: 'dashboard',
    title: 'Dashboard Overview',
    body: 'See your KPIs, recent activity, and quick actions in one place.',
    path: '/dashboard'
  },
  {
    key: 'contacts',
    title: 'Contacts & Leads',
    body: 'Capture and organize your contact list to start deals fast.',
    path: '/sales/contacts'
  },
  {
    key: 'deals',
    title: 'Deals Pipeline',
    body: 'Track deals across your custom stages and keep notes updated.',
    path: '/sales/deals'
  },
  {
    key: 'tasks',
    title: 'Tasks & Follow-ups',
    body: 'Stay on top of follow-ups and tasks assigned to you.',
    path: '/tasks'
  },
  {
    key: 'calendar',
    title: 'Calendar View',
    body: 'See visits, tasks, and follow-ups on a single calendar.',
    path: '/calendar'
  }
];

const ADMIN_STEPS = [
  {
    key: 'pipeline',
    title: 'Pipeline Settings',
    body: 'Customize stages and required fields for your sales process.',
    path: '/admin/pipeline'
  },
  {
    key: 'finance',
    title: 'Finance & Commissions',
    body: 'Track income, expenses, and commissions from closed deals.',
    path: '/finance'
  }
];

export function getTourSteps(userRole) {
  if (userRole === 'admin' || userRole === 'sales_manager') {
    return [...BASE_STEPS, ...ADMIN_STEPS];
  }
  return BASE_STEPS;
}
