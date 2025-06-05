import React, { createContext, useState, useEffect, useContext, useRef } from 'react';

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

// Backend URLs as fallback
const BACKEND_AUTH_URLS = {
  signup: `${process.env.REACT_APP_BACKEND_URL}/api/auth/signup`,
  login: `${process.env.REACT_APP_BACKEND_URL}/api/auth/signin`,
  logout: `${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`,
  refresh: `${process.env.REACT_APP_BACKEND_URL}/api/auth/refresh`
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Request deduplication at the context level
  const pendingRequests = useRef({
    signup: null,
    login: null,
    refresh: null,
    logout: null
  });

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
      
      // Try N8N direct first
      let response = await fetch(N8N_AUTH_URLS.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });

      console.log('N8N Direct signup response status:', response.status);

      // If N8N direct fails (CORS, 404, 500, etc.), try backend proxy ONCE (no retry)
      if (!response.ok || response.status >= 400) {
        console.log('N8N direct failed, trying backend proxy...');
        
        response = await fetch(BACKEND_AUTH_URLS.signup, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, firstName, lastName })
        });

        console.log('Backend proxy signup response status:', response.status);
      }

      const data = await response.json();
      console.log('Signup response data:', data);

      if (response.ok) {
        // Handle N8N session format
        if (data.session) {
          localStorage.setItem('access_token', data.session.access_token);
          localStorage.setItem('refresh_token', data.session.refresh_token);

          setUser({
            ...data.user,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });

          return { success: true, user: data.user };
        }
        // Handle direct token format (fallback)
        else if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }

          setUser({
            ...data,
            access_token: data.access_token
          });

          return { success: true, user: data };
        }
      }

      console.error('Signup failed:', data);
      return { success: false, error: data.error || data.detail || data.message || 'Signup failed' };
    } catch (error) {
      console.error('Signup network error:', error);
      return { success: false, error: `Network error: ${error.message}` };
    }
  };

  // Login method
  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      
      // Try N8N direct first
      let response = await fetch(N8N_AUTH_URLS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('N8N Direct login response status:', response.status);

      // If N8N direct fails (CORS, 404, 500, etc.), try backend proxy ONCE (no retry)
      if (!response.ok || response.status >= 400) {
        console.log('N8N direct failed, trying backend proxy...');
        
        response = await fetch(BACKEND_AUTH_URLS.login, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        console.log('Backend proxy login response status:', response.status);
      }

      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok) {
        // Handle N8N session format
        if (data.session) {
          localStorage.setItem('access_token', data.session.access_token);
          localStorage.setItem('refresh_token', data.session.refresh_token);

          setUser({
            ...data.user,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });

          return { success: true, user: data.user };
        }
        // Handle direct token format (fallback)
        else if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }

          setUser({
            ...data,
            access_token: data.access_token
          });

          return { success: true, user: data };
        }
      }

      console.error('Login failed:', data);
      return { success: false, error: data.error || data.detail || data.message || 'Login failed' };
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

  // Auth-aware fetch wrapper (NO AUTO-RETRY for auth endpoints)
  const authenticatedFetch = async (url, options = {}) => {
    const accessToken = localStorage.getItem('access_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // For auth endpoints, don't automatically retry - let user manually retry
    // Only handle 401 for non-auth endpoints (chat, etc.)
    if (response.status === 401 && !url.includes('/auth/')) {
      console.log('401 on non-auth endpoint, attempting token refresh...');
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        // Retry ONCE with new token
        const newAccessToken = localStorage.getItem('access_token');
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        return await fetch(url, {
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
