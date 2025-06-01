import React from 'react';
import { useNavigate } from 'react-router-dom';

const SimplifiedLanding = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6">
        
        {/* Logo/Branding */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Celeste7
          </h1>
        </div>

        {/* Single Tagline */}
        <div className="mb-12">
          <p className="text-xl text-gray-300 font-light leading-relaxed">
            Strategic Intelligence for High Performers
          </p>
        </div>

        {/* Single CTA Button */}
        <div>
          <button
            onClick={handleGetStarted}
            className="bg-orange-600 hover:bg-orange-700 text-white text-lg font-semibold px-12 py-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
        </div>

        {/* Minimal footer */}
        <div className="mt-16 text-gray-500 text-sm">
          <p>AI-powered coaching for ambitious professionals</p>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedLanding;