import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook for managing push notifications
 * Registers service worker and requests notification permissions
 */
export const usePushNotifications = () => {
  const { currentUser } = useAuth();
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = () => {
      return (
        typeof ServiceWorkerContainer !== 'undefined' &&
        'PushManager' in window &&
        'Notification' in window
      );
    };

    setIsPushSupported(isSupported());
  }, []);

  // Register service worker
  useEffect(() => {
    if (!isPushSupported || !currentUser) return;

    const registerServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register(
            '/service-worker.js',
            { scope: '/' }
          );
          console.log('Service Worker registered:', registration);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [isPushSupported, currentUser]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!isPushSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
      });

      // Save subscription to Firebase
      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          pushSubscription: {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime,
            keys: {
              p256dh: arrayBufferToBase64(
                subscription.getKey('p256dh')
              ),
              auth: arrayBufferToBase64(subscription.getKey('auth'))
            }
          },
          pushNotificationsEnabled: true,
          pushNotificationsEnabledAt: new Date()
        });
      }

      setIsSubscribed(true);
      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isPushSupported, currentUser]);

  // Unsubscribe from push notifications
  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!isPushSupported) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Update Firebase
        if (currentUser?.uid) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            pushSubscription: null,
            pushNotificationsEnabled: false
          });
        }

        setIsSubscribed(false);
        console.log('Successfully unsubscribed from push notifications');
        return true;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isPushSupported, currentUser]);

  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isPushSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  }, [isPushSupported]);

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  return {
    isPushSupported,
    isSubscribed,
    isLoading,
    requestNotificationPermission,
    unsubscribeFromPushNotifications,
    checkSubscriptionStatus
  };
};

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
  return btoa(binary);
}

export default usePushNotifications;
