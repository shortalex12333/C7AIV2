import React from 'react';

const MessageDisplay = ({ conversations = [] }) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">Ready to chat</h3>
        <p className="text-gray-500">Start a conversation using the voice controls below</p>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Show last 3-5 exchanges
  const recentConversations = conversations.slice(-5);

  return (
    <div className="space-y-6 mb-8">
      {recentConversations.map((conv, index) => (
        <div key={conv.id || index} className="space-y-4">
          
          {/* User Message (Right aligned) */}
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-md xl:max-w-lg">
              <div className="bg-orange-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                <p className="text-sm">{conv.user_input}</p>
              </div>
              <div className="text-right mt-1">
                <span className="text-xs text-gray-500">
                  {formatTime(conv.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* AI Response (Left aligned) */}
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md xl:max-w-lg">
              <div className="flex items-start space-x-3">
                {/* AI Avatar */}
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-orange-400 text-sm font-bold">C7</span>
                </div>
                
                {/* Message */}
                <div className="bg-gray-800 text-white rounded-2xl rounded-bl-md px-4 py-3">
                  <p className="text-sm">{conv.ai_response}</p>
                </div>
              </div>
              
              <div className="ml-11 mt-1 flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {formatTime(conv.timestamp)}
                </span>
                
                {/* Feedback indicators */}
                {conv.feedback === true && (
                  <span className="text-green-400 text-xs">👍</span>
                )}
                {conv.feedback === false && (
                  <span className="text-red-400 text-xs">👎</span>
                )}
                
                {/* Category tag */}
                {conv.category && (
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                    {conv.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageDisplay;