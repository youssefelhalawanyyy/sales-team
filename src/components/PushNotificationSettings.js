import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const PushNotificationSettings = () => {
  const {
    isPushSupported,
    isSubscribed,
    isLoading,
    requestNotificationPermission,
    unsubscribeFromPushNotifications
  } = usePushNotifications();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleEnable = async () => {
    setError(null);
    setSuccess(null);

    try {
      const result = await requestNotificationPermission();
      if (result) {
        setSuccess('Push notifications enabled successfully!');
      } else {
        setError('Failed to enable push notifications. Please check browser permissions.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDisable = async () => {
    setError(null);
    setSuccess(null);

    try {
      const result = await unsubscribeFromPushNotifications();
      if (result) {
        setSuccess('Push notifications disabled');
      } else {
        setError('Failed to disable push notifications');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  if (!isPushSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Push notifications are not supported on your browser. Please use a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-600 mt-1">
              Receive notifications about deals, follow-ups, and commission updates directly on your device.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            Status: {isSubscribed ? (
              <span className="text-green-600">Enabled</span>
            ) : (
              <span className="text-gray-500">Disabled</span>
            )}
          </p>
        </div>

        <button
          onClick={isSubscribed ? handleDisable : handleEnable}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            isSubscribed
              ? 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50'
          }`}
        >
          {isLoading ? (
            <>
              <span className="inline-block mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              {isSubscribed ? 'Disabling...' : 'Enabling...'}
            </>
          ) : (
            isSubscribed ? 'Disable' : 'Enable'
          )}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium mb-2">What you'll receive:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Notifications when deals are created or updated</li>
          <li>Reminders for follow-up tasks</li>
          <li>Commission earned notifications</li>
          <li>Achievement unlocked alerts</li>
          <li>Settlement processing updates</li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationSettings;
