import React, { useState, useEffect } from 'react';

const PreferencesPanel = ({ userId }) => {
  const [preferences, setPreferences] = useState({
    voiceSensitivity: 50,
    interventionFrequency: 'balanced', // aggressive, balanced, minimal
    notificationPreferences: {
      workoutReminders: true,
      goalDeadlines: true,
      streakNotifications: true,
      weeklyReports: true
    },
    theme: 'dark', // dark, light
    preferredInterventionTimes: {
      morning: true,
      afternoon: false,
      evening: true
    },
    categoryFocus: {
      fitness: true,
      business: true,
      goals: true,
      mindset: true
    },
    privacySettings: {
      dataSharing: false,
      analytics: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('celeste7_preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...preferences, ...parsed });
      } catch (err) {
        console.error('Failed to parse saved preferences:', err);
      }
    }
  }, []);

  const savePreferences = async (newPreferences) => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('celeste7_preferences', JSON.stringify(newPreferences));
      
      // TODO: Send to backend/N8N webhook for server-side storage
      // await secureApiCall(`${backendUrl}/api/user-preferences`, {
      //   method: 'POST',
      //   body: { user_id: userId, preferences: newPreferences }
      // });
      
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const handleSelectChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const handleToggleChange = (category, key) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: !preferences[category][key]
      }
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const resetToDefaults = () => {
    const defaultPreferences = {
      voiceSensitivity: 50,
      interventionFrequency: 'balanced',
      notificationPreferences: {
        workoutReminders: true,
        goalDeadlines: true,
        streakNotifications: true,
        weeklyReports: true
      },
      theme: 'dark',
      preferredInterventionTimes: {
        morning: true,
        afternoon: false,
        evening: true
      },
      categoryFocus: {
        fitness: true,
        business: true,
        goals: true,
        mindset: true
      },
      privacySettings: {
        dataSharing: false,
        analytics: true
      }
    };
    
    setPreferences(defaultPreferences);
    savePreferences(defaultPreferences);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Preferences</h2>
          <button
            onClick={resetToDefaults}
            disabled={loading}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          
          {/* Voice Settings */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Voice Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Voice Sensitivity
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500">Low</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.voiceSensitivity}
                    onChange={(e) => handleSliderChange('voiceSensitivity', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ea580c 0%, #ea580c ${preferences.voiceSensitivity}%, #374151 ${preferences.voiceSensitivity}%, #374151 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-500">High</span>
                  <span className="text-sm text-white font-medium w-12 text-right">
                    {preferences.voiceSensitivity}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Adjust how sensitive the voice detection is to ambient noise
                </p>
              </div>
            </div>
          </div>

          {/* AI Coaching Settings */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">AI Coaching</h3>
            
            <div className="space-y-4">
              
              {/* Intervention Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Intervention Frequency
                </label>
                <select
                  value={preferences.interventionFrequency}
                  onChange={(e) => handleSelectChange('interventionFrequency', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="aggressive">Aggressive - Daily check-ins and frequent nudges</option>
                  <option value="balanced">Balanced - Regular guidance with space to breathe</option>
                  <option value="minimal">Minimal - Only when you ask or major milestones</option>
                </select>
              </div>

              {/* Category Focus */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Category Focus
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(preferences.categoryFocus).map(([category, enabled]) => (
                    <label key={category} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleToggleChange('categoryFocus', category)}
                        className="w-4 h-4 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300 capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Intervention Times */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Preferred Intervention Times
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(preferences.preferredInterventionTimes).map(([time, enabled]) => (
                    <label key={time} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleToggleChange('preferredInterventionTimes', time)}
                        className="w-4 h-4 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300 capitalize">{time}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            
            <div className="space-y-4">
              {Object.entries(preferences.notificationPreferences).map(([key, enabled]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      {key === 'workoutReminders' ? 'Workout Reminders' :
                       key === 'goalDeadlines' ? 'Goal Deadlines' :
                       key === 'streakNotifications' ? 'Streak Notifications' :
                       key === 'weeklyReports' ? 'Weekly Reports' : key}
                    </span>
                    <p className="text-xs text-gray-500">
                      {key === 'workoutReminders' ? 'Get notified when it\'s time to workout' :
                       key === 'goalDeadlines' ? 'Alerts for upcoming goal deadlines' :
                       key === 'streakNotifications' ? 'Celebrate milestones and maintain streaks' :
                       key === 'weeklyReports' ? 'Weekly summary of your progress' : ''}
                    </p>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToggleChange('notificationPreferences', key)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-orange-600' : 'bg-gray-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform m-1 ${enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Appearance</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handleSelectChange('theme', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="dark">Dark Theme (Recommended)</option>
                  <option value="light">Light Theme</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Dark theme is optimized for focus and reduced eye strain
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Privacy & Data</h3>
            
            <div className="space-y-4">
              {Object.entries(preferences.privacySettings).map(([key, enabled]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      {key === 'dataSharing' ? 'Data Sharing' : 'Analytics'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {key === 'dataSharing' 
                        ? 'Share anonymized data to improve AI coaching (disabled by default)' 
                        : 'Allow usage analytics to improve your experience'
                      }
                    </p>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToggleChange('privacySettings', key)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-orange-600' : 'bg-gray-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform m-1 ${enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Data Section */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Data Export</h3>
            <p className="text-gray-400 text-sm mb-4">
              Download your data including conversations, goals, and metrics
            </p>
            <button
              onClick={() => {
                // TODO: Implement data export
                setMessage({ type: 'success', text: 'Data export feature coming soon!' });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Export My Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPanel;