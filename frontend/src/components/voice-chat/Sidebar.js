import React, { useState, useEffect } from 'react';
import { secureApiCall, initializeSession } from '../../utils/security';

const Sidebar = ({ isOpen, onToggle, userId }) => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    displayName: localStorage.getItem('celeste7_display_name') || 'User',
    email: localStorage.getItem('celeste7_user_email') || '',
    initials: ''
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Calculate user initials
  useEffect(() => {
    const initials = user.displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    setUser(prev => ({ ...prev, initials }));
  }, [user.displayName]);

  // Load conversation history
  const loadConversationHistory = async () => {
    if (!userId || loading) return;

    setLoading(true);
    try {
      const response = await secureApiCall(`${backendUrl}/api/conversation-history/${userId}`, {
        method: 'GET'
      });

      if (response.success !== false && response.conversations) {
        setConversationHistory(response.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadConversationHistory();
    }
  }, [isOpen, userId]);

  // Group conversations by time
  const groupConversations = (conversations) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayConversations = [];
    const previousConversations = [];

    conversations.forEach(conv => {
      const convDate = new Date(conv.timestamp);
      if (convDate >= today) {
        todayConversations.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        previousConversations.push(conv);
      }
    });

    return { todayConversations, previousConversations };
  };

  const { todayConversations, previousConversations } = groupConversations(conversationHistory);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const truncateText = (text, maxLength = 40) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleSignOut = () => {
    // Clear all stored data
    localStorage.removeItem('celeste7_user_token');
    localStorage.removeItem('celeste7_user_id');
    localStorage.removeItem('celeste7_user_email');
    localStorage.removeItem('celeste7_display_name');
    sessionStorage.clear();
    
    // Redirect to home
    window.location.href = '/';
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-800 z-50 flex flex-col">
        
        {/* Header with toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Celeste7</h2>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            {/* Profile Picture Placeholder */}
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-medium">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user.displayName}</p>
              <p className="text-gray-400 text-sm truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Loading conversations...</div>
          ) : (
            <div className="p-4 space-y-6">
              
              {/* Today Section */}
              {todayConversations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Today
                  </h3>
                  <div className="space-y-2">
                    {todayConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="p-3 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          // TODO: Load specific conversation
                          console.log('Load conversation:', conv.id);
                        }}
                      >
                        <p className="text-white text-sm line-clamp-2">
                          {truncateText(conv.user_input)}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {formatTime(conv.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous 7 Days Section */}
              {previousConversations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Previous 7 Days
                  </h3>
                  <div className="space-y-2">
                    {previousConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="p-3 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          // TODO: Load specific conversation
                          console.log('Load conversation:', conv.id);
                        }}
                      >
                        <p className="text-white text-sm line-clamp-2">
                          {truncateText(conv.user_input)}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {formatTime(conv.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No conversations */}
              {conversationHistory.length === 0 && !loading && (
                <div className="text-center text-gray-400 mt-8">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start chatting to see history</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-800 p-4 space-y-2">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full flex items-center space-x-3 p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/settings'}
            className="w-full flex items-center space-x-3 p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;