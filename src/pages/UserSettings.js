import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Settings, Sun, Moon, Bell, Mail, AlertCircle, CheckCircle, Globe, Clock } from 'lucide-react';

export const UserSettings = () => {
  const { settings, updateSetting, updateNestedSetting, loading } = useSettings();
  const [saved, setSaved] = useState(false);

  // ✅ APPLY DARK MODE TO DOCUMENT
  useEffect(() => {
    console.log('🎨 Applying dark mode:', settings.darkMode);
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // ✅ APPLY LANGUAGE TO DOCUMENT
  useEffect(() => {
    console.log('🌍 Applying language:', settings.language);
    document.documentElement.lang = settings.language || 'en';
    
    // Apply RTL for Arabic
    if (settings.language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.body.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
      document.body.dir = 'ltr';
    }
  }, [settings.language]);

  const showSaveMessage = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDarkModeChange = async (isDark) => {
    console.log('🌓 Toggling dark mode to:', isDark);
    await updateSetting('darkMode', isDark);
    
    // Immediately apply to DOM
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    showSaveMessage();
  };

  const handleLanguageChange = async (lang) => {
    console.log('🌍 Changing language to:', lang);
    await updateSetting('language', lang);
    
    // Immediately apply to DOM
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.body.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
      document.body.dir = 'ltr';
    }
    
    showSaveMessage();
  };

  const handleTimezoneChange = async (tz) => {
    console.log('🕐 Changing timezone to:', tz);
    await updateSetting('timezone', tz);
    showSaveMessage();
  };

  const handleNotificationChange = async (key) => {
    console.log('🔔 Toggling notification:', key);
    await updateNestedSetting('notifications', key, !settings.notifications[key]);
    showSaveMessage();
  };

  const handleEmailDigestChange = async (value) => {
    console.log('📧 Changing email digest to:', value);
    await updateSetting('emailDigest', value);
    showSaveMessage();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 lg:p-8 transition-colors duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Settings size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-blue-100">Manage your preferences and notifications</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Save Success Message */}
        {saved && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3 animate-slideDown shadow-lg">
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-semibold">Settings saved successfully!</p>
          </div>
        )}

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 mb-6 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            {settings.darkMode ? (
              <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                <Moon size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : (
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                <Sun size={24} className="text-yellow-600 dark:text-yellow-400" />
              </div>
            )}
            Appearance
          </h2>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Theme Mode
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDarkModeChange(false)}
                  className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                    !settings.darkMode
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Sun size={20} />
                  Light Mode
                  {!settings.darkMode && <CheckCircle size={16} />}
                </button>
                <button
                  onClick={() => handleDarkModeChange(true)}
                  className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                    settings.darkMode
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Moon size={20} />
                  Dark Mode
                  {settings.darkMode && <CheckCircle size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Current: {settings.darkMode ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Globe size={18} />
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Spanish (Español)</option>
                <option value="fr">🇫🇷 French (Français)</option>
                <option value="de">🇩🇪 German (Deutsch)</option>
                <option value="it">🇮🇹 Italian (Italiano)</option>
                <option value="ar">🇸🇦 Arabic (العربية)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {settings.language === 'ar' && 'Text direction: Right-to-Left (RTL)'}
                {settings.language !== 'ar' && 'Text direction: Left-to-Right (LTR)'}
              </p>
            </div>

            {/* Timezone Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Clock size={18} />
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="UTC">🌍 UTC (Coordinated Universal Time)</option>
                <option value="Europe/London">🇬🇧 London (GMT/BST)</option>
                <option value="Europe/Paris">🇫🇷 Paris (CET/CEST)</option>
                <option value="Europe/Berlin">🇩🇪 Berlin (CET/CEST)</option>
                <option value="Europe/Rome">🇮🇹 Rome (CET/CEST)</option>
                <option value="America/New_York">🇺🇸 New York (EST/EDT)</option>
                <option value="America/Los_Angeles">🇺🇸 Los Angeles (PST/PDT)</option>
                <option value="America/Chicago">🇺🇸 Chicago (CST/CDT)</option>
                <option value="Asia/Dubai">🇦🇪 Dubai (GST)</option>
                <option value="Asia/Tokyo">🇯🇵 Tokyo (JST)</option>
                <option value="Asia/Shanghai">🇨🇳 Shanghai (CST)</option>
                <option value="Australia/Sydney">🇦🇺 Sydney (AEST/AEDT)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Current time: {new Date().toLocaleTimeString('en-US', { timeZone: settings.timezone })}
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 mb-6 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <Bell size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            Notifications
          </h2>

          <div className="space-y-3">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <Mail size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Receive email alerts for important updates</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('email')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                  settings.notifications.email
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.notifications.email ? '✓ ON' : 'OFF'}
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <Bell size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Real-time in-app alerts</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('push')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                  settings.notifications.push
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.notifications.push ? '✓ ON' : 'OFF'}
              </button>
            </div>

            {/* Deal Notifications */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <span className="text-xl">🤝</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Deal Updates</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">New deals and status changes</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('deals')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                  settings.notifications.deals
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.notifications.deals ? '✓ ON' : 'OFF'}
              </button>
            </div>

            {/* Task Notifications */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <span className="text-xl">✅</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Task Updates</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Assigned tasks and deadlines</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('tasks')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                  settings.notifications.tasks
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.notifications.tasks ? '✓ ON' : 'OFF'}
              </button>
            </div>

            {/* Commission Notifications */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Commission Updates</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">New commissions and payments</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('commissions')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                  settings.notifications.commissions
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.notifications.commissions ? '✓ ON' : 'OFF'}
              </button>
            </div>

            {/* Email Digest Frequency */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Mail size={18} className="text-blue-600 dark:text-blue-400" />
                Email Digest Frequency
              </label>
              <select
                value={settings.emailDigest}
                onChange={(e) => handleEmailDigestChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
              >
                <option value="daily">📅 Daily Summary</option>
                <option value="weekly">📆 Weekly Summary</option>
                <option value="never">🚫 Never (Disabled)</option>
              </select>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {settings.emailDigest === 'daily' && 'You will receive a daily email summary'}
                {settings.emailDigest === 'weekly' && 'You will receive a weekly email summary'}
                {settings.emailDigest === 'never' && 'Email digests are disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <p className="font-semibold mb-2">Current Settings:</p>
          <ul className="space-y-1">
            <li>• Dark Mode: {settings.darkMode ? '✓ Enabled' : '✗ Disabled'}</li>
            <li>• Language: {settings.language}</li>
            <li>• Timezone: {settings.timezone}</li>
            <li>• Notifications: {Object.values(settings.notifications).filter(Boolean).length} enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;