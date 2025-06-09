import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      // Open Google Form in new tab
      const googleFormUrl = 'https://docs.google.com/forms/d/1QVDfxha3n6rYrAdkwltOrIfTaL1egbgmLoEbdQFZGwY/viewform';
      window.open(googleFormUrl, '_blank');
      
      setIsSubmitted(true);
      setEmail('');
      
      // Reset submitted state after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl mx-auto text-center">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Celeste<span className="text-blue-400">OS</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl font-light">
            Your proactive AI assistant.
          </p>
        </div>

        {/* Email Capture Section */}
        <div className="mb-16">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Get early access"
              required
              className="w-full sm:flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className={`w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 ${
                isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isSubmitting ? 'Submitting...' : isSubmitted ? 'Submitted!' : 'Submit'}
            </button>
          </form>
        </div>

        {/* iPhone Mockup Section */}
        <div className="relative flex justify-center">
          <div className="relative">
            {/* iPhone Frame */}
            <div className="relative w-80 h-[640px] bg-black rounded-[60px] p-2 shadow-2xl">
              <div className="w-full h-full bg-gray-900 rounded-[50px] overflow-hidden relative">
                
                {/* iPhone Screen Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  
                  {/* Text on Phone Screen */}
                  <div className="mb-12">
                    <h2 className="text-white text-2xl font-semibold leading-tight mb-2">
                      For Entrepreneurs,
                    </h2>
                    <h2 className="text-white text-2xl font-semibold leading-tight">
                      by entrepreneurs.
                    </h2>
                  </div>

                  {/* Puzzle Logo */}
                  <div className="relative">
                    <div className="flex items-center justify-center">
                      {/* Left Puzzle Piece */}
                      <div className="w-24 h-24 bg-blue-400 relative">
                        <div className="absolute inset-0 rounded-l-full"></div>
                        <div className="absolute top-1/2 right-0 w-6 h-6 bg-blue-400 rounded-full transform translate-x-3 -translate-y-3"></div>
                        <div className="absolute bottom-0 right-1/2 w-6 h-6 bg-gray-900 rounded-full transform translate-x-3 translate-y-3"></div>
                      </div>
                      
                      {/* Right Puzzle Piece */}
                      <div className="w-24 h-24 bg-blue-400 relative">
                        <div className="absolute inset-0 rounded-r-full"></div>
                        <div className="absolute top-1/2 left-0 w-6 h-6 bg-gray-900 rounded-full transform -translate-x-3 -translate-y-3"></div>
                        <div className="absolute bottom-0 left-1/2 w-6 h-6 bg-blue-400 rounded-full transform -translate-x-3 translate-y-3"></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* iPhone Notch */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full"></div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;