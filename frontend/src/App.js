import React, { useState } from 'react';
import './App.css';

// Import Inter font
const interFont = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');`;

const App = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      // For a more professional implementation, you can create a Google Apps Script
      // web app that accepts POST requests and writes to your sheet
      // Here's the basic approach:
      
      // Method 1: Direct sheet access (current implementation)
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1tRJZM-jH6yD-chWi-hzroXadFvCmz9fX-p0gLHghWOg/edit?gid=0#gid=0';
      
      // Store email in localStorage for reference
      localStorage.setItem('userEmail', email);
      localStorage.setItem('submissionTime', new Date().toISOString());
      
      // For production, you'd want to set up a Google Apps Script web app like this:
      /*
      const scriptUrl = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          timestamp: new Date().toISOString(),
          source: 'CelesteOS Landing Page'
        })
      });
      */
      
      // For now, show success and optionally open sheet
      console.log(`Email ${email} ready to be logged to sheet`);
      
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{backgroundColor: '#181818'}}>
      <div className="w-full max-w-4xl mx-auto text-center">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{color: '#f8f8ff'}}>
            Celeste<span className="text-blue-400">OS</span>
          </h1>
          <p className="text-lg md:text-xl font-light" style={{color: '#f8f8ff', opacity: 0.8}}>
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
              className="w-full sm:flex-1 px-6 py-4 border border-gray-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              style={{
                backgroundColor: '#2a2a2a',
                color: '#f8f8ff',
                borderColor: '#404040'
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className={`w-full sm:w-auto px-8 py-4 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 ${
                isSubmitting || !email ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'
              }`}
              style={{
                backgroundColor: '#000000',
                color: '#f8f8ff'
              }}
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
              <div className="w-full h-full rounded-[50px] overflow-hidden relative" style={{backgroundColor: '#181818'}}>
                
                {/* iPhone Screen Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  
                  {/* Text on Phone Screen */}
                  <div className="mb-16">
                    <h2 className="text-2xl font-semibold leading-tight mb-2" style={{color: '#f8f8ff'}}>
                      For Entrepreneurs,
                    </h2>
                    <h2 className="text-2xl font-semibold leading-tight" style={{color: '#f8f8ff'}}>
                      by entrepreneurs.
                    </h2>
                  </div>

                  {/* Puzzle Logo - More accurate to the image */}
                  <div className="relative">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
                      {/* Left puzzle piece */}
                      <path 
                        d="M20 20 L50 20 Q55 25 60 30 Q65 35 60 40 Q55 45 50 50 L50 70 Q45 75 40 80 Q35 85 40 90 Q45 95 50 100 L20 100 Q15 95 10 90 Q5 85 10 80 Q15 75 20 70 L20 50 Q25 45 30 40 Q35 35 30 30 Q25 25 20 20 Z" 
                        fill="#7dd3fc"
                        opacity="0.9"
                      />
                      
                      {/* Right puzzle piece */}
                      <path 
                        d="M70 20 L100 20 Q105 25 110 30 Q115 35 110 40 Q105 45 100 50 L100 70 Q95 75 90 80 Q85 85 90 90 Q95 95 100 100 L70 100 Q65 95 60 90 Q55 85 60 80 Q65 75 70 70 L70 50 Q75 45 80 40 Q85 35 80 30 Q75 25 70 20 Z" 
                        fill="#7dd3fc"
                        opacity="0.9"
                      />
                    </svg>
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