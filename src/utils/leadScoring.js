export function scoreDeal(deal, pipelineStages) {
  if (!deal) return { score: 0, priority: 'low' };

  if (deal.status === 'closed') {
    return { score: 95, priority: 'won' };
  }
  if (deal.status === 'lost') {
    return { score: 5, priority: 'lost' };
  }

  const stages = Array.isArray(pipelineStages) ? pipelineStages : [];
  const stageIndex = stages.findIndex(stage => stage.value === deal.status);
  const baseScore = stageIndex >= 0 ? 20 + stageIndex * 12 : 20;

  const createdAt = deal.createdAt?.toDate?.() || deal.createdAt || new Date();
  const statusUpdatedAt = deal.statusUpdatedAt?.toDate?.() || deal.statusUpdatedAt || createdAt;
  const lastActivityAt = deal.lastActivityAt?.toDate?.() || deal.lastActivityAt || statusUpdatedAt;

  const ageDays = Math.floor((Date.now() - new Date(statusUpdatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const activityDays = Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));

  let score = baseScore;

  if (ageDays > 60) score -= 25;
  else if (ageDays > 30) score -= 15;
  else if (ageDays > 14) score -= 5;

  if (activityDays <= 3) score += 15;
  else if (activityDays <= 7) score += 8;
  else if (activityDays <= 14) score += 4;
  else if (activityDays > 30) score -= 10;

  if (deal.price || deal.amount) {
    const value = Number(deal.price || deal.amount || 0);
    if (value >= 100000) score += 15;
    else if (value >= 25000) score += 8;
    else if (value >= 5000) score += 4;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let priority = 'low';
  if (score >= 70) priority = 'high';
  else if (score >= 40) priority = 'medium';

  return { score, priority };
}

export function getPriorityBadge(priority) {
  if (priority === 'won') return { label: 'Won', color: 'bg-green-100 text-green-700 border-green-200' };
  if (priority === 'lost') return { label: 'Lost', color: 'bg-gray-100 text-gray-600 border-gray-200' };
  if (priority === 'high') return { label: 'High', color: 'bg-red-100 text-red-700 border-red-200' };
  if (priority === 'medium') return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: 'Low', color: 'bg-blue-100 text-blue-700 border-blue-200' };
}
