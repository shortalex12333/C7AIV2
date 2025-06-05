import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const MVPChatInterface = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = () => {
      const userID = localStorage.getItem('userID');
      return userID && userID !== 'undefined' && userID !== 'null' && userID.trim() !== '';
    };

    if (!isAuthenticated()) {
      console.error('User not authenticated, redirecting to login');
      logout();
    }
  }, [logout]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send text message
  const sendTextMessage = async () => {
    if (!textInput.trim()) return;

    // Check authentication before sending
    const userID = localStorage.getItem('userID');
    const sessionID = localStorage.getItem('sessionID');
    
    if (!userID || !sessionID || userID === 'undefined' || sessionID === 'undefined') {
      console.error('User not authenticated properly');
      logout();
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user_text',
      content: textInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const messageToSend = textInput;
    setTextInput('');

    try {
      console.log('Sending text message with userID:', userID, 'sessionID:', sessionID);

      // Send directly to N8N webhook with correct payload structure
      const response = await fetch('https://ventruk.app.n8n.cloud/webhook/text-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userID: userID,           // Must be actual userID, not undefined
          sessionID: sessionID,     // Must be actual sessionID, not undefined
          text: messageToSend,
          type: 'message',
          timestamp: new Date().toISOString()
        })
      });

      console.log('Text chat response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Text chat response data:', data);

      // Handle N8N response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai_response',
        content: data.text?.content || data.response || data.text || 'No response received',
        audio_response: data.audio_response || data.audio,
        timestamp: data.timestamp || new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Text chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, there was an error sending your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendVoiceMessage(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convert audio blob to base64
  const audioToBase64 = (audioBlob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]; // Remove data:audio/wav;base64, prefix
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  };

  // Send voice message
  const sendVoiceMessage = async (audioBlob) => {
    setIsLoading(true);

    // Check authentication before sending
    const userID = localStorage.getItem('userID');
    const sessionID = localStorage.getItem('sessionID');
    
    if (!userID || !sessionID || userID === 'undefined' || sessionID === 'undefined') {
      console.error('User not authenticated properly');
      logout();
      setIsLoading(false);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user_voice',
      content: 'Voice message',
      audioBlob: audioBlob,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Sending voice message with userID:', userID, 'sessionID:', sessionID);

      const base64Audio = await audioToBase64(audioBlob);

      // Send directly to N8N voice webhook with correct payload structure
      const response = await fetch('https://ventruk.app.n8n.cloud/webhook/voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userID: userID,           // Must be actual userID, not undefined
          sessionID: sessionID,     // Must be actual sessionID, not undefined
          audio_data: base64Audio,
          type: 'voice_message',
          timestamp: new Date().toISOString()
        })
      });

      console.log('Voice chat response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Voice chat response data:', data);

      // Handle N8N response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai_response',
        content: data.text?.content || data.response || data.text || 'No response received',
        audio_response: data.audio_response || data.audio,
        timestamp: data.timestamp || new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Voice chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, there was an error sending your voice message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  // Play audio response
  const playAudioResponse = (base64Audio) => {
    if (!base64Audio) return;
    
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } catch (error) {
      console.error('Error creating audio:', error);
    }
  };

  // Handle Enter key press in text input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">AI Chat Interface</h1>
            <p className="text-sm text-gray-400">MVP Testing Environment</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type.startsWith('user') ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.type.startsWith('user') 
                  ? 'bg-blue-600 text-white' 
                  : message.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}>
                {message.type === 'user_voice' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                    <span>Voice message</span>
                    {message.audioBlob && (
                      <button
                        onClick={() => {
                          const audio = new Audio(URL.createObjectURL(message.audioBlob));
                          audio.play();
                        }}
                        className="text-xs underline"
                      >
                        Play
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.audio_response && (
                      <button
                        onClick={() => playAudioResponse(message.audio_response)}
                        className="mt-2 px-3 py-1 bg-white/20 rounded-lg text-xs hover:bg-white/30 transition-colors flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span>Play Audio</span>
                      </button>
                    )}
                  </div>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-700 text-white px-4 py-3 rounded-2xl flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>AI is responding...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-gray-700/50 p-4">
        <div className="flex items-center space-x-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or use voice..."
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:border-blue-500 transition-colors"
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={sendTextMessage}
              disabled={!textInput.trim() || isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>

          {/* Voice Recording Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`p-3 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a2 2 0 114 0v4a2 2 0 11-4 0V7z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-center text-red-400 text-sm"
          >
            🔴 Recording... Click the microphone again to stop
          </motion.div>
        )}


      </div>
    </div>
  );
};

export default MVPChatInterface;