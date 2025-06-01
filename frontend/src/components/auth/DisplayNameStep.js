import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DisplayNameStep = ({ email, onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get the auth token
      const token = localStorage.getItem('celeste7_user_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Call backend API to update display name
      const response = await fetch(`${backendUrl}/api/user/display-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: displayName.trim()
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
        const data = await response.json();
        throw new Error(data.detail || 'Failed to save display name');
      }
    } catch (err) {
      console.error('Display name error:', err);
      
      // Store display name locally anyway to allow user to continue
      localStorage.setItem('celeste7_display_name', displayName.trim());
      
      // Navigate to voice chat despite the error
      navigate('/voice-chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-gray-950 to-gray-900"></div>
      
      {/* Subtle glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-md w-full mx-auto p-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>Almost there!</h1>
          <p className="text-gray-400" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>What should we call you?</p>
        </div>

        {/* Display Name Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 backdrop-blur-sm"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              disabled={loading}
              maxLength={50}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800/30 rounded-2xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-blue-600/25 border border-blue-500/20"
            style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>This helps us personalize your experience</p>
        </div>
      </div>
    </div>
  );
};

export default DisplayNameStep;