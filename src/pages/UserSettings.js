import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Settings, Sun, Moon, Bell, Mail, Clock, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const UserSettings = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      deals: true,
      tasks: true,
      commissions: true
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    emailDigest: 'daily', // daily, weekly, never
    darkMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.uid) return;
      try {
        const docRef = doc(db, 'userSettings', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...settings, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentUser?.uid]);

  // Save settings
  const handleSave = async () => {
    if (!currentUser?.uid) return;
    try {
      setError('');
      await setDoc(doc(db, 'userSettings', currentUser.uid), settings, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    }
  };

  const handleNotificationChange = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <Settings size={32} />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-blue-100">Manage your preferences and notifications</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-slideDown">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-green-800">Settings saved successfully!</p>
          </div>
        )}

        {/* Theme Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            {settings.darkMode ? <Moon size={20} /> : <Sun size={20} />}
            Appearance
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Theme</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, darkMode: false }))}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    !settings.darkMode
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Sun size={18} />
                  Light Mode
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, darkMode: true }))}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    settings.darkMode
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Moon size={18} />
                  Dark Mode
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[
                  'UTC',
                  'Europe/London',
                  'Europe/Paris',
                  'Europe/Berlin',
                  'Europe/Rome',
                  'America/New_York',
                  'America/Los_Angeles',
                  'Asia/Tokyo',
                  'Asia/Shanghai'
                ].map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </h2>

          <div className="space-y-4">
            {/* General Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-600">Receive email alerts</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('email')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  settings.notifications.email
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {settings.notifications.email ? 'On' : 'Off'}
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-600">In-app alerts</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('push')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  settings.notifications.push
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {settings.notifications.push ? 'On' : 'Off'}
              </button>
            </div>

            {/* Deal Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">🤝</span>
                <div>
                  <p className="font-semibold text-gray-900">Deal Updates</p>
                  <p className="text-xs text-gray-600">New deals and changes</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('deals')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  settings.notifications.deals
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {settings.notifications.deals ? 'On' : 'Off'}
              </button>
            </div>

            {/* Task Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-semibold text-gray-900">Task Updates</p>
                  <p className="text-xs text-gray-600">Assigned tasks and deadlines</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('tasks')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  settings.notifications.tasks
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {settings.notifications.tasks ? 'On' : 'Off'}
              </button>
            </div>

            {/* Commission Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">💰</span>
                <div>
                  <p className="font-semibold text-gray-900">Commission Updates</p>
                  <p className="text-xs text-gray-600">New commissions and payments</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('commissions')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  settings.notifications.commissions
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {settings.notifications.commissions ? 'On' : 'Off'}
              </button>
            </div>

            {/* Email Digest */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Email Digest Frequency</label>
              <select
                value={settings.emailDigest}
                onChange={(e) => setSettings(prev => ({ ...prev, emailDigest: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default UserSettings;
