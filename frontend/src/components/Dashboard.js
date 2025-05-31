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
  const [isPlayingResponse, setIsPlayingResponse] = useState(null); // Track which message is playing audio
  const [recordingFormat, setRecordingFormat] = useState('wav'); // Track recording format (wav/webm)
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const sessionID = useRef(Date.now().toString());

  // WAV encoding function for audio buffer to WAV conversion
  const encodeWAV = (buffer) => {
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
  };

  // WAV conversion function for browsers that don't support native WAV recording
  const convertWebMToWav = async (webmBlob) => {
    const arrayBuf = await webmBlob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(arrayBuf);
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
      
      // Check support for WAV format first
      const wavMime = 'audio/wav';
      const preferredMime = MediaRecorder.isTypeSupported(wavMime)
        ? wavMime
        : 'audio/webm;codecs=opus';
      
      console.log(`Recording with MIME type: ${preferredMime}`);
      setRecordingFormat(preferredMime === wavMime ? 'wav' : 'webm');
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: preferredMime });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async (event) => {
        const recordedBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current.mimeType 
        });
        
        let wavBlob;
        
        if (recordedBlob.type === 'audio/wav') {
          // Already WAV format, use directly
          wavBlob = recordedBlob;
          console.log('Using native WAV recording');
        } else {
          // Convert WebM to WAV using Web Audio API
          console.log('Converting WebM to WAV for Wit.ai compatibility...');
          try {
            wavBlob = await convertWebMToWav(recordedBlob);
            console.log('WebM to WAV conversion completed successfully');
          } catch (conversionError) {
            console.error('WAV conversion failed:', conversionError);
            alert('Audio conversion failed. Please try again.');
            setIsProcessing(false);
            stream.getTracks().forEach(track => track.stop());
            return;
          }
        }
        
        // Send the WAV blob to n8n → Wit.ai
        await sendAudioToAPI(wavBlob);
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

  // Upload function that sends WAV blob to n8n → Wit.ai
  const uploadToN8n = async (wavBlob) => {
    try {
      // Ensure we always have a WAV blob
      console.log('Uploading WAV audio to n8n → Wit.ai', { 
        sessionId: sessionID.current, 
        blobSize: wavBlob.size,
        blobType: wavBlob.type,
        isWav: wavBlob.type === 'audio/wav'
      });

      // Build FormData with WAV blob
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      formData.append('sessionID', sessionID.current);

      // Set headers for WAV format
      const headers = {
        'Content-Type': 'audio/wav',
        'Authorization': `Bearer ${user.token}`,
      };

      // Send POST to production webhook (n8n forwards to Wit.ai)
      const response = await axios.post(
        'https://ventruk.app.n8n.cloud/webhook/voice-chat',
        formData,
        { headers }
      );
      
      // Handle successful response from Wit.ai via n8n
      const { ttsAudio, mimeType, transcript } = response.data;
      
      if (transcript) {
        // Add user message first
        const userMessage = {
          id: Date.now(),
          type: 'user',
          content: 'Voice message sent',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Add AI response with transcript
        const aiMessageId = Date.now() + 1;
        const aiMessage = {
          id: aiMessageId,
          type: 'ai',
          content: transcript,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Auto-play TTS audio if available
        if (ttsAudio && mimeType) {
          setTimeout(() => {
            playTTSAudio(ttsAudio, mimeType, aiMessageId);
          }, 300); // Small delay to let message render
        }
      }
    } catch (error) {
      console.error('Error uploading WAV audio to n8n → Wit.ai:', error);
      if (error.response?.status === 400) {
        alert('Audio format not supported by Wit.ai. Please try recording again.');
      } else {
        alert('Failed to process voice message. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to convert base64 audio to blob and auto-play
  const playTTSAudio = async (ttsAudio, mimeType, messageId) => {
    try {
      // Set playing state for visual feedback
      setIsPlayingResponse(messageId);
      
      // Decode base64 to Uint8Array
      const binary = atob(ttsAudio);
      const len = binary.length;
      const buffer = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        buffer[i] = binary.charCodeAt(i);
      }
      
      // Create blob with provided MIME type
      const audioBlob = new Blob([buffer], { type: mimeType });
      
      // Generate object URL and auto-play
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      
      // Handle playback events
      audio.onended = () => {
        setIsPlayingResponse(null);
        URL.revokeObjectURL(url); // Cleanup
      };
      
      audio.onerror = () => {
        console.error('Audio playback failed');
        setIsPlayingResponse(null);
        URL.revokeObjectURL(url);
        // Show error banner briefly
        setTimeout(() => {
          alert('⚠️ Audio failed; showing text only');
        }, 100);
      };
      
      // Auto-play immediately (iOS Safari compatible since it's in same user interaction)
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Autoplay blocked:', error);
          setIsPlayingResponse(null);
          URL.revokeObjectURL(url);
          // Show retry option
          setTimeout(() => {
            alert('🔊 Tap to play AI response');
          }, 100);
        });
      }
      
    } catch (error) {
      console.error('Error converting base64 audio:', error);
      setIsPlayingResponse(null);
      // Show fallback error
      setTimeout(() => {
        alert('⚠️ Audio failed; showing text only');
      }, 100);
    }
  };

  // Keep sendAudioToAPI as alias for backward compatibility
  const sendAudioToAPI = uploadToN8n;

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
                      : `chat-bubble-ai text-white ${
                          isPlayingResponse === message.id ? 'animate-pulse ring-2 ring-accent-teal/50' : ''
                        }`
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Audio playing indicator for AI messages */}
                  {message.type === 'ai' && isPlayingResponse === message.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center space-x-2 mt-2 text-xs text-accent-teal"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-accent-teal rounded-full"
                      />
                      <span>🔊 Playing response...</span>
                    </motion.div>
                  )}
                  
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