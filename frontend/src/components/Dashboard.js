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
  const [recordingFormat, setRecordingFormat] = useState('wav'); // Track what format we're using
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const sessionID = useRef(Date.now().toString());

  // WAV conversion function for browsers that don't support native WAV recording
  const convertWebMToWav = async (webmBlob) => {
    const arrayBuf = await webmBlob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(arrayBuf);

    function encodeWAV(buffer) {
      const numCh = buffer.numberOfChannels;
      const sr = buffer.sampleRate;
      const bd = 16;
      const blockAlign = numCh * (bd / 8);
      const byteRate = sr * blockAlign;
      const dataLen = buffer.length * blockAlign;
      const view = new DataView(new ArrayBuffer(44 + dataLen));
      let offset = 0;
      
      const writeString = (s) => {
        for (let i = 0; i < s.length; i++) {
          view.setUint8(offset + i, s.charCodeAt(i));
        }
        offset += s.length;
      };
      
      writeString('RIFF');
      view.setUint32(offset, 36 + dataLen, true); offset += 4;
      writeString('WAVE');
      writeString('fmt ');
      view.setUint32(offset, 16, true); offset += 4;
      view.setUint16(offset, 1, true); offset += 2;        // PCM format
      view.setUint16(offset, numCh, true); offset += 2;
      view.setUint32(offset, sr, true); offset += 4;
      view.setUint32(offset, byteRate, true); offset += 4;
      view.setUint16(offset, blockAlign, true); offset += 2;
      view.setUint16(offset, bd, true); offset += 2;
      writeString('data');
      view.setUint32(offset, dataLen, true); offset += 4;
      
      const interleaved = new Int16Array(buffer.length * numCh);
      for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numCh; ch++) {
          let sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
          interleaved[i * numCh + ch] = sample < 0
            ? sample * 0x8000
            : sample * 0x7FFF;
        }
      }
      
      for (let i = 0; i < interleaved.length; i++, offset += 2) {
        view.setInt16(offset, interleaved[i], true);
      }
      
      return view.buffer;
    }

    const wavArrayBuf = encodeWAV(decoded);
    return new Blob([wavArrayBuf], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Try WAV format first (preferred for direct Wit.ai compatibility)
      let mediaRecorderOptions = { mimeType: 'audio/wav' };
      let usingWav = true;
      
      // Check if WAV is supported, fallback to WebM if not
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        console.log('WAV not supported, falling back to WebM/Opus');
        mediaRecorderOptions = { mimeType: 'audio/webm;codecs=opus' };
        usingWav = false;
      }
      
      setRecordingFormat(usingWav ? 'wav' : 'webm');
      
      mediaRecorderRef.current = new MediaRecorder(stream, mediaRecorderOptions);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const recordedBlob = new Blob(audioChunksRef.current, { 
          type: usingWav ? 'audio/wav' : 'audio/webm' 
        });
        
        let finalWavBlob;
        
        if (usingWav) {
          // Already WAV format, use directly
          finalWavBlob = recordedBlob;
          console.log('Using native WAV recording');
        } else {
          // Convert WebM to WAV using Web Audio API
          console.log('Converting WebM to WAV...');
          try {
            const arrayBuffer = await recordedBlob.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const decoded = await audioCtx.decodeAudioData(arrayBuffer);
            const wavArrayBuffer = encodeWAV(decoded);
            finalWavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
            console.log('WebM to WAV conversion completed');
          } catch (conversionError) {
            console.error('WAV conversion failed:', conversionError);
            alert('Audio conversion failed. Please try again.');
            setIsProcessing(false);
            stream.getTracks().forEach(track => track.stop());
            return;
          }
        }
        
        // Send the WAV blob to the API
        await sendAudioToAPI(finalWavBlob);
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

  const sendAudioToAPI = async (wavBlob) => {
    try {
      // Build FormData correctly - wavBlob should always be type 'audio/wav'
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      formData.append('sessionID', sessionID.current);

      // Set exact headers for WAV format
      const headers = {
        'Content-Type': 'audio/wav',
        'Authorization': `Bearer ${user.token}`,
      };

      // Debug log before sending
      console.log('Sending WAV audio to voice-chat webhook', { 
        sessionId: sessionID.current, 
        blob: wavBlob,
        blobSize: wavBlob.size,
        blobType: wavBlob.type,
        recordingFormat: recordingFormat
      });

      // Send POST to production webhook
      const response = await axios.post(
        'https://ventruk.app.n8n.cloud/webhook/voice-chat',
        formData,
        { headers }
      );
      
      // Handle response
      const { ttsUrl, transcript } = response.data;
      
      if (ttsUrl && transcript) {
        // Add user message
        const userMessage = {
          id: Date.now(),
          type: 'user',
          content: 'Voice message sent',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Play TTS response
        if (audioRef.current) {
          audioRef.current.src = ttsUrl;
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Add AI response with transcript
        setTimeout(() => {
          const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: transcript,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 500);
      }
    } catch (error) {
      console.error('Error sending WAV audio to voice-chat webhook:', error);
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
                    <h3 className="font-semibold">{user?.email?.split('@')[0] || 'Founder'}</h3>
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