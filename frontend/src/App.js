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
      // Store email in localStorage for reference
      localStorage.setItem('userEmail', email);
      localStorage.setItem('submissionTime', new Date().toISOString());
      
      // For Google Sheets integration, you would create a Google Apps Script web app
      // and use it like this:
      /*
      const response = await fetch('YOUR_GOOGLE_APPS_SCRIPT_URL', {
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
      
      // For now, log the email and open the sheet
      console.log(`Email ${email} ready to be logged to Google Sheets`);
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1tRJZM-jH6yD-chWi-hzroXadFvCmz9fX-p0gLHghWOg/edit?gid=0#gid=0';
      window.open(sheetUrl, '_blank');
      
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{backgroundColor: '#181818'}}>
        <div className="w-full max-w-2xl mx-auto text-center">
          
          {/* Header Section */}
          <div className="mb-12 fade-in-up">
            <h1 className="mb-6" style={{
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
              lineHeight: '1.4',
              marginBottom: '0'
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
          <div className="mb-8 fade-in-up-delay">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 justify-center items-center max-w-md mx-auto">
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
                className={`outer-glow-button w-auto px-6 py-3 rounded-lg transition-all duration-200 ${
                  isSubmitting || !email ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'
                }`}
                style={{
                  backgroundColor: '#000000',
                  color: '#f8f8ff',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 300,
                  border: 'none',
                  minWidth: '120px'
                }}
              >
                {isSubmitting ? 'Submitting...' : isSubmitted ? 'Submitted!' : 'Submit'}
              </button>
            </form>
          </div>

          {/* Image Section */}
          <div className="relative flex justify-center pb-0">
            <img 
              src="https://image.typedream.com/cdn-cgi/image/width=3840,format=auto,fit=scale-down,quality=100/https://api.typedream.com/v0/document/public/1f70f13f-def2-4931-9d3f-06557643723a/2xzinfwSsGaBtpj8XDboGDSSa6b_iphone8.png" 
              alt="For Entrepreneurs, by entrepreneurs"
              className="fade-in-image"
              style={{
                width: '929px',
                height: '1252px',
                objectFit: 'contain'
              }}
            />
          </div>

        </div>
      </div>
    </>
  );
};

export default App;