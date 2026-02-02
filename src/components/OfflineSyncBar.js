import React, { useEffect, useState } from 'react';
import { CloudOff, CloudUpload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOfflineQueue, flushOfflineQueue } from '../services/offlineSyncService';

export default function OfflineSyncBar() {
  const { currentUser } = useAuth();
  const [queueCount, setQueueCount] = useState(0);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncing, setSyncing] = useState(false);

  const refreshQueue = () => {
    const queue = getOfflineQueue();
    setQueueCount(queue.length);
  };

  useEffect(() => {
    refreshQueue();
    if (online) {
      flushOfflineQueue(currentUser).then(refreshQueue);
    }

    const handleOnline = () => {
      setOnline(true);
      refreshQueue();
      flushOfflineQueue(currentUser).then(refreshQueue);
    };
    const handleOffline = () => {
      setOnline(false);
      refreshQueue();
    };
    const handleUpdate = () => refreshQueue();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleUpdate);
    document.addEventListener('visibilitychange', handleUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleUpdate);
      document.removeEventListener('visibilitychange', handleUpdate);
    };
  }, [currentUser, online]);

  const handleSyncNow = async () => {
    if (!online || queueCount === 0 || syncing) return;
    setSyncing(true);
    await flushOfflineQueue(currentUser);
    refreshQueue();
    setSyncing(false);
  };

  if (!currentUser?.uid) return null;
  if (online && queueCount === 0) return null;

  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-900 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {online ? <CloudUpload size={16} /> : <CloudOff size={16} />}
        <span className="font-semibold">
          {online ? 'Offline items pending sync' : 'You are offline'}
        </span>
        <span className="text-yellow-700">
          {queueCount > 0 ? `${queueCount} item${queueCount !== 1 ? 's' : ''} queued` : 'Changes will sync when online'}
        </span>
      </div>
      {online && queueCount > 0 && (
        <button
          onClick={handleSyncNow}
          className="px-3 py-1 rounded-lg bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-semibold transition-all"
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync now'}
        </button>
      )}
    </div>
  );
}
