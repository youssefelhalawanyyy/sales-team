import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function sendNotification(userId, message) {
  if (!userId || !message) return;

  await addDoc(collection(db, 'notifications'), {
    userId,
    message,
    read: false,
    createdAt: serverTimestamp()
  });
}
