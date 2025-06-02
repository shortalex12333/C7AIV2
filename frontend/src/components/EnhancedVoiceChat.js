import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './voice-chat/Sidebar';
import MessageDisplay from './voice-chat/MessageDisplay';
import { secureApiCall, initializeSession } from '../utils/security';

const EnhancedVoiceChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Voice chat states (keeping existing functionality)
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(null);
  const [conversationState, setConversationState] = useState('idle');
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // Get user from localStorage instead of context
  const user = {
    userId: localStorage.getItem('celeste7_user_id'),
    email: localStorage.getItem('celeste7_user_email'),
    displayName: localStorage.getItem('celeste7_display_name')
  };

  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Initialize security session
  useEffect(() => {
    initializeSession();
  }, []);

  // Load recent conversations
  const loadRecentConversations = async () => {
    if (!user?.userId) return;

    try {
      const response = await secureApiCall(`${backendUrl}/api/conversation-history`, {
        method: 'GET'
      });

      if (response.success !== false && response.conversations) {
        setConversations(response.conversations.slice(-5)); // Last 5 conversations
      }
    } catch (err) {
      console.error('Failed to load recent conversations:', err);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      loadRecentConversations();
    }
  }, [user?.userId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Voice chat functionality (simplified - keeping core features)
  const startRecording = () => {
    setIsRecording(true);
    setConversationState('recording');
    console.log('🎤 Starting recording...');
    // TODO: Implement actual recording logic
  };

  const stopRecording = () => {
    setIsRecording(false);
    setConversationState('processing');
    console.log('⏹️ Stopping recording...');
    // TODO: Implement actual stop recording logic
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    setConversationState(isListening ? 'idle' : 'listening');
    console.log(`🎧 ${isListening ? 'Disabling' : 'Enabling'} hands-free mode...`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userId={user.userId}
      />

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        
        {/* Header */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            
            {/* Left side - hamburger and title */}
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              
              <h1 className="text-xl font-semibold">Voice Chat</h1>
            </div>

            {/* Right side - user info */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-400 text-sm">
                {localStorage.getItem('celeste7_display_name') || 'User'}
              </span>
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                {(localStorage.getItem('celeste7_display_name') || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <MessageDisplay conversations={conversations} />
          </div>
        </div>

        {/* Voice Controls (Bottom) */}
        <div className="border-t border-gray-800 p-6">
          <div className="max-w-4xl mx-auto">
            
            {/* Status Display */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-full">
                <div className={`w-2 h-2 rounded-full ${
                  conversationState === 'listening' ? 'bg-green-400' :
                  conversationState === 'recording' ? 'bg-red-400' :
                  conversationState === 'processing' ? 'bg-yellow-400' :
                  'bg-gray-400'
                }`}></div>
                <span className="text-sm capitalize text-gray-300">
                  {conversationState === 'listening' ? 'Listening for voice' :
                   conversationState === 'recording' ? 'Recording...' :
                   conversationState === 'processing' ? 'Processing...' :
                   'Ready'}
                </span>
              </div>
            </div>

            {/* Voice Level Indicator */}
            {(isListening || isRecording) && (
              <div className="mb-4">
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-orange-400 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(voiceLevel * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Main Controls */}
            <div className="flex justify-center items-center space-x-6">
              
              {/* Hands-free Toggle */}
              <button
                onClick={toggleListening}
                className={`p-3 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Manual Record Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 scale-110'
                    : 'bg-orange-600 hover:bg-orange-700'
                } text-white shadow-lg`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isRecording ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
              </button>

              {/* Settings/Sensitivity */}
              <button
                onClick={() => navigate('/settings')}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* Instructions */}
            <div className="text-center mt-6 text-gray-400 text-sm">
              {isListening ? (
                <p>Hands-free mode active • Just speak naturally</p>
              ) : (
                <p>Press and hold the record button or enable hands-free mode</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVoiceChat;