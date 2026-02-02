import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const DEFAULT_SLA_DAYS = 7;
const SLA_BY_STAGE = {
  potential_client: 5,
  pending_approval: 5
};

function getDaysSince(dateValue) {
  if (!dateValue) return 0;
  const date = dateValue?.toDate?.() || dateValue;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function runAutoFollowups({ deals, currentUser }) {
  if (!currentUser?.uid || !Array.isArray(deals) || deals.length === 0) {
    return { created: 0 };
  }

  let created = 0;

  for (const deal of deals) {
    if (!deal || deal.archived) continue;
    if (deal.status === 'closed' || deal.status === 'lost') continue;

    const ownerId = deal.ownerId || deal.createdBy;
    if (ownerId !== currentUser.uid) continue;

    const stage = deal.status;
    const slaDays = SLA_BY_STAGE[stage] || DEFAULT_SLA_DAYS;
    const stageUpdatedAt = deal.statusUpdatedAt?.toDate?.() || deal.statusUpdatedAt || deal.createdAt?.toDate?.() || deal.createdAt;
    const daysInStage = getDaysSince(stageUpdatedAt);

    if (daysInStage < slaDays) continue;

    const lastAutoAt = deal.lastAutoFollowUpAt?.toDate?.() || deal.lastAutoFollowUpAt;
    const lastAutoDays = getDaysSince(lastAutoAt);
    const lastAutoStage = deal.lastAutoFollowUpStage;

    if (lastAutoStage === stage && lastAutoDays < slaDays) {
      continue;
    }

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 1);

    try {
      await addDoc(collection(db, 'followups'), {
        dealId: deal.id,
        businessName: deal.businessName,
        assignedTo: ownerId,
        assignedToName: deal.ownerName || deal.createdByName || 'Owner',
        reminderDate: Timestamp.fromDate(reminderDate),
        nextAction: `Follow up on ${deal.businessName}`,
        notes: `Auto reminder: Deal has been in ${stage.replace(/_/g, ' ')} for ${daysInStage} days.`,
        status: 'pending',
        createdAt: serverTimestamp(),
        completedAt: null,
        source: 'auto'
      });

      await updateDoc(doc(db, 'sales', deal.id), {
        lastAutoFollowUpAt: serverTimestamp(),
        lastAutoFollowUpStage: stage,
        lastActivityAt: serverTimestamp()
      });

      created += 1;
    } catch (error) {
      console.error('Auto follow-up error:', error);
    }
  }

  return { created };
}
