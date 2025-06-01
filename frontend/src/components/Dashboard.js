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
  
  // Enhanced voice states for hands-free operation
  const [conversationState, setConversationState] = useState('idle');
  const [isListening, setIsListening] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [silenceTimer, setSilenceTimer] = useState(null);
  
  // Voice detection configuration (adjusted based on real-world testing)
  const [voiceThreshold, setVoiceThreshold] = useState(0.063); // 16/255 = 0.063 (volume > 16)
  const [silenceThreshold, setSilenceThreshold] = useState(0.063); // Same as voice threshold
  const [silenceTimeout, setSilenceTimeout] = useState(1200); // 1.2 seconds
  const [minimumVolumeRequired, setMinimumVolumeRequired] = useState(0.063); // Must exceed 16 to start
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const sessionID = useRef(Date.now().toString());
  
  // Voice Activity Detection refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const voiceDetectionIntervalRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Conversation states
  const conversationStates = {
    IDLE: 'idle',           // Ready to listen
    LISTENING: 'listening', // Detecting voice activity  
    RECORDING: 'recording', // Actively recording audio
    PROCESSING: 'processing', // Sending/waiting for response
    PLAYING: 'playing',     // TTS audio playing
    INTERRUPTED: 'interrupted' // User interrupted during TTS
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔄 Conversation state changed to:', conversationState);
  }, [conversationState]);

  // Initialize hands-free voice detection with better error handling
  const initializeVoiceDetection = async () => {
    try {
      console.log('🎤 Initializing hands-free voice detection...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }
      
      // Get microphone access with detailed constraints
      console.log('📱 Requesting microphone permissions...');
      microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      console.log('✅ Microphone access granted');
      console.log('🎵 Audio stream details:', {
        active: microphoneStreamRef.current.active,
        tracks: microphoneStreamRef.current.getAudioTracks().length,
        trackSettings: microphoneStreamRef.current.getAudioTracks()[0]?.getSettings()
      });

      // Create audio context for real-time analysis
      console.log('🎧 Creating audio context...');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContextRef.current.state === 'suspended') {
        console.log('▶️ Resuming suspended audio context...');
        await audioContextRef.current.resume();
      }
      
      console.log('🎧 Audio context state:', audioContextRef.current.state);
      
      const source = audioContextRef.current.createMediaStreamSource(microphoneStreamRef.current);
      
      // Create analyser for voice activity detection
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      console.log('📊 Analyser created:', {
        fftSize: analyserRef.current.fftSize,
        frequencyBinCount: analyserRef.current.frequencyBinCount,
        smoothingTimeConstant: analyserRef.current.smoothingTimeConstant
      });
      
      source.connect(analyserRef.current);
      console.log('🔗 Audio pipeline connected');
      
      // Start continuous voice monitoring
      startVoiceDetection();
      
      // Force state to listening mode
      console.log('🔄 Setting conversation state to LISTENING...');
      setConversationState(conversationStates.LISTENING);
      setIsListening(true);
      
      // Double-check state after brief delay
      setTimeout(() => {
        console.log('🔍 State check after initialization:', {
          conversationState: conversationState,
          LISTENING_constant: conversationStates.LISTENING,
          isListening: isListening,
          stateMatches: conversationState === conversationStates.LISTENING
        });
      }, 100);
      
      console.log('✅ Voice detection initialized successfully');
      console.log('🎯 Voice threshold:', voiceThreshold, 'Silence threshold:', silenceThreshold);
      
    } catch (error) {
      console.error('❌ Failed to initialize voice detection:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'NotAllowedError') {
        alert('❌ Microphone access denied. Please allow microphone permissions and refresh the page to use hands-free mode.');
      } else if (error.name === 'NotFoundError') {
        alert('❌ No microphone found. Please connect a microphone and refresh the page.');
      } else {
        alert('❌ Failed to initialize voice detection: ' + error.message);
      }
      
      setConversationState(conversationStates.IDLE);
      setIsListening(false);
    }
  };

  // Enhanced Voice Activity Detection with minimum volume requirements
  const detectVoiceActivity = () => {
    if (!analyserRef.current) {
      console.log('No analyser available');
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume level
    const averageVolume = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalizedVolume = averageVolume / 255; // Normalize to 0-1
    
    // Debug logging every 3 seconds to monitor levels
    if (Date.now() % 3000 < 300) {
      console.log('🎤 Voice Detection Debug:', {
        averageVolume: Math.round(averageVolume * 10) / 10,
        normalizedVolume: Math.round(normalizedVolume * 1000) / 1000,
        voiceThreshold,
        conversationState,
        aboveMinimum: averageVolume > 16,
        rawVolume16Plus: averageVolume > 16 ? '✅ LOUD ENOUGH' : '❌ Too quiet',
        meetsThreshold: normalizedVolume > voiceThreshold ? '✅ ABOVE THRESHOLD' : '❌ Below threshold',
        readyToRecord: (normalizedVolume > voiceThreshold && averageVolume > 16) ? '🎤 READY TO RECORD!' : '⏸️ Not ready'
      });
    }

    // FIXED RULE 1: Voice detected AND above minimum volume (16+) - start recording
    // Check for BOTH 'listening' and 'idle' states since state management is buggy
    if (normalizedVolume > voiceThreshold && 
        averageVolume > 16 && 
        (conversationState === 'listening' || conversationState === 'idle')) {
      
      console.log('🎤 VOICE TRIGGER! Volume:', Math.round(averageVolume), 'State:', conversationState);
      console.log('🔄 FORCING: IDLE/LISTENING → RECORDING');
      setConversationState('recording');
      startHandsFreeRecording();
    }
    
    // RULE 2: Voice detected during TTS playback - INTERRUPT IMMEDIATELY
    else if (normalizedVolume > voiceThreshold && 
             averageVolume > 16 && 
             conversationState === 'playing') {
      
      console.log('⚡ INTERRUPTION! Volume:', Math.round(averageVolume), 'Stopping TTS...');
      
      // Stop current TTS immediately
      if (window.currentTTSAudio) {
        window.currentTTSAudio.pause();
        window.currentTTSAudio.currentTime = 0;
        window.currentTTSAudio = null;
      }
      
      setIsPlayingResponse(null);
      setConversationState('interrupted');
      
      // Start new recording immediately
      setTimeout(() => {
        console.log('🎤 New recording after interruption...');
        setConversationState('recording');
        startHandsFreeRecording();
      }, 100);
    }
    
    // RULE 3: Silence detected while recording (volume < 16) - start silence timer
    else if (averageVolume < 16 && conversationState === 'recording') {
      if (!silenceTimerRef.current) {
        console.log('🔇 SILENCE detected, 1200ms timer started. Volume:', Math.round(averageVolume));
        silenceTimerRef.current = setTimeout(() => {
          console.log('⏰ TIMEOUT! Stopping recording and sending to webhook...');
          stopHandsFreeRecording();
        }, silenceTimeout);
      }
    }
    
    // RULE 4: Voice resumed during silence timer (volume > 16) - cancel timeout  
    else if (averageVolume > 16 && 
             conversationState === 'recording' && 
             silenceTimerRef.current) {
      
      console.log('🎤 VOICE RESUMED! Canceling timeout. Volume:', Math.round(averageVolume));
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // Start continuous voice monitoring (reduced frequency)
  const startVoiceDetection = () => {
    if (voiceDetectionIntervalRef.current) return;
    
    voiceDetectionIntervalRef.current = setInterval(detectVoiceActivity, 300); // Reduced to 300ms to prevent UI jumping
    console.log('Voice detection monitoring started');
  };

  // Stop voice monitoring
  const stopVoiceDetection = () => {
    if (voiceDetectionIntervalRef.current) {
      clearInterval(voiceDetectionIntervalRef.current);
      voiceDetectionIntervalRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    console.log('Voice detection monitoring stopped');
  };
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

  // Hands-free recording functions
  const startHandsFreeRecording = async () => {
    try {
      // Use the same stream for recording that we're using for detection
      const stream = microphoneStreamRef.current;
      if (!stream) {
        throw new Error('No microphone stream available');
      }

      // Check WAV support and initialize MediaRecorder
      const wavMime = 'audio/wav';
      const preferredMime = MediaRecorder.isTypeSupported(wavMime) ? wavMime : 'audio/webm;codecs=opus';
      
      console.log(`Hands-free recording with MIME type: ${preferredMime}`);
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
          wavBlob = recordedBlob;
          console.log('Using native WAV recording');
        } else {
          console.log('Converting WebM to WAV for Wit.ai compatibility...');
          try {
            wavBlob = await convertWebMToWav(recordedBlob);
            console.log('WebM to WAV conversion completed successfully');
          } catch (conversionError) {
            console.error('WAV conversion failed:', conversionError);
            alert('Audio conversion failed. Please try again.');
            setConversationState(conversationStates.LISTENING);
            return;
          }
        }
        
        // Process the audio
        await uploadToN8n(wavBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to start hands-free recording:', error);
      setConversationState(conversationStates.LISTENING);
    }
  };

  const stopHandsFreeRecording = () => {
    if (mediaRecorderRef.current && conversationState === conversationStates.RECORDING) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setConversationState(conversationStates.PROCESSING);
      
      // Clear any pending silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  };
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

  // Enhanced upload function with security data transmission
  const uploadToN8n = async (wavBlob) => {
    try {
      setConversationState(conversationStates.PROCESSING);
      
      // Enhanced security payload
      const enhancedPayload = {
        userID: user.UserID || user.userID || user.email,
        sessionID: sessionID.current,
        clientIP: await getClientIP(),
        timestamp: new Date().toISOString(),
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        conversationContext: {
          messageCount: messages.length,
          sessionDuration: Date.now() - parseInt(sessionID.current)
        }
      };

      console.log('Uploading WAV audio with enhanced security data:', enhancedPayload);

      // Build FormData with WAV blob and enhanced metadata
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      formData.append('metadata', JSON.stringify(enhancedPayload));

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
      
      // Handle enhanced response
      const { ttsAudio, mimeType, transcript, userID, sessionID: responseSessionID, conversationState: aiState, metadata } = response.data;
      
      if (transcript) {
        // Validate session continuity
        if (responseSessionID && responseSessionID !== sessionID.current) {
          console.warn('Session ID mismatch:', sessionID.current, 'vs', responseSessionID);
        }
        
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
          timestamp: new Date(),
          metadata: metadata // Store additional AI context
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Auto-play TTS audio if available
        if (ttsAudio && mimeType) {
          setConversationState(conversationStates.PLAYING);
          setTimeout(() => {
            playTTSAudio(ttsAudio, mimeType, aiMessageId);
          }, 300);
        } else {
          // No audio, return to listening
          setConversationState(conversationStates.LISTENING);
        }
      }
    } catch (error) {
      console.error('Error uploading WAV audio to n8n → Wit.ai:', error);
      setConversationState(conversationStates.LISTENING);
      
      if (error.response?.status === 400) {
        alert('Audio format not supported by Wit.ai. Please try recording again.');
      } else {
        alert('Failed to process voice message. Please try again.');
      }
    }
  };

  // Get client IP for security tracking
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not fetch client IP:', error);
      return 'unknown';
    }
  };

  // Enhanced TTS playback with interruption detection
  const playTTSAudio = async (ttsAudio, mimeType, messageId) => {
    try {
      // Set playing state for visual feedback
      setIsPlayingResponse(messageId);
      setConversationState(conversationStates.PLAYING);
      
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
      
      // Store reference for interruption capability
      window.currentTTSAudio = audio;
      
      // Enhanced voice detection during TTS playback for interruption
      const interruptionDetectionInterval = setInterval(() => {
        if (conversationState === conversationStates.PLAYING && analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const averageVolume = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedVolume = averageVolume / 255;
          
          // User voice detected during TTS - interrupt immediately
          if (normalizedVolume > voiceThreshold) {
            console.log('Voice interruption detected during TTS playback');
            
            // Stop TTS immediately
            audio.pause();
            audio.currentTime = 0;
            
            // Clean up
            clearInterval(interruptionDetectionInterval);
            setIsPlayingResponse(null);
            URL.revokeObjectURL(url);
            window.currentTTSAudio = null;
            
            // Transition to interrupted state and start new recording
            setConversationState(conversationStates.INTERRUPTED);
            setTimeout(() => {
              console.log('Starting new recording after interruption...');
              setConversationState(conversationStates.RECORDING);
              startHandsFreeRecording();
            }, 100);
          }
        }
      }, 50); // Check every 50ms for fast interruption response
      
      // Handle playback events
      audio.onended = () => {
        clearInterval(interruptionDetectionInterval);
        setIsPlayingResponse(null);
        setConversationState(conversationStates.LISTENING);
        URL.revokeObjectURL(url);
        window.currentTTSAudio = null;
        console.log('TTS playback completed, returning to listening mode');
      };
      
      audio.onerror = () => {
        console.error('Audio playback failed');
        clearInterval(interruptionDetectionInterval);
        setIsPlayingResponse(null);
        setConversationState(conversationStates.LISTENING);
        URL.revokeObjectURL(url);
        window.currentTTSAudio = null;
        
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
          clearInterval(interruptionDetectionInterval);
          setIsPlayingResponse(null);
          setConversationState(conversationStates.LISTENING);
          URL.revokeObjectURL(url);
          window.currentTTSAudio = null;
          
          // Show retry option
          setTimeout(() => {
            alert('🔊 Tap to play AI response');
          }, 100);
        });
      }
      
    } catch (error) {
      console.error('Error converting base64 audio:', error);
      setIsPlayingResponse(null);
      setConversationState(conversationStates.LISTENING);
      
      // Show fallback error
      setTimeout(() => {
        alert('⚠️ Audio failed; showing text only');
      }, 100);
    }
  };

  // Keep sendAudioToAPI as alias for backward compatibility
  const sendAudioToAPI = uploadToN8n;

  // Initialize hands-free mode MANUALLY (removed auto-start to fix state conflicts)
  useEffect(() => {
    console.log('🔧 Component mounted - manual initialization required');
    
    // Cleanup on unmount only
    return () => {
      stopVoiceDetection();
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Clean up microphone stream
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop any current TTS
      if (window.currentTTSAudio) {
        window.currentTTSAudio.pause();
        window.currentTTSAudio = null;
      }
    };
  }, []);

  // Toggle hands-free mode with better state management
  const toggleHandsFreeMode = async () => {
    if (isListening) {
      console.log('🔴 Disabling hands-free mode...');
      stopVoiceDetection();
      setIsListening(false);
      setConversationState(conversationStates.IDLE);
      
      // Stop microphone stream
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
    } else {
      console.log('🟢 Enabling hands-free mode...');
      await initializeVoiceDetection();
    }
  };

  // Force state to listening (debug function)
  const forceListeningState = () => {
    console.log('🔧 FORCE: Setting state to LISTENING');
    setConversationState(conversationStates.LISTENING);
    console.log('🔧 FORCE: Current state should now be:', conversationStates.LISTENING);
  };

  const SimpleVoiceInterface = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Simple Status Indicator */}
        <div className="flex items-center justify-center space-x-1 mb-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-4 rounded-full ${
                conversationState === conversationStates.RECORDING
                  ? 'bg-red-400'
                  : conversationState === conversationStates.PROCESSING
                  ? 'bg-yellow-400'
                  : conversationState === conversationStates.PLAYING
                  ? 'bg-green-400'
                  : conversationState === conversationStates.LISTENING
                  ? 'bg-teal-400'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Simple Control Button */}
        <button
          onClick={toggleHandsFreeMode}
          disabled={conversationState === conversationStates.PROCESSING}
          className={`w-20 h-20 rounded-full flex items-center justify-center font-semibold transition-colors duration-200 ${
            isListening
              ? conversationState === conversationStates.RECORDING
                ? 'bg-red-600'
                : conversationState === conversationStates.PROCESSING
                ? 'bg-yellow-600'
                : conversationState === conversationStates.PLAYING
                ? 'bg-green-600'
                : 'bg-teal-600'
              : 'bg-gray-600'
          }`}
        >
          {conversationState === conversationStates.PROCESSING ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : conversationState === conversationStates.RECORDING ? (
            <StopIcon className="w-8 h-8 text-white" />
          ) : conversationState === conversationStates.PLAYING ? (
            <span className="text-white text-2xl">🔊</span>
          ) : isListening ? (
            <MicrophoneIcon className="w-8 h-8 text-white" />
          ) : (
            <MicrophoneIcon className="w-8 h-8 text-white opacity-50" />
          )}
        </button>

        {/* Simple Status Text */}
        <div className="text-center mt-4">
          <p className="text-sm font-medium text-white">
            {getStatusText()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {isListening ? 'Voice detection active - speak loudly' : 'Click to enable voice detection'}
          </p>
        </div>

        {/* Updated Controls (Volume-based) */}
        {isListening && (
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <label className="text-xs text-gray-400 block mb-2">Voice Sensitivity (Volume 16+ required)</label>
              <input
                type="range"
                min="0.02"
                max="0.15"
                step="0.005"
                value={voiceThreshold}
                onChange={(e) => setVoiceThreshold(parseFloat(e.target.value))}
                className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                {voiceThreshold.toFixed(3)} (Vol: {Math.round(voiceThreshold * 255)})
              </p>
            </div>
            <div className="text-center">
              <label className="text-xs text-gray-400 block mb-2">Silence Timeout</label>
              <input
                type="range"
                min="800"
                max="3000"
                step="200"
                value={silenceTimeout}
                onChange={(e) => setSilenceTimeout(parseInt(e.target.value))}
                className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">{silenceTimeout}ms</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-green-400">
                📢 Speak with volume 16+ to trigger recording
              </p>
              <button 
                onClick={forceListeningState}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded"
              >
                🔧 Force Listening State (Debug)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Get status text based on conversation state
  const getStatusText = () => {
    switch (conversationState) {
      case conversationStates.IDLE:
        return 'Ready to start';
      case conversationStates.LISTENING:
        return 'Listening for voice...';
      case conversationStates.RECORDING:
        return 'Recording your message...';
      case conversationStates.PROCESSING:
        return 'Processing with AI...';
      case conversationStates.PLAYING:
        return 'AI is responding...';
      case conversationStates.INTERRUPTED:
        return 'Interrupted - listening again';
      default:
        return 'Ready';
    }
  };

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

        {/* Chat Messages - Simple Version */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'chat-bubble-user text-white'
                    : `chat-bubble-ai text-white ${
                        isPlayingResponse === message.id ? 'border-2 border-accent-teal' : ''
                      }`
                }`}
              >
                <p className="text-sm">{message.content}</p>
                
                {/* Simple audio/state indicators for AI messages */}
                {message.type === 'ai' && (
                  <div className="mt-2">
                    {isPlayingResponse === message.id && (
                      <div className="flex items-center space-x-2 text-xs text-accent-teal">
                        <div className="w-2 h-2 bg-accent-teal rounded-full"></div>
                        <span>🔊 AI is speaking...</span>
                      </div>
                    )}
                    
                    {conversationState === conversationStates.INTERRUPTED && (
                      <div className="flex items-center space-x-2 text-xs text-yellow-400 mt-1">
                        <span>⚡</span>
                        <span>Interrupted - listening for new input</span>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Voice Interface */}
        <div className="border-t border-gray-800">
          <SimpleVoiceInterface />
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