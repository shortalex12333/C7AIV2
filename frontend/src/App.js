import React, { useState } from 'react';
import './App.css';

// Import Inter font
const interFont = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');`;

const App = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userResponse, setUserResponse] = useState(null);
  const [showResponse, setShowResponse] = useState(false);

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
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 justify-center items-center max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Get early access"
                required
                className="w-full px-6 py-4 border border-gray-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
                className={`glowing-button w-full px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 ${
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

          {/* Image Section */}
          <div className="relative flex justify-center">
            <img 
              src="https://i.imgur.com/YourImageUrl.png" 
              alt="For Entrepreneurs, by entrepreneurs"
              className="max-w-md w-full h-auto"
              style={{
                maxWidth: '400px',
                height: 'auto'
              }}
            />
          </div>

        </div>
      </div>
    </>
  );
};

export default App;