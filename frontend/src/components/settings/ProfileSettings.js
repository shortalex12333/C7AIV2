import React, { useState, useEffect } from 'react';
import { secureApiCall } from '../../utils/security';

const ProfileSettings = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    firstName: '',
    lastName: ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/profile`);
      
      if (response && !response.error) {
        setProfile({
          displayName: response.display_name || '',
          email: response.email || '',
          firstName: response.first_name || '',
          lastName: response.last_name || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          display_name: profile.displayName,
          first_name: profile.firstName,
          last_name: profile.lastName
        })
      });

      if (response && !response.error) {
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/change-password`, {
        method: 'PUT',
        body: JSON.stringify({
          current_password: passwords.currentPassword,
          new_password: passwords.newPassword
        })
      });

      if (response && !response.error) {
        setMessage('Password changed successfully!');
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setMessage('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setMessage('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/delete-account`, {
        method: 'DELETE'
      });

      if (response && !response.error) {
        // Clear all local data
        localStorage.clear();
        sessionStorage.clear();
        // Redirect to landing page
        window.location.href = '/';
      } else {
        setMessage('Failed to delete account');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      setMessage('Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
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

      {/* Profile Information */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          Profile Information
        </h3>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Display Name
            </label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              placeholder="Enter your display name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                placeholder="First name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Last Name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-gray-400 cursor-not-allowed"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          Change Password
        </h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Current Password
            </label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              placeholder="Enter current password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              New Password
            </label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div className="bg-red-900/20 border border-red-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-red-300 mb-4" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          Delete Account
        </h3>
        <p className="text-gray-300 text-sm mb-6" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          This action cannot be undone. All your data, conversations, and progress will be permanently deleted.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
            style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-red-300 font-medium" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Are you absolutely sure you want to delete your account?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;