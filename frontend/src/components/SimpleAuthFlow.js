import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SimpleAuthFlow = () => {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Request deduplication
  const pendingRequest = useRef(null);
  const lastSubmitTime = useRef(0);

  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isLoading || pendingRequest.current) return;
    
    // Debounce rapid submissions (prevent clicks within 1 second)
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000) {
      console.log('Request blocked - too rapid');
      return;
    }
    lastSubmitTime.current = now;

    setIsLoading(true);
    setError('');

    try {
      // Use pending request pattern to prevent duplicates
      if (pendingRequest.current) {
        return await pendingRequest.current;
      }

      pendingRequest.current = login(formData.email, formData.password);
      const result = await pendingRequest.current;

      if (result.success) {
        navigate('/chat');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
      pendingRequest.current = null;
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isLoading || pendingRequest.current) return;
    
    // Debounce rapid submissions (prevent clicks within 1 second)
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000) {
      console.log('Request blocked - too rapid');
      return;
    }
    lastSubmitTime.current = now;

    setIsLoading(true);
    setError('');

    try {
      // Use pending request pattern to prevent duplicates
      if (pendingRequest.current) {
        return await pendingRequest.current;
      }

      pendingRequest.current = signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      const result = await pendingRequest.current;

      if (result.success) {
        navigate('/chat');
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError('An error occurred during sign up');
    } finally {
      setIsLoading(false);
      pendingRequest.current = null;
    }
  };

  const handleModeToggle = () => {
    // Don't allow mode change during loading
    if (isLoading) return;
    
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI Chat Interface
          </h1>
          <p className="text-gray-400">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
              </div>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={handleModeToggle}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuthFlow;