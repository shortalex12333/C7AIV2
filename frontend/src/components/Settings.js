import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  ArrowLeftIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  React.useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleDisplayNameUpdate = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API}/user/display-name`, {
        userID: user.userID || user.UserID,
        displayName: displayName.trim()
      });

      if (response.data) {
        updateUser({ displayName: displayName.trim() });
        setSuccess('Display name updated successfully');
        setEditingDisplayName(false);
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to update display name. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-gray-800/50 glass-effect sticky top-0 z-10"
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-120"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </motion.button>
          
          <h1 className="text-xl font-bold">Settings</h1>
          
          <div className="w-24"></div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-8">
        {/* Account Details Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="glass-effect-strong rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <UserCircleIcon className="w-6 h-6 text-accent-teal" />
            <h2 className="text-xl font-semibold">Account Details</h2>
          </div>

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || 'user@example.com'}
                disabled
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed for security reasons
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value="••••••••••••"
                  disabled
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Contact support to change your password
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              {editingDisplayName ? (
                <form onSubmit={handleDisplayNameUpdate} className="space-y-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition-all duration-120"
                    placeholder="Enter your display name"
                    required
                  />
                  <div className="flex space-x-3">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="btn-bull-red text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-all duration-120"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setEditingDisplayName(false);
                        setDisplayName(user?.displayName || '');
                        setError('');
                        setSuccess('');
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="glass-effect text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/10 transition-all duration-120 border-0"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {user?.displayName || 'Not set'}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingDisplayName(true)}
                    className="flex items-center space-x-1 text-accent-teal hover:text-teal-300 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm"
              >
                {success}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Documents Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="glass-effect-strong rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <DocumentTextIcon className="w-6 h-6 text-accent-teal" />
            <h2 className="text-xl font-semibold">Legal Documents</h2>
          </div>

          <div className="space-y-4">
            <motion.a
              href="#"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between p-4 glass-effect rounded-lg hover:bg-white/10 transition-all duration-120"
            >
              <div>
                <h3 className="font-medium text-white">Terms of Service</h3>
                <p className="text-sm text-gray-400">Our terms and conditions</p>
              </div>
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
            </motion.a>

            <motion.a
              href="#"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between p-4 glass-effect rounded-lg hover:bg-white/10 transition-all duration-120"
            >
              <div>
                <h3 className="font-medium text-white">Privacy Policy</h3>
                <p className="text-sm text-gray-400">How we handle your data</p>
              </div>
              <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
            </motion.a>
          </div>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="glass-effect-strong rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold mb-6">Account Actions</h2>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="w-full flex items-center justify-between p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-900/30 transition-all duration-120"
          >
            <div className="flex items-center space-x-3">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </div>
            <span className="text-sm text-red-300">
              Sign out of your account
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;