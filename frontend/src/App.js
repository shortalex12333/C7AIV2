import React from 'react';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
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
                    <EnhancedSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/old-settings" 
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