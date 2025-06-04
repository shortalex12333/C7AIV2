import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import EnhancedAuthFlow from './components/EnhancedAuthFlow';
import MVPChatInterface from './components/MVPChatInterface';
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
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/auth" element={<EnhancedAuthFlow />} />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <MVPChatInterface />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;