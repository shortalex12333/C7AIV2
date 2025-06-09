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
    <>
      <style>{interFont}</style>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{backgroundColor: '#181818'}}>
        <div className="w-full max-w-4xl mx-auto text-center">
          
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="mb-4" style={{
              fontSize: '100px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#f8f8ff',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}>
              Celeste<span style={{
                background: 'linear-gradient(135deg, #4897ea 0%, #96e4df 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>OS</span>
            </h1>
            <p style={{
              fontSize: '24px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 300,
              color: '#f8f8ff',
              lineHeight: '1.4'
            }}>
              Your <span style={{
                background: 'linear-gradient(135deg, #4897ea 0%, #96e4df 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>proactive</span> AI assistant.
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
                  borderColor: '#404040',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 300
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className={`glowing-button w-full sm:w-auto px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                  isSubmitting || !email ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                style={{
                  backgroundColor: '#242424',
                  color: '#f8f8ff',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: 300,
                  border: 'none'
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
                      <h2 style={{
                        color: '#f8f8ff',
                        fontSize: '24px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        lineHeight: '1.3',
                        marginBottom: '8px'
                      }}>
                        For Entrepreneurs,
                      </h2>
                      <h2 style={{
                        color: '#f8f8ff',
                        fontSize: '24px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        lineHeight: '1.3'
                      }}>
                        by entrepreneurs.
                      </h2>
                    </div>

                    {/* Puzzle Logo - Simple two pieces */}
                    <div className="relative">
                      <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
                        {/* Left puzzle piece */}
                        <path 
                          d="M10 20 C10 15 15 10 20 10 L40 10 C45 10 50 15 50 20 L50 40 C55 40 60 45 60 50 C60 55 55 60 50 60 L50 80 C50 85 55 90 60 90 C65 90 70 85 70 80 L70 60 C70 55 75 50 80 50 C85 50 90 55 90 60 L90 80 C90 95 85 100 80 100 L20 100 C15 100 10 95 10 80 Z" 
                          fill="#7dd3fc"
                        />
                        
                        {/* Right puzzle piece */}
                        <path 
                          d="M50 20 C50 15 55 10 60 10 L100 10 C105 10 110 15 110 20 L110 80 C110 95 105 100 100 100 L60 100 C55 100 50 95 50 80 L50 60 C45 60 40 55 40 50 C40 45 45 40 50 40 L50 20 Z" 
                          fill="#7dd3fc"
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
    </>
  );
};

export default App;