import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the auth context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage on component mount
  useEffect(() => {
    const initUser = () => {
      const userId = localStorage.getItem('celeste7_user_id');
      const userEmail = localStorage.getItem('celeste7_user_email');
      const displayName = localStorage.getItem('celeste7_display_name');
      const token = localStorage.getItem('celeste7_user_token');

      if (userId && token) {
        setUser({
          userId,
          email: userEmail,
          displayName,
          token
        });
      }
      
      setLoading(false);
    };

    initUser();
  }, []);

  // Auth methods
  const login = (userData) => {
    // Store auth data in localStorage
    localStorage.setItem('celeste7_user_token', userData.access_token);
    localStorage.setItem('celeste7_user_id', userData.user_id);
    localStorage.setItem('celeste7_user_email', userData.email);
    if (userData.display_name) {
      localStorage.setItem('celeste7_display_name', userData.display_name);
    }

    // Update user state
    setUser({
      userId: userData.user_id,
      email: userData.email,
      displayName: userData.display_name,
      token: userData.access_token
    });
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('celeste7_user_token');
    localStorage.removeItem('celeste7_user_id');
    localStorage.removeItem('celeste7_user_email');
    localStorage.removeItem('celeste7_display_name');
    sessionStorage.clear();
    
    // Reset user state
    setUser(null);
  };

  const updateProfile = (profileData) => {
    if (profileData.display_name) {
      localStorage.setItem('celeste7_display_name', profileData.display_name);
    }

    setUser(prev => ({
      ...prev,
      ...profileData
    }));
  };

  // Context value
  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
