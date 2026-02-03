import { getRequiredFieldsForStage, getStageLabel } from './pipeline';

const STALL_DAYS = 14;
const SLA_BY_STAGE = {
  potential_client: 5,
  pending_approval: 5
};
const DEFAULT_SLA = 7;

const toDateValue = (value) => {
  if (!value) return null;
  return value?.toDate?.() || new Date(value);
};

const daysSince = (value) => {
  const date = toDateValue(value);
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export function buildDealCoach(deal, { pipelineStages, followups, visits, clientUpdates }) {
  if (!deal) return { summary: '', risks: [], nextSteps: [], status: 'idle' };

  if (deal.status === 'closed') {
    return {
      summary: 'Deal closed successfully. Focus on expansion or referrals.',
      risks: [],
      nextSteps: ['Log post-sale check-in', 'Identify upsell opportunities'],
      status: 'won'
    };
  }

  if (deal.status === 'lost') {
    return {
      summary: 'Deal lost. Capture lessons learned and next re-engagement date.',
      risks: ['Outcome: Lost'],
      nextSteps: ['Document loss reason', 'Schedule future re-engagement'],
      status: 'lost'
    };
  }

  const requiredFields = getRequiredFieldsForStage(pipelineStages, deal.status);
  const missingFields = requiredFields.filter(field => {
    const value = deal[field];
    if (field === 'price') return !value || Number(value) <= 0;
    if (typeof value === 'string') return value.trim() === '';
    return value === undefined || value === null;
  });

  const statusDays = daysSince(deal.statusUpdatedAt || deal.createdAt) ?? 0;
  const lastActivityDays = daysSince(deal.lastActivityAt || deal.statusUpdatedAt || deal.createdAt) ?? 0;
  const sla = SLA_BY_STAGE[deal.status] || DEFAULT_SLA;

  const pendingFollowups = (followups || []).filter(f => f.status !== 'done');
  const recentUpdate = (clientUpdates || [])[0];

  const risks = [];
  const nextSteps = [];

  if (missingFields.length > 0) {
    risks.push(`Missing required fields: ${missingFields.map(field => field.replace(/([A-Z])/g, ' $1')).join(', ')}`);
  }

  if (statusDays >= sla) {
    risks.push(`Deal has been in ${getStageLabel(pipelineStages, deal.status)} for ${statusDays} days (SLA ${sla} days).`);
  }

  if (lastActivityDays >= STALL_DAYS) {
    risks.push(`No activity logged in ${lastActivityDays} days.`);
  }

  if (pendingFollowups.length === 0) {
    nextSteps.push('Schedule the next follow-up task.');
  }

  if (!visits || visits.length === 0) {
    nextSteps.push('Plan a site visit or discovery call.');
  }

  if (!recentUpdate) {
    nextSteps.push('Add a client update to keep the team aligned.');
  }

  if ((deal.price || 0) >= 25000 && lastActivityDays >= 7) {
    risks.push('High-value deal with limited recent activity.');
  }

  if (nextSteps.length === 0) {
    nextSteps.push('Keep momentum with a tailored follow-up and stakeholder mapping.');
  }

  const summary = risks.length > 0
    ? 'This deal needs attention. Address the risks below.'
    : 'Deal looks healthy. Keep momentum with consistent follow-ups.';

  return {
    summary,
    risks,
    nextSteps,
    status: risks.length > 0 ? 'attention' : 'healthy'
  };
}
