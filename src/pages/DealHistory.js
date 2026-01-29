import React, { useEffect, useState } from 'react';
import { db } from '../firebase';

import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';

export default function DealHistory({ dealId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (dealId) load();
  }, [dealId]);

  async function load() {
    const q = query(
      collection(db, 'dealActivities'),
      where('dealId', '==', dealId),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);

    setLogs(snap.docs.map(d => d.data()));
  }

  if (!logs.length)
    return <p className="text-sm text-gray-500">No history</p>;

  return (
    <div className="mt-4">

      <h3 className="font-semibold mb-2">
        Activity Log
      </h3>

      {logs.map((l, i) => (
        <div
          key={i}
          className="text-sm border-b py-1"
        >
          <b>{l.userName}</b> — {l.action}
        </div>
      ))}

    </div>
  );
}
