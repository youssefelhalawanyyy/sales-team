import React, { useMemo, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../../firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
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
  Zap,
  LayoutGrid,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Search,
  Plus,
  Sun,
  Moon,
  CheckSquare
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

const COLLECTION_BY_KEY = {
  onboarding: 'dm_onboarding',
  'campaign-briefs': 'dm_campaign_briefs',
  approvals: 'dm_approvals',
  'content-calendar': 'dm_content_calendar',
  'asset-library': 'dm_asset_library',
  'performance-dashboard': 'dm_performance_dashboard',
  'utm-builder': 'dm_utm_builder',
  reporting: 'dm_reporting',
  'kpi-scorecard': 'dm_kpi_scorecard',
  'client-portal': 'dm_client_portal',
  'change-requests': 'dm_change_requests',
  'meeting-notes': 'dm_meeting_notes'
};

const MODULE_ICONS = {
  onboarding: Users,
  'campaign-briefs': FileText,
  approvals: CheckCircle2,
  'content-calendar': Calendar,
  'asset-library': Database,
  'performance-dashboard': BarChart3,
  'utm-builder': LinkIcon,
  reporting: Mail,
  'kpi-scorecard': TrendingUp,
  'client-portal': Users,
  'change-requests': History,
  'meeting-notes': MessageSquare
};

const FIELD_DEFS = {
  onboarding: [
    { name: 'clientName', label: 'Company Name', type: 'text', placeholder: 'Client/company name' },
    { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., SaaS, Retail' },
    { name: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'Primary contact' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'name@company.com' },
    { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 555 000 0000' },
    { name: 'contractStartDate', label: 'Contract Start Date', type: 'date' },
    { name: 'budget', label: 'Budget', type: 'number', placeholder: 'Monthly budget' },
    { name: 'goals', label: 'Goals', type: 'textarea', placeholder: 'Primary goals' },
    { name: 'targetAudience', label: 'Target Audience', type: 'textarea', placeholder: 'Who we are targeting' },
    { name: 'platforms', label: 'Platforms', type: 'text', placeholder: 'Meta, Google, TikTok' },
    { name: 'brandAssetsUrl', label: 'Brand Assets Link', type: 'url', placeholder: 'Drive/Dropbox link' },
    { name: 'contractDocsUrl', label: 'Contract Documents', type: 'url', placeholder: 'Contract link' },
    { name: 'owner', label: 'Account Manager', type: 'text', placeholder: 'Assigned owner' },
    { name: 'status', label: 'Status', type: 'select', options: ['pending', 'active', 'completed'] },
    { name: 'progress', label: 'Progress %', type: 'number', placeholder: '0 - 100' },
    { name: 'month', label: 'Monthly Plan', type: 'text', placeholder: 'e.g., Sep 2024' },
    { name: 'checklist', label: 'Onboarding Checklist', type: 'textarea', placeholder: 'One item per line' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Extra context' }
  ],
  'campaign-briefs': [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'campaignName', label: 'Campaign Name', type: 'text', placeholder: 'Campaign name' },
    { name: 'objective', label: 'Objective', type: 'text', placeholder: 'Primary objective' },
    { name: 'budget', label: 'Budget', type: 'number', placeholder: 'Budget' },
    { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., 6 weeks' },
    { name: 'audience', label: 'Target Audience', type: 'textarea', placeholder: 'Audience definition' },
    { name: 'platforms', label: 'Platforms', type: 'text', placeholder: 'Meta, Google, TikTok...' },
    { name: 'creativeConcept', label: 'Creative Concept', type: 'textarea', placeholder: 'Core creative direction' },
    { name: 'kpiTargets', label: 'KPI Targets', type: 'text', placeholder: 'CTR, CPL, ROAS...' },
    { name: 'startDate', label: 'Start Date', type: 'date' },
    { name: 'endDate', label: 'End Date', type: 'date' },
    { name: 'version', label: 'Version', type: 'text', placeholder: 'v1.0' },
    { name: 'approvalStatus', label: 'Approval Status', type: 'select', options: ['draft', 'pending', 'approved', 'live', 'completed'] },
    { name: 'status', label: 'Status Tag', type: 'select', options: ['draft', 'pending_approval', 'approved', 'live', 'completed'] },
    { name: 'attachments', label: 'Creative Files Link', type: 'url', placeholder: 'Drive/Dropbox link' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Constraints, notes, approvals' }
  ],
  approvals: [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'campaignName', label: 'Campaign', type: 'text', placeholder: 'Campaign name' },
    { name: 'assetName', label: 'Asset Name', type: 'text', placeholder: 'Creative title' },
    { name: 'assetType', label: 'Asset Type', type: 'select', options: ['creative', 'copy', 'landing page', 'video', 'email', 'ad set'] },
    { name: 'reviewer', label: 'Reviewer', type: 'text', placeholder: 'Reviewer' },
    { name: 'requestedBy', label: 'Requested By', type: 'text', placeholder: 'Requester' },
    { name: 'status', label: 'Status', type: 'select', options: ['pending', 'in_review', 'approved', 'rejected', 'revisions'] },
    { name: 'dueDate', label: 'Due Date', type: 'date' },
    { name: 'assetLink', label: 'Asset Link', type: 'url', placeholder: 'Preview link' },
    { name: 'decisionNotes', label: 'Approval Comment', type: 'textarea', placeholder: 'Approve/reject comments' },
    { name: 'feedback', label: 'Feedback Log', type: 'textarea', placeholder: 'Client feedback log' }
  ],
  'content-calendar': [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'campaignName', label: 'Campaign', type: 'text', placeholder: 'Campaign name' },
    { name: 'platform', label: 'Platform', type: 'select', options: ['Meta', 'Google Ads', 'TikTok', 'LinkedIn', 'Email', 'Blog', 'Other'] },
    { name: 'channel', label: 'Channel', type: 'text', placeholder: 'Channel' },
    { name: 'publishDate', label: 'Publish Date', type: 'date' },
    { name: 'publishTime', label: 'Publish Time', type: 'time' },
    { name: 'caption', label: 'Caption', type: 'textarea', placeholder: 'Post caption' },
    { name: 'hashtags', label: 'Hashtags', type: 'text', placeholder: '#brand #campaign' },
    { name: 'cta', label: 'CTA', type: 'text', placeholder: 'Call to action' },
    { name: 'creativeUrl', label: 'Creative Preview', type: 'url', placeholder: 'Preview link' },
    { name: 'deliverable', label: 'Deliverable', type: 'text', placeholder: 'Asset or post' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'scheduled', 'posted', 'paused'] },
    { name: 'recurring', label: 'Recurring', type: 'select', options: ['none', 'weekly', 'biweekly', 'monthly'] },
    { name: 'owner', label: 'Owner', type: 'text', placeholder: 'Owner' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Details, links, or notes' }
  ],
  'asset-library': [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'campaignName', label: 'Campaign', type: 'text', placeholder: 'Campaign name' },
    { name: 'month', label: 'Month', type: 'text', placeholder: 'e.g., Sep 2024' },
    { name: 'folderPath', label: 'Folder', type: 'text', placeholder: '/Client/Campaign/Month' },
    { name: 'assetName', label: 'Asset Name', type: 'text', placeholder: 'Asset name' },
    { name: 'assetType', label: 'Asset Type', type: 'select', options: ['logo', 'brand guide', 'template', 'creative', 'video', 'copy', 'pdf'] },
    { name: 'fileUrl', label: 'File URL', type: 'url', placeholder: 'https://...' },
    { name: 'previewUrl', label: 'Preview URL', type: 'url', placeholder: 'https://...' },
    { name: 'version', label: 'Version', type: 'text', placeholder: 'v1.0' },
    { name: 'tags', label: 'Tags', type: 'text', placeholder: 'Brand, campaign, channel' },
    { name: 'status', label: 'Status', type: 'select', options: ['approved', 'draft', 'archived'] },
    { name: 'owner', label: 'Owner', type: 'text', placeholder: 'Owner' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Usage rights or notes' }
  ],
  'performance-dashboard': [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'campaignName', label: 'Campaign', type: 'text', placeholder: 'Campaign name' },
    { name: 'period', label: 'Period', type: 'text', placeholder: 'e.g., Sep 2024' },
    { name: 'impressions', label: 'Impressions', type: 'number', placeholder: 'Impressions' },
    { name: 'reach', label: 'Reach', type: 'number', placeholder: 'Reach' },
    { name: 'ctr', label: 'CTR', type: 'number', placeholder: 'CTR' },
    { name: 'cpc', label: 'CPC', type: 'number', placeholder: 'CPC' },
    { name: 'cpa', label: 'CPA', type: 'number', placeholder: 'CPA' },
    { name: 'roas', label: 'ROAS', type: 'number', placeholder: 'ROAS' },
    { name: 'conversions', label: 'Conversions', type: 'number', placeholder: 'Conversions' },
    { name: 'spend', label: 'Spend', type: 'number', placeholder: 'Spend' },
    { name: 'revenue', label: 'Revenue', type: 'number', placeholder: 'Revenue' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Insights' }
  ],
  'utm-builder': [
    { name: 'presetName', label: 'Preset Name', type: 'text', placeholder: 'Naming preset' },
    { name: 'campaignName', label: 'Campaign', type: 'text', placeholder: 'Campaign name' },
    { name: 'source', label: 'Source', type: 'text', placeholder: 'facebook, google' },
    { name: 'medium', label: 'Medium', type: 'text', placeholder: 'cpc, email' },
    { name: 'content', label: 'Content', type: 'text', placeholder: 'creative id' },
    { name: 'term', label: 'Term', type: 'text', placeholder: 'keyword' },
    { name: 'baseUrl', label: 'Base URL', type: 'url', placeholder: 'https://...' },
    { name: 'utmUrl', label: 'Generated URL', type: 'text', readOnly: true },
    { name: 'shortUrl', label: 'Short URL', type: 'url', placeholder: 'https://bit.ly/...' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes' }
  ],
  reporting: [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'campaignName', label: 'Campaign', type: 'text', placeholder: 'Campaign name' },
    { name: 'reportTitle', label: 'Report Title', type: 'text', placeholder: 'Monthly report' },
    { name: 'periodStart', label: 'Period Start', type: 'date' },
    { name: 'periodEnd', label: 'Period End', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'sent'] },
    { name: 'whiteLabel', label: 'White-label', type: 'select', options: ['yes', 'no'] },
    { name: 'reportLink', label: 'Report Link', type: 'url', placeholder: 'https://...' },
    { name: 'emailTo', label: 'Email To Client', type: 'text', placeholder: 'client@email.com' },
    { name: 'commentary', label: 'Commentary', type: 'textarea', placeholder: 'Summary and insights' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Highlights' }
  ],
  'kpi-scorecard': [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'period', label: 'Period', type: 'text', placeholder: 'e.g., Sep 2024' },
    { name: 'kpiName', label: 'KPI', type: 'text', placeholder: 'Lead volume' },
    { name: 'target', label: 'Target', type: 'number', placeholder: 'Target' },
    { name: 'actual', label: 'Actual', type: 'number', placeholder: 'Actual' },
    { name: 'traffic', label: 'Traffic', type: 'number', placeholder: 'Traffic' },
    { name: 'leads', label: 'Leads', type: 'number', placeholder: 'Leads' },
    { name: 'revenue', label: 'Revenue', type: 'number', placeholder: 'Revenue' },
    { name: 'growth', label: 'Growth %', type: 'number', placeholder: 'Growth' },
    { name: 'status', label: 'Status', type: 'select', options: ['green', 'yellow', 'red'] },
    { name: 'trend', label: 'Trend', type: 'select', options: ['up', 'flat', 'down'] },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes' }
  ],
  'client-portal': [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'deliverable', label: 'Deliverable', type: 'text', placeholder: 'Deliverable' },
    { name: 'status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'approved', 'delivered'] },
    { name: 'dueDate', label: 'Due Date', type: 'date' },
    { name: 'reportLink', label: 'Report Link', type: 'url', placeholder: 'https://...' },
    { name: 'approvalLink', label: 'Approval Link', type: 'url', placeholder: 'https://...' },
    { name: 'calendarLink', label: 'Calendar Link', type: 'url', placeholder: 'https://...' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes' }
  ],
  'change-requests': [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'requestTitle', label: 'Request', type: 'text', placeholder: 'Change request' },
    { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
    { name: 'assignedTo', label: 'Assigned To', type: 'text', placeholder: 'Owner' },
    { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'completed', 'rejected'] },
    { name: 'deadline', label: 'Deadline', type: 'date' },
    { name: 'scopeChange', label: 'Scope Change', type: 'textarea', placeholder: 'What changed?' },
    { name: 'impactCost', label: 'Impact Cost', type: 'number', placeholder: 'Extra cost' },
    { name: 'impactTimeline', label: 'Timeline Impact', type: 'text', placeholder: 'e.g., +1 week' },
    { name: 'attachments', label: 'Attachments', type: 'url', placeholder: 'Link to files' },
    { name: 'comments', label: 'Comment Thread', type: 'textarea', placeholder: 'Notes and comments' }
  ],
  'meeting-notes': [
    { name: 'clientName', label: 'Client', type: 'text', placeholder: 'Client name' },
    { name: 'meetingDate', label: 'Meeting Date', type: 'date' },
    { name: 'attendees', label: 'Attendees', type: 'text', placeholder: 'Names' },
    { name: 'agenda', label: 'Agenda', type: 'textarea', placeholder: 'Agenda items' },
    { name: 'summary', label: 'Summary', type: 'textarea', placeholder: 'Key points' },
    { name: 'actionItems', label: 'Action Items', type: 'textarea', placeholder: 'One per line' },
    { name: 'assignedTo', label: 'Assign Tasks To', type: 'text', placeholder: 'Owner' },
    { name: 'linkedCampaign', label: 'Linked Campaign', type: 'text', placeholder: 'Campaign name' },
    { name: 'nextMeeting', label: 'Next Meeting', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes' }
  ]
};

const buildFormDefaults = (fields) => fields.reduce((acc, field) => {
  acc[field.name] = field.default || '';
  return acc;
}, {});

const buildUtmUrl = (data) => {
  const base = (data.baseUrl || '').trim();
  if (!base) return '';
  const params = new URLSearchParams();
  if (data.source) params.set('utm_source', data.source);
  if (data.medium) params.set('utm_medium', data.medium);
  if (data.campaignName) params.set('utm_campaign', data.campaignName);
  if (data.content) params.set('utm_content', data.content);
  if (data.term) params.set('utm_term', data.term);
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${params.toString() ? joiner + params.toString() : ''}`;
};

const ModuleCard = ({ module }) => {
  const Icon = MODULE_ICONS[module.key] || LayoutGrid;
  return (
    <Link
      to={`/digital-marketing/${module.key}`}
      className="group rounded-2xl border border-white/40 bg-white/80 p-5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-950/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#13ec6d]/20 text-[#0c6f42] dark:text-[#13ec6d]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Digital Marketing</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{module.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{module.subtitle}</p>
          </div>
        </div>
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-[#13ec6d] group-hover:text-[#102218] transition-colors">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {module.tags.map(tag => (
          <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        {module.kpis.slice(0, 2).map(kpi => (
          <div key={kpi.label} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
            <p className="uppercase tracking-widest text-[10px] text-slate-400">{kpi.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>
    </Link>
  );
};

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border border-white/40 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
    <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">{children}</div>
  </div>
);

const IntegrationChip = ({ name }) => (
  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
    <span className="h-2.5 w-2.5 rounded-full bg-[#13ec6d]" />
    {name}
  </div>
);

const FieldInput = ({ field, value, onChange }) => {
  const baseClasses = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#13ec6d] focus:outline-none focus:ring-2 focus:ring-[#13ec6d]/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100';
  if (field.type === 'textarea') {
    return (
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        placeholder={field.placeholder || ''}
        className={`${baseClasses} resize-none`}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={baseClasses}
      >
        <option value="">Select</option>
        {field.options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.type || 'text'}
      value={value}
      onChange={(e) => onChange(field.name, e.target.value)}
      placeholder={field.placeholder || ''}
      readOnly={field.readOnly}
      className={`${baseClasses} ${field.readOnly ? 'bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400' : ''}`}
    />
  );
};

export default function DigitalMarketingPage() {
  const { pageKey } = useParams();

  const module = useMemo(() => MODULES.find(item => item.key === pageKey), [pageKey]);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fieldDefs = useMemo(() => {
    if (!module) return [];
    return FIELD_DEFS[module.key] || [];
  }, [module]);

  const collectionName = module ? COLLECTION_BY_KEY[module.key] : null;

  useEffect(() => {
    if (!module) return;
    setFormState(buildFormDefaults(fieldDefs));
    setEditingId(null);
    setFormOpen(false);
    setCalendarMonth(new Date());
    setSidebarOpen(false);
  }, [module, fieldDefs]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (!module || !collectionName) return;
    const loadItems = async () => {
      try {
        setLoadingItems(true);
        const snap = await getDocs(
          query(collection(db, collectionName), orderBy('createdAt', 'desc'))
        );
        setItems(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
      } catch (error) {
        console.error('Error loading digital marketing items:', error);
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };
    loadItems();
  }, [module, collectionName]);

  const handleFieldChange = (name, value) => {
    setFormState(prev => {
      const next = { ...prev, [name]: value };
      if (module?.key === 'utm-builder') {
        next.utmUrl = buildUtmUrl(next);
      }
      return next;
    });
  };

  const handleEdit = (item) => {
    const defaults = buildFormDefaults(fieldDefs);
    const next = { ...defaults, ...item };
    if (module?.key === 'utm-builder') {
      next.utmUrl = buildUtmUrl(next);
    }
    setFormState(next);
    setEditingId(item.id);
    setFormOpen(true);
  };

  const handleReset = () => {
    setFormState(buildFormDefaults(fieldDefs));
    setEditingId(null);
    setFormOpen(false);
  };

  const handleSave = async () => {
    if (!collectionName) return;
    const payload = {
      ...formState,
      updatedAt: serverTimestamp()
    };

    if (module?.key === 'utm-builder') {
      payload.utmUrl = buildUtmUrl(formState);
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), payload);
        setItems(prev => prev.map(item => item.id === editingId ? { ...item, ...payload } : item));
      } else {
        const ref = await addDoc(collection(db, collectionName), {
          ...payload,
          createdAt: serverTimestamp()
        });
        setItems(prev => [{ id: ref.id, ...payload }, ...prev]);
      }
      handleReset();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!collectionName) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const isCalendar = module?.key === 'content-calendar';

  const eventsByDate = useMemo(() => {
    if (!isCalendar) return {};
    const map = {};
    items.forEach(item => {
      if (!item.publishDate) return;
      if (!map[item.publishDate]) map[item.publishDate] = [];
      map[item.publishDate].push(item);
    });
    return map;
  }, [items, isCalendar]);

  const monthLabel = useMemo(() => {
    return calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarMonth]);

  const calendarCells = useMemo(() => {
    if (!isCalendar) return [];
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const dayNumber = i - firstDay + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        cells.push({ dayNumber: null, dateKey: null, events: [] });
      } else {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        cells.push({ dayNumber, dateKey, events: eventsByDate[dateKey] || [] });
      }
    }
    return cells;
  }, [calendarMonth, eventsByDate, isCalendar]);

  const renderSidebarNav = (isMobile = false) => (
    <div className={`flex h-full flex-col ${isMobile ? 'px-5 py-6' : 'px-6 py-6'}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13ec6d] text-[#102218] shadow-[0_0_20px_rgba(19,236,109,0.3)]">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Digital Marketing</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Agency OS</p>
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/digital-marketing"
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
            !module ? 'bg-[#13ec6d]/20 text-[#0c6f42]' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/60'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Overview
        </Link>
      </div>

      <div className="mt-6 flex-1 space-y-1 overflow-y-auto pr-1">
        <p className="px-3 text-[10px] uppercase tracking-widest text-slate-400">Modules</p>
        {MODULES.map(item => {
          const Icon = MODULE_ICONS[item.key] || LayoutGrid;
          const isActive = module?.key === item.key;
          return (
            <Link
              key={item.key}
              to={`/digital-marketing/${item.key}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#13ec6d]/20 text-[#0c6f42] dark:text-[#13ec6d]'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/60'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-white/40 bg-white/80 p-4 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300">
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin Controls</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" />
            Module Manager
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-500" />
            Permissions
          </div>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-slate-500" />
            Branding
          </div>
        </div>
      </div>
    </div>
  );

  const headerTitle = module ? module.title : 'Agency Operations Studio';
  const headerSubtitle = module
    ? module.description
    : 'Command center for onboarding, briefs, approvals, performance, and client delivery.';

  const overviewStats = [
    { label: 'Active Modules', value: MODULES.length },
    { label: 'Live Clients', value: '38' },
    { label: 'Monthly Reports', value: '28' }
  ];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#f6f8f7] text-slate-900 dark:bg-[#0b1510] dark:text-slate-100">
        <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-white/40 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 lg:block">
          {renderSidebarNav()}
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <aside
              className="h-full w-72 bg-white/90 shadow-xl backdrop-blur dark:bg-slate-950"
              onClick={(e) => e.stopPropagation()}
            >
              {renderSidebarNav(true)}
            </aside>
          </div>
        )}

        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-white/40 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Digital Marketing</p>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{headerTitle}</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-300 max-w-2xl">{headerSubtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search modules or records"
                    className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-600 focus:border-[#13ec6d] focus:outline-none focus:ring-2 focus:ring-[#13ec6d]/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
                {module && (
                  <button
                    onClick={() => setFormOpen(prev => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#13ec6d] px-4 py-2 text-sm font-semibold text-[#102218] shadow-[0_0_20px_rgba(19,236,109,0.2)]"
                  >
                    <Plus className="h-4 w-4" />
                    {formOpen ? 'Close form' : 'Add entry'}
                  </button>
                )}
                <button
                  onClick={() => setDarkMode(prev => !prev)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
            {!module && (
              <>
                <div className="rounded-3xl border border-white/40 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Strategy View</p>
                      <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Digital Marketing Control Room</h2>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300 max-w-2xl">
                        Manage onboarding, briefs, approvals, reporting, and client delivery in a single place. Everything is editable, auditable, and tied to a client.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                      <p className="text-xs uppercase tracking-widest text-slate-300">Access</p>
                      <p className="text-sm font-semibold">Admin Workspace</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {overviewStats.map(stat => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value} />
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {MODULES.map(moduleItem => (
                    <ModuleCard key={moduleItem.key} module={moduleItem} />
                  ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Section title="Admin Control Panel" icon={Settings}>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-slate-500" />
                        Customize sidebar items, branding, and KPI metrics.
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-500" />
                        Manage role-based access, team permissions, and client portal rules.
                      </li>
                      <li className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-slate-500" />
                        Backup data and enable monthly archiving policies.
                      </li>
                    </ul>
                  </Section>

                  <Section title="Data Structure" icon={Database}>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-[#13ec6d]" />
                        Campaigns link to clients, months, assets, and reports.
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-[#13ec6d]" />
                        Everything is filterable, editable, and audit-ready.
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-[#13ec6d]" />
                        API-ready structure for future integrations.
                      </li>
                    </ul>
                  </Section>
                </div>
              </>
            )}

            {module && (
              <>
                <div className="rounded-3xl border border-white/40 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Module Overview</p>
                      <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{module.title}</h2>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300 max-w-2xl">{module.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {module.tags.map(tag => (
                          <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
                      <Sparkles className="h-5 w-5" />
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-300">Status</p>
                        <p className="text-sm font-semibold">Operational</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {module.kpis.map(item => (
                    <StatCard key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Editable Workspace</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Add and manage records</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-300">Track real client work, campaigns, assets, and approvals from here.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFormOpen(prev => !prev)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        {formOpen ? 'Close form' : 'Add new'}
                      </button>
                      {editingId && (
                        <button
                          onClick={handleReset}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
                        >
                          Cancel edit
                        </button>
                      )}
                    </div>
                  </div>

                  {formOpen && (
                    <div className="mt-6 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {fieldDefs.map(field => (
                          <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                              {field.label}
                            </label>
                            <div className="mt-2">
                              <FieldInput
                                field={field}
                                value={formState[field.name] || ''}
                                onChange={handleFieldChange}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleSave}
                          className="rounded-xl bg-[#13ec6d] px-4 py-2 text-sm font-semibold text-[#102218]"
                        >
                          {editingId ? 'Update' : 'Save'}
                        </button>
                        <button
                          onClick={handleReset}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isCalendar && (
                  <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-400">Client Calendar</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Content calendar</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Schedule deliverables with platforms, owners, and status.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300"
                        >
                          Prev
                        </button>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{monthLabel}</span>
                        <button
                          onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-7 gap-2 text-xs font-semibold text-slate-400">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center">{day}</div>
                      ))}
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-2">
                      {calendarCells.map((cell, index) => (
                        <div
                          key={`${cell.dateKey || 'empty'}-${index}`}
                          className="min-h-[90px] rounded-xl border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
                        >
                          {cell.dayNumber && (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{cell.dayNumber}</span>
                              {cell.dateKey && (
                                <button
                                  onClick={() => {
                                    setFormOpen(true);
                                    setFormState(prev => ({ ...prev, publishDate: cell.dateKey }));
                                  }}
                                  className="text-[10px] text-[#13ec6d]"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          )}
                          <div className="mt-2 space-y-1">
                            {cell.events.slice(0, 2).map(event => (
                              <div key={event.id} className="rounded-lg bg-white px-2 py-1 shadow-sm dark:bg-slate-950">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">{event.deliverable || event.campaignName}</p>
                                <p className="text-[10px] text-slate-400">{event.platform || event.channel}</p>
                              </div>
                            ))}
                            {cell.events.length > 2 && (
                              <p className="text-[10px] text-slate-400">+{cell.events.length - 2} more</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Records</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Saved entries</h3>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {items.length}
                    </span>
                  </div>

                  {loadingItems ? (
                    <p className="mt-4 text-sm text-slate-500">Loading...</p>
                  ) : items.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
                      No entries yet. Use “Add new” to create one.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {items.map(item => {
                        const previewFields = fieldDefs.filter(field => field.type !== 'textarea' && field.name !== 'notes').slice(0, 4);
                        const recordTitle = item.title || item.campaignName || item.assetName || item.reportTitle || item.requestTitle || item.deliverable || item.clientName || item.companyName || 'Untitled';
                        const recordClient = item.clientName || item.companyName || 'No client set';
                        return (
                          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{recordTitle}</p>
                                <p className="text-xs text-slate-400">{recordClient}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleEdit(item)} className="text-xs font-semibold text-[#13ec6d]">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="text-xs font-semibold text-rose-500">Delete</button>
                              </div>
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-slate-500">
                              {previewFields.map(field => (
                                <div key={field.name} className="flex items-center justify-between gap-2">
                                  <span className="uppercase tracking-widest text-[10px] text-slate-400">{field.label}</span>
                                  <span className="text-slate-600 dark:text-slate-300">{item[field.name] || '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Section title="Workflow" icon={Calendar}>
                    <ol className="space-y-3">
                      {module.workflow.map((step, index) => (
                        <li key={step} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#13ec6d] text-xs font-semibold text-[#102218]">
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
                          <span className="h-2 w-2 rounded-full bg-[#13ec6d]" />
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
                          <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-200" />
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
                      <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                        {item}
                      </div>
                    ))}
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                      Add your custom deliverables here.
                    </div>
                  </div>
                </Section>

                <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Next step</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Customize this module for your team</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-300">Adjust workflows, integrations, and templates to match your agency playbook.</p>
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
              </>
            )}
          </main>
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
