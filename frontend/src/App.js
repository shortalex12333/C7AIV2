import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import LandingPage from './components/LandingPage';
import SimplifiedLanding from './components/SimplifiedLanding';
import AuthPage from './components/AuthPage';
import EnhancedAuthFlow from './components/EnhancedAuthFlow';
import Dashboard from './components/Dashboard';
import MainDashboard from './components/MainDashboard';
import EnhancedVoiceChat from './components/EnhancedVoiceChat';
import OnboardingFlow from './components/OnboardingFlow';
import Settings from './components/Settings';
import EnhancedSettings from './components/EnhancedSettings';

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('celeste7_user');
    const onboardingComplete = localStorage.getItem('celeste7_onboarding_complete');
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Check if user needs onboarding (new signup without display name)
      if (!onboardingComplete && userData.status === 'success' && !userData.displayName) {
        setNeedsOnboarding(true);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('celeste7_user', JSON.stringify(userData));
    
    // Check if this is a new signup that needs onboarding
    if (userData.status === 'success' && !userData.displayName && !userData.email) {
      setNeedsOnboarding(true);
    }
  };

  const completeOnboarding = (updatedUserData) => {
    const completeUser = { ...user, ...updatedUserData };
    setUser(completeUser);
    localStorage.setItem('celeste7_user', JSON.stringify(completeUser));
    localStorage.setItem('celeste7_onboarding_complete', 'true');
    setNeedsOnboarding(false);
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('celeste7_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setNeedsOnboarding(false);
    localStorage.removeItem('celeste7_user');
    localStorage.removeItem('celeste7_onboarding_complete');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    needsOnboarding,
    completeOnboarding,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, needsOnboarding } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  
  return children;
};

// Onboarding Route Component
const OnboardingRoute = ({ children }) => {
  const { user, loading, needsOnboarding } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-black" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!needsOnboarding) return <Navigate to="/dashboard" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="App bg-black min-h-screen mobile-viewport-fix ios-optimized">
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<SimplifiedLanding />} />
              <Route path="/old-landing" element={<LandingPage />} />
              <Route path="/auth" element={<EnhancedAuthFlow />} />
              <Route path="/old-auth" element={<AuthPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <MainDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/voice-chat" 
                element={
                  <ProtectedRoute>
                    <EnhancedVoiceChat />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/old-voice-chat" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute>
                    <OnboardingFlow />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;