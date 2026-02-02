import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEY = 'offlineQueue';

function readQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read offline queue:', error);
    return [];
  }
}

function writeQueue(queue) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event('offline-queue-updated'));
  } catch (error) {
    console.error('Failed to write offline queue:', error);
  }
}

export function getOfflineQueue() {
  return readQueue();
}

export function enqueueOfflineItem(type, payload) {
  const queue = readQueue();
  const item = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    queuedAt: new Date().toISOString()
  };
  queue.push(item);
  writeQueue(queue);
  return item;
}

export async function flushOfflineQueue(currentUser) {
  if (!currentUser?.uid) {
    return { flushed: 0, remaining: readQueue().length };
  }

  const queue = readQueue();
  if (queue.length === 0) {
    return { flushed: 0, remaining: 0 };
  }

  let flushed = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      if (item.type === 'contact') {
        await addDoc(collection(db, 'contacts'), {
          ...item.payload,
          createdBy: currentUser.uid,
          createdByName: item.payload.createdByName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
          createdAt: serverTimestamp(),
          source: 'offline'
        });
        flushed += 1;
        continue;
      }

      if (item.type === 'deal') {
        await addDoc(collection(db, 'sales'), {
          ...item.payload,
          createdBy: currentUser.uid,
          createdByName: item.payload.createdByName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
          ownerId: item.payload.ownerId || currentUser.uid,
          ownerName: item.payload.ownerName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
          archived: false,
          createdAt: serverTimestamp(),
          editHistory: item.payload.editHistory || [],
          source: 'offline'
        });
        flushed += 1;
        continue;
      }

      remaining.push(item);
    } catch (error) {
      console.error('Failed to flush offline item:', item, error);
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  return { flushed, remaining: remaining.length };
}
