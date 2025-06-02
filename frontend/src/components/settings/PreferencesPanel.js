import React, { useState, useEffect } from 'react';
import { secureApiCall } from '../../utils/security';

const PreferencesPanel = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [preferences, setPreferences] = useState({
    voice_settings: {
      speech_rate: 1.0,
      voice_model: 'default',
      enable_voice_feedback: true,
      auto_transcription: true
    },
    notifications: {
      email_notifications: true,
      push_notifications: true,
      session_reminders: true,
      progress_updates: true,
      reminder_frequency: 'daily'
    },
    ai_coaching: {
      coaching_style: 'balanced',
      feedback_detail: 'medium',
      enable_real_time_feedback: true,
      focus_areas: [],
      difficulty_level: 'intermediate'
    },
    privacy: {
      save_recordings: true,
      share_analytics: false,
      data_retention_days: 30
    }
  });

  const focusAreaOptions = [
    'confidence',
    'clarity',
    'pace',
    'volume',
    'pronunciation',
    'body_language',
    'presentation_skills',
    'conversation_skills'
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/preferences`);
      
      if (response && !response.error) {
        setPreferences({
          ...preferences,
          ...response
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    setMessage('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/preferences`, {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });

      if (response && !response.error) {
        setMessage('Preferences saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (section, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const toggleFocusArea = (area) => {
    const currentAreas = preferences.ai_coaching.focus_areas || [];
    const updatedAreas = currentAreas.includes(area)
      ? currentAreas.filter(a => a !== area)
      : [...currentAreas, area];
    
    updatePreference('ai_coaching', 'focus_areas', updatedAreas);
  };

  return (
    <div className="space-y-8">
      
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.includes('successfully') 
            ? 'bg-green-900/20 border-green-700 text-green-300' 
            : 'bg-red-900/20 border-red-700 text-red-300'
        }`}>
          <p className="text-sm font-medium" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            {message}
          </p>
        </div>
      )}

      {/* Voice Settings */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          Voice Settings
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Speech Rate
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Slow</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={preferences.voice_settings.speech_rate}
                onChange={(e) => updatePreference('voice_settings', 'speech_rate', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-400">Fast</span>
              <span className="text-sm text-blue-400 min-w-[3rem]">
                {preferences.voice_settings.speech_rate}x
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Voice Model
            </label>
            <select
              value={preferences.voice_settings.voice_model}
              onChange={(e) => updatePreference('voice_settings', 'voice_model', e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              <option value="default">Default</option>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="encouraging">Encouraging</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Enable Voice Feedback
              </label>
              <button
                type="button"
                onClick={() => updatePreference('voice_settings', 'enable_voice_feedback', !preferences.voice_settings.enable_voice_feedback)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.voice_settings.enable_voice_feedback ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  preferences.voice_settings.enable_voice_feedback ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Auto Transcription
              </label>
              <button
                type="button"
                onClick={() => updatePreference('voice_settings', 'auto_transcription', !preferences.voice_settings.auto_transcription)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.voice_settings.auto_transcription ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  preferences.voice_settings.auto_transcription ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          Notifications
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Email Notifications
            </label>
            <button
              type="button"
              onClick={() => updatePreference('notifications', 'email_notifications', !preferences.notifications.email_notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notifications.email_notifications ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                preferences.notifications.email_notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Push Notifications
            </label>
            <button
              type="button"
              onClick={() => updatePreference('notifications', 'push_notifications', !preferences.notifications.push_notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notifications.push_notifications ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                preferences.notifications.push_notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Session Reminders
            </label>
            <button
              type="button"
              onClick={() => updatePreference('notifications', 'session_reminders', !preferences.notifications.session_reminders)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notifications.session_reminders ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                preferences.notifications.session_reminders ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Progress Updates
            </label>
            <button
              type="button"
              onClick={() => updatePreference('notifications', 'progress_updates', !preferences.notifications.progress_updates)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notifications.progress_updates ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                preferences.notifications.progress_updates ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Reminder Frequency
            </label>
            <select
              value={preferences.notifications.reminder_frequency}
              onChange={(e) => updatePreference('notifications', 'reminder_frequency', e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Coaching */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          AI Coaching Preferences
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Coaching Style
            </label>
            <select
              value={preferences.ai_coaching.coaching_style}
              onChange={(e) => updatePreference('ai_coaching', 'coaching_style', e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              <option value="supportive">Supportive</option>
              <option value="balanced">Balanced</option>
              <option value="challenging">Challenging</option>
              <option value="direct">Direct</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Feedback Detail Level
            </label>
            <select
              value={preferences.ai_coaching.feedback_detail}
              onChange={(e) => updatePreference('ai_coaching', 'feedback_detail', e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              <option value="brief">Brief</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Difficulty Level
            </label>
            <select
              value={preferences.ai_coaching.difficulty_level}
              onChange={(e) => updatePreference('ai_coaching', 'difficulty_level', e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Enable Real-time Feedback
            </label>
            <button
              type="button"
              onClick={() => updatePreference('ai_coaching', 'enable_real_time_feedback', !preferences.ai_coaching.enable_real_time_feedback)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.ai_coaching.enable_real_time_feedback ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                preferences.ai_coaching.enable_real_time_feedback ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Focus Areas
            </label>
            <div className="grid grid-cols-2 gap-3">
              {focusAreaOptions.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleFocusArea(area)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    (preferences.ai_coaching.focus_areas || []).includes(area)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                >
                  {area.replace('_', ' ').charAt(0).toUpperCase() + area.replace('_', ' ').slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          Privacy Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Save Recordings
              </label>
              <p className="text-xs text-gray-500">Save voice recordings for review and improvement</p>
            </div>
            <button
              type="button"
              onClick={() => updatePreference('privacy', 'save_recordings', !preferences.privacy.save_recordings)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.privacy.save_recordings ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                preferences.privacy.save_recordings ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Share Analytics
              </label>
              <p className="text-xs text-gray-500">Help improve CelesteOS with anonymous usage data</p>
            </div>
            <button
              type="button"
              onClick={() => updatePreference('privacy', 'share_analytics', !preferences.privacy.share_analytics)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.privacy.share_analytics ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                preferences.privacy.share_analytics ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Data Retention (Days)
            </label>
            <select
              value={preferences.privacy.data_retention_days}
              onChange={(e) => updatePreference('privacy', 'data_retention_days', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
              <option value={-1}>Forever</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default PreferencesPanel;