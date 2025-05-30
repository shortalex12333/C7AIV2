import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PaperAirplaneIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Ready to accelerate? What\'s your biggest challenge today?',
      timestamp: new Date()
    }
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || 'Founder');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const sessionID = useRef(Date.now().toString());

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToAPI(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to use voice chat.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const sendAudioToAPI = async (audioBlob) => {
    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        const payload = {
          userID: user.UserID || user.userID || 'temp_user',
          audioBlob: base64Audio,
          sessionID: sessionID.current
        };

        const response = await axios.post(`${API}/voice/chat`, payload);
        
        if (response.data && response.data.status === 'success') {
          // Add user message
          const userMessage = {
            id: Date.now(),
            type: 'user',
            content: 'Voice message sent',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          // Handle TTS response - check if it's a real URL or mock data
          if (response.data.ttsUrl && response.data.ttsUrl.startsWith('http')) {
            // Real TTS URL from webhook
            if (audioRef.current) {
              audioRef.current.src = response.data.ttsUrl;
              audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
          } else {
            // Mock response - skip audio playback
            console.log('Mock TTS response received - audio playback skipped');
          }
          
          // Add AI response with transcript
          setTimeout(() => {
            const aiMessage = {
              id: Date.now() + 1,
              type: 'ai',
              content: response.data.transcript || 'Voice response received',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
          }, 500);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error sending audio:', error);
      alert('Failed to process voice message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const WaveformRecorder = () => (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        {/* Waveform Animation */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-1 rounded-full bg-gradient-to-t from-teal-400 to-blue-600 ${
                isRecording ? 'waveform-bar' : 'h-4 opacity-40'
              }`}
              animate={isRecording ? {
                height: [16, Math.random() * 40 + 20, 16],
                opacity: [0.4, 1, 0.4]
              } : {}}
              transition={{
                duration: 0.5,
                repeat: isRecording ? Infinity : 0,
                delay: i * 0.1
              }}
            />
          ))}
        </div>

        {/* Record Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center font-semibold transition-all duration-200 ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 recording-pulse' 
              : isProcessing
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-400 to-blue-600 hover:from-teal-500 hover:to-blue-700'
          }`}
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
            />
          ) : isRecording ? (
            <StopIcon className="w-8 h-8 text-white" />
          ) : (
            <MicrophoneIcon className="w-8 h-8 text-white" />
          )}
        </motion.button>

        {/* Status Text */}
        <motion.p
          key={isRecording ? 'recording' : isProcessing ? 'processing' : 'ready'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-4 text-sm text-gray-400"
        >
          {isProcessing 
            ? 'Processing your voice...' 
            : isRecording 
            ? 'Listening... Tap to stop' 
            : 'Tap to speak with Celeste7'
          }
        </motion.p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed left-0 top-0 h-full w-80 bg-gray-900/95 z-50 glass-effect-strong backdrop-blur-2xl"
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">C7</span>
                </div>
                <span className="text-xl font-bold">Celeste7</span>
              </div>

              {/* User Profile */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <UserCircleIcon className="w-12 h-12 text-gray-400" />
                  <div>
                    <h3 className="font-semibold">{displayName}</h3>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4 mb-8">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800/50 transition-all duration-120"
                >
                  <ChartBarIcon className="w-5 h-5 text-teal-400" />
                  <span>Performance Analytics</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800/50 transition-all duration-120"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
                  <span>Settings</span>
                </motion.button>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-900/20 text-red-400 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-gray-800/50 glass-effect">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-120"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className="w-full h-0.5 bg-white"></div>
                <div className="w-full h-0.5 bg-white"></div>
                <div className="w-full h-0.5 bg-white"></div>
              </div>
            </motion.button>
            
            <h1 className="text-xl font-bold">Voice Chat</h1>
            
            <div className="w-10"></div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'chat-bubble-user text-white'
                      : 'chat-bubble-ai text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Voice Recorder */}
        <div className="border-t border-gray-800">
          <WaveformRecorder />
        </div>

        {/* Quick Reply Pills */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "What's my focus today?",
              "Review my metrics",
              "Motivation boost",
              "Quick check-in"
            ].map((pill, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
              >
                {pill}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden Audio Element for TTS Playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Overlay for Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;