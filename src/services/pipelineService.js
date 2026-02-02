import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_PIPELINE_STAGES, normalizePipelineStages } from '../utils/pipeline';

const PIPELINE_DOC_ID = 'salesPipeline';

export async function fetchPipelineSettings() {
  try {
    const ref = doc(db, 'settings', PIPELINE_DOC_ID);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_PIPELINE_STAGES.map(stage => ({ ...stage }));
    }
    const data = snap.data();
    return normalizePipelineStages(data?.stages);
  } catch (error) {
    console.error('Error loading pipeline settings:', error);
    return DEFAULT_PIPELINE_STAGES.map(stage => ({ ...stage }));
  }
}

export async function savePipelineSettings(stages, userId) {
  const normalized = normalizePipelineStages(stages);
  const ref = doc(db, 'settings', PIPELINE_DOC_ID);
  await setDoc(
    ref,
    {
      stages: normalized,
      updatedAt: serverTimestamp(),
      updatedBy: userId || null
    },
    { merge: true }
  );
  return normalized;
}
