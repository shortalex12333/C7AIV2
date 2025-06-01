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
        
        // Set auth context
        login({
          userId: data.user_id,
          email: data.email,
          accessToken: data.access_token
        });

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
        
        // Set auth context
        login({
          userId: data.user_id,
          email: data.email,
          accessToken: data.access_token
        });

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
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-orange-400">Celeste7</h1>
          <p className="text-gray-400">
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
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="text-center mt-6">
          {mode === 'signin' ? (
            <p className="text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-orange-400 hover:text-orange-300 font-medium"
                disabled={loading}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-orange-400 hover:text-orange-300 font-medium"
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