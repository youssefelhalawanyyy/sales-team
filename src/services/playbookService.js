import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const PLAYBOOK_DOC_ID = 'playbooks';

export async function fetchPlaybooks() {
  try {
    const ref = doc(db, 'settings', PLAYBOOK_DOC_ID);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { stages: {} };
    }
    const data = snap.data() || {};
    return {
      stages: data.stages || data || {}
    };
  } catch (error) {
    console.error('Error loading playbooks:', error);
    return { stages: {} };
  }
}

export async function savePlaybooks(payload) {
  const ref = doc(db, 'settings', PLAYBOOK_DOC_ID);
  await setDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
