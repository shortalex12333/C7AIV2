import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DisplayNameStep from './auth/DisplayNameStep';

const EnhancedAuthFlow = () => {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'display_name'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });
  const [signupEmail, setSignupEmail] = useState(''); // Store email for display name step
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store auth data
        localStorage.setItem('celeste7_user_token', data.access_token);
        localStorage.setItem('celeste7_user_id', data.user_id);
        localStorage.setItem('celeste7_user_email', data.email);
        
        // Auth data is stored in localStorage

        // Direct redirect to voice chat
        navigate('/voice-chat');
      } else {
        setError(data.detail || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || formData.email.split('@')[0] // Default name from email
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store auth data
        localStorage.setItem('celeste7_user_token', data.access_token);
        localStorage.setItem('celeste7_user_id', data.user_id);
        localStorage.setItem('celeste7_user_email', data.email);
        
        // Auth data is stored in localStorage

        // Store email for display name step
        setSignupEmail(formData.email);
        
        // Move to display name step
        setMode('display_name');
      } else {
        setError(data.detail || 'Signup failed');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisplayNameComplete = (displayName) => {
    // Display name is handled in DisplayNameStep component
    console.log('Display name set:', displayName);
  };

  // Render display name step
  if (mode === 'display_name') {
    return (
      <DisplayNameStep 
        email={signupEmail}
        onComplete={handleDisplayNameComplete}
      />
    );
  }

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
          <h1 className="text-4xl font-semibold mb-2 text-blue-400" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            Celeste<span className="text-white">OS</span>
          </h1>
          <p className="text-gray-400" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            {mode === 'signin' ? 'Welcome back' : 'Get started with your AI coach'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-6">
          
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email address"
              required
              className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 backdrop-blur-sm"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              disabled={loading}
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
              className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 backdrop-blur-sm"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800/30 rounded-2xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-blue-600/25 border border-blue-500/20"
            style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
          >
            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="text-center mt-6">
          {mode === 'signin' ? (
            <p className="text-gray-400" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={loading}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-gray-400" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuthFlow;