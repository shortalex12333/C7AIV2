import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DisplayNameStep = ({ email, onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call N8N webhook to update profile
      const response = await fetch('https://ventruk.app.n8n.cloud/webhook/profile-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': localStorage.getItem('celeste7_user_token') || 'temp_token',
          'X-Session-ID': sessionStorage.getItem('celeste7_session_id') || 'temp_session',
          'X-Request-ID': `req_${Date.now()}`,
          'X-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify({
          email,
          display_name: displayName.trim(),
          action: 'set_display_name',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Store display name locally
        localStorage.setItem('celeste7_display_name', displayName.trim());
        
        // Complete signup process
        onComplete(displayName.trim());
        
        // Navigate to voice chat
        navigate('/voice-chat');
      } else {
        throw new Error('Failed to save display name');
      }
    } catch (err) {
      console.error('Display name error:', err);
      setError('Failed to save your name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Almost there!</h1>
          <p className="text-gray-400">What should we call you?</p>
        </div>

        {/* Display Name Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              disabled={loading}
              maxLength={50}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>This helps us personalize your experience</p>
        </div>
      </div>
    </div>
  );
};

export default DisplayNameStep;