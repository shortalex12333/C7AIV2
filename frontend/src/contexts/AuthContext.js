import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the auth context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// N8N Webhook URLs
const N8N_AUTH_URLS = {
  signup: 'https://ventruk.app.n8n.cloud/webhook/auth/signup',
  login: 'https://ventruk.app.n8n.cloud/webhook/auth/login',
  verifyToken: 'https://ventruk.app.n8n.cloud/webhook/auth/verify-token',
  logout: 'https://ventruk.app.n8n.cloud/webhook/auth/logout',
  refresh: 'https://ventruk.app.n8n.cloud/webhook/auth/refresh'
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage on component mount
  useEffect(() => {
    const initUser = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken) {
        try {
          // Verify token with N8N
          const response = await fetch(N8N_AUTH_URLS.verifyToken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: accessToken })
          });

          const data = await response.json();

          if (response.ok && data.valid) {
            setUser({
              ...data.user,
              access_token: accessToken,
              refresh_token: refreshToken
            });
          } else {
            // Token invalid, try to refresh
            if (refreshToken) {
              await refreshAccessToken();
            } else {
              // No refresh token, logout
              logout();
            }
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      }
      
      setLoading(false);
    };

    initUser();
  }, []);

  // Refresh access token
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      logout();
      return false;
    }

    try {
      const response = await fetch(N8N_AUTH_URLS.refresh, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      const data = await response.json();

      if (response.ok && data.session) {
        // Update tokens
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);

        setUser(prev => ({
          ...prev,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }));

        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Signup method
  const signup = async (email, password, firstName, lastName) => {
    try {
      console.log('Attempting signup with:', { email, firstName, lastName });
      
      const response = await fetch(N8N_AUTH_URLS.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });

      console.log('Signup response status:', response.status);
      console.log('Signup response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Signup response data:', data);

      if (response.ok && data.session) {
        // Store tokens
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);

        // Set user state
        setUser({
          ...data.user,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        return { success: true, user: data.user };
      } else {
        console.error('Signup failed:', data);
        return { success: false, error: data.error || data.message || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup network error:', error);
      return { success: false, error: `Network error: ${error.message}` };
    }
  };

  // Login method
  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      
      const response = await fetch(N8N_AUTH_URLS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok && data.session) {
        // Store tokens
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);

        // Set user state
        setUser({
          ...data.user,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        return { success: true, user: data.user };
      } else {
        console.error('Login failed:', data);
        return { success: false, error: data.error || data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login network error:', error);
      return { success: false, error: `Network error: ${error.message}` };
    }
  };

  // Logout method
  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        // Call N8N logout webhook
        await fetch(N8N_AUTH_URLS.logout, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();
    
    // Reset user state
    setUser(null);
  };

  // Auth-aware fetch wrapper
  const authenticatedFetch = async (url, options = {}) => {
    const accessToken = localStorage.getItem('access_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers
    });

    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401) {
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        // Retry with new token
        const newAccessToken = localStorage.getItem('access_token');
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers
        });
      }
    }

    return response;
  };

  // Context value
  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    refreshAccessToken,
    authenticatedFetch,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
