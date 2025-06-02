import React, { useState, useEffect } from 'react';

const MessageDisplay = ({ messages = [], isListening = false, transcription = '' }) => {
  const [displayMessages, setDisplayMessages] = useState([]);

  useEffect(() => {
    setDisplayMessages(messages);
  }, [messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const playAudio = async (audioUrl) => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {displayMessages.length === 0 && !isListening && !transcription ? (
        // Welcome State
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            Hi, I'm Celeste
          </h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            Your AI voice coach is ready to help you improve your communication skills. 
            Press and hold the microphone to start speaking.
          </p>
        </div>
      ) : (
        // Messages
        <div className="space-y-6">
          {displayMessages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`
                max-w-[80%] rounded-2xl px-6 py-4 shadow-lg
                ${message.role === 'user' 
                  ? 'bg-blue-600 text-white ml-12' 
                  : 'bg-gray-800 text-white mr-12 border border-gray-700'
                }
              `}>
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${message.role === 'user' ? 'bg-blue-200' : 'bg-blue-400'}`}></div>
                    <span className="text-xs font-medium opacity-75" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                      {message.role === 'user' ? 'You' : 'Celeste'}
                    </span>
                  </div>
                  {message.timestamp && (
                    <span className="text-xs opacity-50">
                      {formatTime(message.timestamp)}
                    </span>
                  )}
                </div>

                {/* Message Content */}
                <div className="space-y-3">
                  {/* Text Content */}
                  {message.content && (
                    <p className="text-sm leading-relaxed" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                      {message.content}
                    </p>
                  )}

                  {/* Audio Content */}
                  {message.audio_url && (
                    <div className="flex items-center space-x-3 p-3 bg-black/20 rounded-lg">
                      <button
                        onClick={() => playAudio(message.audio_url)}
                        className="flex items-center justify-center w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                      <div className="flex-1 flex items-center space-x-2">
                        <div className="h-1 bg-white/20 rounded-full flex-1">
                          <div className="h-full bg-white/60 rounded-full w-0"></div>
                        </div>
                        <span className="text-xs opacity-75">
                          {message.duration || '0:00'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Voice Analysis */}
                  {message.analysis && (
                    <div className="p-3 bg-black/20 rounded-lg space-y-2">
                      <h4 className="text-xs font-medium opacity-75 mb-2">Voice Analysis</h4>
                      {message.analysis.confidence && (
                        <div className="flex items-center justify-between text-xs">
                          <span>Confidence</span>
                          <span className="text-blue-300">{Math.round(message.analysis.confidence * 100)}%</span>
                        </div>
                      )}
                      {message.analysis.pace && (
                        <div className="flex items-center justify-between text-xs">
                          <span>Speaking Pace</span>
                          <span className="text-blue-300">{message.analysis.pace}</span>
                        </div>
                      )}
                      {message.analysis.clarity && (
                        <div className="flex items-center justify-between text-xs">
                          <span>Clarity</span>
                          <span className="text-blue-300">{message.analysis.clarity}/10</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Live Transcription */}
          {(isListening || transcription) && (
            <div className="flex justify-end animate-fade-in">
              <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-blue-600/50 text-white ml-12 border-2 border-blue-400 border-dashed">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                  <span className="text-xs font-medium opacity-75" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                    {isListening ? 'Listening...' : 'Processing...'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                  {transcription || 'Start speaking...'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageDisplay;