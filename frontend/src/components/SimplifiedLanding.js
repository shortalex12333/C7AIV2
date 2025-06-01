import React from 'react';
import { useNavigate } from 'react-router-dom';

const SimplifiedLanding = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-gray-950 to-gray-900"></div>
      
      {/* Subtle glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-16">
        
        {/* Main Logo/Title */}
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl font-semibold tracking-tight mb-6" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            Celeste<span className="text-blue-400">OS</span>
          </h1>
        </div>

        {/* Tagline */}
        <div className="mb-16">
          <p className="text-xl md:text-2xl text-gray-300 font-normal max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            Your proactive AI assistant.
          </p>
        </div>

        {/* CTA Section */}
        <div className="mb-20">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleGetStarted}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-blue-600/25 border border-blue-500/20"
              style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
            >
              Get early access
            </button>
          </div>
        </div>

        {/* Subtle features hint */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-600/20">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Strategic Intelligence
            </h3>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-600/20">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Voice-First Interface
            </h3>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-600/20">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
              Performance Tracking
            </h3>
          </div>
        </div>

        {/* Minimal footer */}
        <div className="mt-24 text-center">
          <p className="text-gray-500 text-sm" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            Designed for high-performing professionals
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedLanding;