import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  TrendingUp,
  Link as LinkIcon,
  Database,
  History,
  Mail,
  Zap
} from 'lucide-react';

const MODULES = [
  {
    key: 'onboarding',
    title: 'Client Onboarding Workflow',
    subtitle: 'Intake, brand assets, access checklist',
    description: 'Standardize handoff from sales to delivery with a structured intake, asset collection, and access verification flow.',
    tags: ['Intake', 'Brand Assets', 'Access'],
    kpis: [
      { label: 'Onboarding SLA', value: '5 days' },
      { label: 'Asset Completion', value: '92%' },
      { label: 'Access Verified', value: '100%' }
    ],
    workflow: [
      'Send intake form + scope recap',
      'Collect brand assets and guidelines',
      'Request platform access (ads, analytics, social)',
      'Confirm tracking + pixels',
      'Kickoff meeting + timeline approval'
    ],
    checklist: [
      'Logo pack + brand colors',
      'Tone of voice guidelines',
      'Access to ad accounts',
      'Analytics + Tag Manager',
      'Creative folder setup'
    ],
    automations: [
      'Auto-create onboarding tasks per client',
      'Slack/email reminder if access missing',
      'Trigger kickoff meeting when checklist is done'
    ],
    integrations: ['Google Drive', 'Dropbox', 'Notion', 'Slack', 'Calendly']
  },
  {
    key: 'campaign-briefs',
    title: 'Campaign Brief Builder',
    subtitle: 'Goals, audience, budget, channels, KPIs',
    description: 'Create consistent campaign briefs that align goals, target audience, budget allocation, and KPIs before launch.',
    tags: ['Briefs', 'Strategy', 'KPIs'],
    kpis: [
      { label: 'Brief Completion', value: '88%' },
      { label: 'Budget Clarity', value: '95%' },
      { label: 'KPIs Defined', value: '100%' }
    ],
    workflow: [
      'Define primary goal + KPI',
      'Lock audience and creative angle',
      'Set budget & channel mix',
      'Confirm timeline + milestones',
      'Approve launch checklist'
    ],
    checklist: [
      'Primary KPI + secondary KPI',
      'Target audience summary',
      'Creative direction notes',
      'Channel split + budget',
      'Success criteria'
    ],
    automations: [
      'Auto-generate brief template per campaign',
      'Notify approvers when brief is ready',
      'Sync brief to content calendar'
    ],
    integrations: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'LinkedIn Ads', 'GA4']
  },
  {
    key: 'approvals',
    title: 'Creative & Copy Approvals',
    subtitle: 'Client sign-off workflow',
    description: 'Move creatives and copy through staged approvals with clear owners, deadlines, and client feedback capture.',
    tags: ['Approvals', 'Creative', 'Client'],
    kpis: [
      { label: 'Approval Time', value: '3.2 days' },
      { label: 'Revision Cycles', value: '1.4 avg' },
      { label: 'On-time Approvals', value: '91%' }
    ],
    workflow: [
      'Draft creative + copy pack',
      'Internal QA review',
      'Client review + feedback',
      'Revise and finalize',
      'Approval lock + archive'
    ],
    checklist: [
      'Brand compliance check',
      'Copy proofread',
      'CTA verified',
      'Platform specs met',
      'Client approval logged'
    ],
    automations: [
      'Auto-assign reviewer on upload',
      'Client reminder after 48h',
      'Auto-publish to campaign queue when approved'
    ],
    integrations: ['Figma', 'Canva', 'Google Docs', 'Frame.io', 'Slack']
  },
  {
    key: 'content-calendar',
    title: 'Content Calendar',
    subtitle: 'Channel schedule tied to campaigns',
    description: 'Plan and schedule content by campaign, channel, and format to keep delivery consistent and on-brand.',
    tags: ['Calendar', 'Content', 'Scheduling'],
    kpis: [
      { label: 'Posts Scheduled', value: '42/mo' },
      { label: 'On-time Delivery', value: '96%' },
      { label: 'Channel Coverage', value: '5 channels' }
    ],
    workflow: [
      'Define campaign themes',
      'Assign content formats',
      'Schedule publish dates',
      'Route to approvals',
      'Track live performance'
    ],
    checklist: [
      'Channel mix approved',
      'Publishing cadence set',
      'Assets linked',
      'Copy finalized',
      'Owner assigned'
    ],
    automations: [
      'Auto-populate calendar from briefs',
      'Publish reminders 24h before go-live',
      'Auto-log posts to performance dashboard'
    ],
    integrations: ['Notion', 'Google Calendar', 'Buffer', 'Asana', 'Trello']
  },
  {
    key: 'asset-library',
    title: 'Asset Library',
    subtitle: 'Logos, brand guides, past creatives',
    description: 'Centralize brand assets, creative history, and approved templates so teams never start from scratch.',
    tags: ['Assets', 'Brand', 'Templates'],
    kpis: [
      { label: 'Assets Stored', value: '1,240' },
      { label: 'Reuse Rate', value: '63%' },
      { label: 'Brand Compliance', value: '98%' }
    ],
    workflow: [
      'Upload brand assets',
      'Tag by campaign + channel',
      'Version control for creatives',
      'Archive approved assets',
      'Search by tag or client'
    ],
    checklist: [
      'Brand guide uploaded',
      'Logo files (SVG/PNG)',
      'Color and font tokens',
      'Approved templates',
      'Usage rights logged'
    ],
    automations: [
      'Auto-tag assets by campaign',
      'Notify when assets expire',
      'Sync approved assets to templates'
    ],
    integrations: ['Google Drive', 'Dropbox', 'Adobe CC', 'Figma', 'Notion']
  },
  {
    key: 'performance-dashboard',
    title: 'Campaign Performance Dashboard',
    subtitle: 'ROI, CPL, CAC, CTR',
    description: 'Live performance tracking across channels with KPI trends, spend, and ROI signals.',
    tags: ['Performance', 'Analytics', 'ROI'],
    kpis: [
      { label: 'ROI', value: '3.2x' },
      { label: 'CPL', value: '$18.40' },
      { label: 'CTR', value: '2.7%' }
    ],
    workflow: [
      'Connect ad platforms',
      'Normalize KPI definitions',
      'Track weekly performance',
      'Flag anomalies',
      'Generate insights'
    ],
    checklist: [
      'Spend tracking verified',
      'Conversion events mapped',
      'Attribution window set',
      'KPI targets loaded',
      'Alerts configured'
    ],
    automations: [
      'Daily KPI refresh',
      'Automatic anomaly alerts',
      'Weekly insights report'
    ],
    integrations: ['GA4', 'Google Ads', 'Meta Ads', 'LinkedIn Ads', 'HubSpot']
  },
  {
    key: 'utm-builder',
    title: 'UTM Builder + Tracking',
    subtitle: 'Source attribution and naming rules',
    description: 'Standardize UTM generation with naming conventions so attribution remains clean and consistent.',
    tags: ['UTM', 'Attribution', 'Tracking'],
    kpis: [
      { label: 'Tagged Links', value: '620' },
      { label: 'Attribution Accuracy', value: '97%' },
      { label: 'Campaign Coverage', value: '100%' }
    ],
    workflow: [
      'Select campaign + channel',
      'Generate UTM parameters',
      'Validate naming rules',
      'Publish to campaign assets',
      'Track performance'
    ],
    checklist: [
      'Naming convention applied',
      'Medium + source aligned',
      'Landing page validated',
      'Short link generated',
      'Link logged'
    ],
    automations: [
      'Auto-fill parameters from brief',
      'Block invalid UTMs',
      'Sync UTMs to reporting'
    ],
    integrations: ['GA4', 'Looker Studio', 'Google Sheets', 'Bitly', 'HubSpot']
  },
  {
    key: 'reporting',
    title: 'Reporting Automation',
    subtitle: 'Weekly & monthly reports',
    description: 'Auto-generate client reports with KPIs, insights, and next steps — delivered on schedule.',
    tags: ['Reports', 'Automation', 'Insights'],
    kpis: [
      { label: 'Reports Sent', value: '28/mo' },
      { label: 'On-time Delivery', value: '99%' },
      { label: 'Insight Coverage', value: '94%' }
    ],
    workflow: [
      'Compile KPI data',
      'Generate insight summary',
      'Review and approve report',
      'Deliver to client',
      'Log feedback'
    ],
    checklist: [
      'Metrics refreshed',
      'Insights approved',
      'Next steps listed',
      'Report archived',
      'Client feedback captured'
    ],
    automations: [
      'Auto-generate PDF reports',
      'Send email/portal updates',
      'Create follow-up tasks'
    ],
    integrations: ['Looker Studio', 'Google Slides', 'Slack', 'Email', 'Notion']
  },
  {
    key: 'kpi-scorecard',
    title: 'Client KPI Scorecard',
    subtitle: 'Targets vs results',
    description: 'Visual scorecard with targets, actuals, and trend signals for fast client status checks.',
    tags: ['KPIs', 'Scorecard', 'Targets'],
    kpis: [
      { label: 'Targets Hit', value: '74%' },
      { label: 'Growth QoQ', value: '+18%' },
      { label: 'At-Risk KPIs', value: '2' }
    ],
    workflow: [
      'Set KPI targets',
      'Sync performance data',
      'Score status per KPI',
      'Highlight risk areas',
      'Recommend next actions'
    ],
    checklist: [
      'Targets confirmed',
      'Trend history loaded',
      'Red/amber/green rules set',
      'Actions assigned',
      'Client view updated'
    ],
    automations: [
      'Auto-update scorecard daily',
      'Trigger alerts for red KPIs',
      'Attach scorecard to reports'
    ],
    integrations: ['GA4', 'HubSpot', 'Meta Ads', 'Google Ads', 'Looker Studio']
  },
  {
    key: 'client-portal',
    title: 'Client Portal View',
    subtitle: 'Status, deliverables, approvals',
    description: 'Give clients a polished view of progress, deliverables, approvals, and reports.',
    tags: ['Client Portal', 'Deliverables', 'Status'],
    kpis: [
      { label: 'Portal Engagement', value: '68%' },
      { label: 'Open Approvals', value: '4' },
      { label: 'Active Deliverables', value: '12' }
    ],
    workflow: [
      'Publish deliverables',
      'Update status timeline',
      'Collect approvals',
      'Share reports',
      'Capture feedback'
    ],
    checklist: [
      'Deliverables grouped',
      'Approval links live',
      'Status updated',
      'Report uploaded',
      'Client notes captured'
    ],
    automations: [
      'Notify clients on updates',
      'Auto-archive approved items',
      'Weekly portal digest'
    ],
    integrations: ['Slack Connect', 'Email', 'Google Drive', 'Notion', 'Calendly']
  },
  {
    key: 'change-requests',
    title: 'Change Request Workflow',
    subtitle: 'Scope updates and extra cost',
    description: 'Track scope changes, estimate impact, and get approvals without losing margin.',
    tags: ['Scope', 'Approvals', 'Pricing'],
    kpis: [
      { label: 'Requests Approved', value: '82%' },
      { label: 'Avg. TAT', value: '2.1 days' },
      { label: 'Margin Saved', value: '+11%' }
    ],
    workflow: [
      'Submit change request',
      'Estimate impact + cost',
      'Client approval',
      'Update timeline',
      'Log in contract addendum'
    ],
    checklist: [
      'Scope clarified',
      'Cost calculated',
      'Timeline impact',
      'Approval recorded',
      'Delivery plan updated'
    ],
    automations: [
      'Auto-generate change request form',
      'Approval reminders',
      'Sync to invoicing'
    ],
    integrations: ['Asana', 'Jira', 'Google Docs', 'Email', 'Slack']
  },
  {
    key: 'meeting-notes',
    title: 'Meeting Notes & Action Items',
    subtitle: 'Notes, decisions, and next steps',
    description: 'Capture meeting outcomes, assign owners, and keep action items visible to the team and client.',
    tags: ['Meetings', 'Actions', 'Account'],
    kpis: [
      { label: 'Actions Completed', value: '87%' },
      { label: 'Notes Logged', value: '54/mo' },
      { label: 'Decision Clarity', value: '93%' }
    ],
    workflow: [
      'Log meeting notes',
      'Capture decisions',
      'Assign action items',
      'Set due dates',
      'Follow up'
    ],
    checklist: [
      'Agenda captured',
      'Key decisions logged',
      'Actions assigned',
      'Next meeting scheduled',
      'Client summary sent'
    ],
    automations: [
      'Auto-create tasks from notes',
      'Send follow-up summary email',
      'Sync action items to tasks board'
    ],
    integrations: ['Google Meet', 'Zoom', 'Notion', 'Asana', 'Slack']
  }
];

const ModuleCard = ({ module }) => (
  <Link
    to={`/digital-marketing/${module.key}`}
    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Digital Marketing</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{module.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{module.subtitle}</p>
      </div>
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center">
        <ArrowRight className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {module.tags.map(tag => (
        <span key={tag} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          {tag}
        </span>
      ))}
    </div>
  </Link>
);

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
    <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    </div>
    <div className="mt-4 text-sm text-slate-600">{children}</div>
  </div>
);

const IntegrationChip = ({ name }) => (
  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
    <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
    {name}
  </div>
);

export default function DigitalMarketingPage() {
  const { pageKey } = useParams();

  const module = useMemo(() => MODULES.find(item => item.key === pageKey), [pageKey]);

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Digital Marketing</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Agency Operations Studio</h1>
                <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                  A structured set of tools for onboarding, campaign planning, approvals, reporting, and client success.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
                <Zap className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-300">Admin only</p>
                  <p className="text-sm font-semibold">Full visibility</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {MODULES.map(moduleItem => (
              <ModuleCard key={moduleItem.key} module={moduleItem} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Digital Marketing</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{module.title}</h1>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">{module.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {module.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-300">Status</p>
                <p className="text-sm font-semibold">Ready for setup</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {module.kpis.map(item => (
            <StatCard key={item.label} label={item.label} value={item.value} />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Workflow" icon={Calendar}>
            <ol className="space-y-3">
              {module.workflow.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Checklist" icon={CheckCircle2}>
            <ul className="space-y-2">
              {module.checklist.map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Automations" icon={Zap}>
            <ul className="space-y-2">
              {module.automations.map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-900" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Integrations" icon={LinkIcon}>
            <div className="flex flex-wrap gap-2">
              {module.integrations.map(item => (
                <IntegrationChip key={item} name={item} />
              ))}
            </div>
          </Section>
        </div>

        <Section title="Deliverables" icon={FileText}>
          <div className="grid gap-3 md:grid-cols-2">
            {module.checklist.slice(0, 4).map(item => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {item}
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
              Add your custom deliverables here.
            </div>
          </div>
        </Section>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Next step</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Customize this module for your team</h3>
              <p className="text-sm text-slate-500">Adjust workflows, integrations, and templates to match your agency playbook.</p>
            </div>
            <Link
              to="/digital-marketing"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to overview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export const digitalMarketingNavItems = [
  { label: 'Onboarding', path: '/digital-marketing/onboarding', icon: Users },
  { label: 'Campaign Briefs', path: '/digital-marketing/campaign-briefs', icon: FileText },
  { label: 'Approvals', path: '/digital-marketing/approvals', icon: CheckCircle2 },
  { label: 'Content Calendar', path: '/digital-marketing/content-calendar', icon: Calendar },
  { label: 'Asset Library', path: '/digital-marketing/asset-library', icon: Database },
  { label: 'Performance', path: '/digital-marketing/performance-dashboard', icon: BarChart3 },
  { label: 'UTM Builder', path: '/digital-marketing/utm-builder', icon: LinkIcon },
  { label: 'Reporting', path: '/digital-marketing/reporting', icon: Mail },
  { label: 'KPI Scorecard', path: '/digital-marketing/kpi-scorecard', icon: TrendingUp },
  { label: 'Client Portal', path: '/digital-marketing/client-portal', icon: Users },
  { label: 'Change Requests', path: '/digital-marketing/change-requests', icon: History },
  { label: 'Meeting Notes', path: '/digital-marketing/meeting-notes', icon: MessageSquare }
];

export const digitalMarketingIcons = {
  Users,
  FileText,
  CheckCircle2,
  Calendar,
  Database,
  BarChart3,
  LinkIcon,
  Mail,
  TrendingUp,
  History,
  MessageSquare
};
