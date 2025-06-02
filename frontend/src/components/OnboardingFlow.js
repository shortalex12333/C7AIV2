import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { CheckIcon, UserCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OnboardingFlow = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    acceptedToS: false,
    acceptedPrivacy: false
  });

  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleDisplayNameSubmit = async (e) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      setError('Please enter a display name');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.acceptedToS || !formData.acceptedPrivacy) {
      setError('Please accept both Terms of Service and Privacy Policy to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call display name webhook
      const response = await axios.post(`${API}/user/display-name`, {
        userID: user.userID || user.UserID,
        displayName: formData.displayName
      });

      if (response.data) {
        // Complete onboarding
        completeOnboarding({
          displayName: formData.displayName,
          acceptedToS: true,
          acceptedPrivacy: true
        });
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-10 w-32 h-32 bg-teal-400 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{ 
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-10 w-48 h-48 bg-blue-600 rounded-full blur-3xl opacity-20"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Progress Indicator */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex justify-center mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 1 ? 'bg-accent-teal text-white' : 'bg-gray-700 text-gray-400'
            }`}>
              {step > 1 ? <CheckIcon className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-16 h-1 rounded ${
              step >= 2 ? 'bg-accent-teal' : 'bg-gray-700'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 2 ? 'bg-accent-teal text-white' : 'bg-gray-700 text-gray-400'
            }`}>
              2
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">C7</span>
            </div>
            <span className="text-2xl font-bold text-white">Celeste7</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 1 ? 'Welcome to the Elite' : 'Almost There!'}
          </h1>
          <p className="text-steel-gray">
            {step === 1 
              ? 'Let\'s set up your profile to get started' 
              : 'Accept our terms to begin your journey'
            }
          </p>
        </motion.div>

        {/* Onboarding Form */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="glass-effect-strong rounded-2xl p-8"
        >
          {step === 1 ? (
            // Step 1: Display Name
            <form onSubmit={handleDisplayNameSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <UserCircleIcon className="w-16 h-16 text-accent-teal mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  Choose Your Display Name
                </h2>
                <p className="text-steel-gray text-sm">
                  This is how other founders will see you in the community
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition-all duration-120"
                  placeholder="e.g., John the Founder"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-bull-red text-white px-6 py-3 rounded-lg font-semibold transition-all duration-120"
              >
                Continue
              </motion.button>
            </form>
          ) : (
            // Step 2: Terms & Privacy
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <DocumentTextIcon className="w-16 h-16 text-accent-teal mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  Terms & Privacy
                </h2>
                <p className="text-steel-gray text-sm">
                  Please review and accept our terms to continue
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="acceptedToS"
                    checked={formData.acceptedToS}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-accent-teal bg-gray-800 border-gray-600 rounded focus:ring-accent-teal focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">
                    I accept the{' '}
                    <a href="#" className="text-accent-teal hover:underline">
                      Terms of Service
                    </a>
                  </span>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="acceptedPrivacy"
                    checked={formData.acceptedPrivacy}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-accent-teal bg-gray-800 border-gray-600 rounded focus:ring-accent-teal focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">
                    I accept the{' '}
                    <a href="#" className="text-accent-teal hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex space-x-4">
                <motion.button
                  type="button"
                  onClick={() => setStep(1)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 glass-effect-strong text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-120 border-0"
                >
                  Back
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="flex-1 btn-bull-red text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-120"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Setting up...</span>
                    </div>
                  ) : (
                    'Complete Setup'
                  )}
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OnboardingFlow;