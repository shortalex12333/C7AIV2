import React, { useState, useEffect } from 'react';
import { secureApiCall } from '../../utils/security';

const ProfileSettings = ({ userId }) => {
  const [profile, setProfile] = useState({
    displayName: localStorage.getItem('celeste7_display_name') || '',
    email: localStorage.getItem('celeste7_user_email') || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleInputChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
    // Clear messages on input change
    setMessage({ type: '', text: '' });
  };

  const handleDisplayNameUpdate = async (e) => {
    e.preventDefault();
    
    if (!profile.displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name cannot be empty' });
      return;
    }

    setLoading(true);
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
          user_id: userId,
          email: profile.email,
          display_name: profile.displayName.trim(),
          action: 'update_display_name',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Update local storage
        localStorage.setItem('celeste7_display_name', profile.displayName.trim());
        setMessage({ type: 'success', text: 'Display name updated successfully!' });
      } else {
        throw new Error('Failed to update display name');
      }
    } catch (err) {
      console.error('Display name update error:', err);
      setMessage({ type: 'error', text: 'Failed to update display name. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!profile.currentPassword || !profile.newPassword || !profile.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (profile.newPassword !== profile.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (profile.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      // Call backend API to change password
      const response = await secureApiCall(`${process.env.REACT_APP_BACKEND_URL}/api/auth/change-password`, {
        method: 'POST',
        body: {
          user_id: userId,
          current_password: profile.currentPassword,
          new_password: profile.newPassword
        }
      });

      if (response.success !== false) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setProfile({
          ...profile,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordChange(false);
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to change password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // Call backend API to delete account
      const response = await secureApiCall(`${process.env.REACT_APP_BACKEND_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        body: {
          user_id: userId,
          email: profile.email
        }
      });

      if (response.success !== false) {
        // Clear all local data
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to home
        window.location.href = '/';
      } else {
        throw new Error(response.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Account deletion error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to delete account. Please try again.' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold mb-6">Profile Settings</h2>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Display Name Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Display Name</h3>
          <form onSubmit={handleDisplayNameUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                name="displayName"
                value={profile.displayName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="Enter your display name"
                disabled={loading}
                maxLength={50}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !profile.displayName.trim()}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Updating...' : 'Update Name'}
            </button>
          </form>
        </div>

        {/* Email Section (Read-only) */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Email Address</h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
              disabled
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Email address cannot be changed
            </p>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Password</h3>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-orange-400 hover:text-orange-300 text-sm font-medium"
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordChange && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={profile.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Enter current password"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={profile.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Enter new password"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={profile.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Confirm new password"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>

        {/* Delete Account Section */}
        <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-gray-300 text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-red-300 text-sm font-medium">
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete Account'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;