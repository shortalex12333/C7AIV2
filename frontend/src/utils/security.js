// Celeste7 Security Utility Functions
// Based on the official Celeste7 Webhook Security Specification

// Generate UUID for request IDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get secure headers for webhook requests
export const getSecureHeaders = () => {
  const userToken = localStorage.getItem('celeste7_user_token') || `mock_token_${generateUUID()}`;
  const sessionId = sessionStorage.getItem('celeste7_session_id') || `session_${generateUUID()}`;
  
  return {
    'X-User-Token': userToken,
    'X-Session-ID': sessionId,
    'X-Request-ID': generateUUID(),
    'X-Timestamp': new Date().toISOString(),
    'Content-Type': 'application/json'
  };
};

// Validate request data before sending
export const validateRequest = (data) => {
  // Check required fields
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request data');
  }
  
  // Sanitize string fields (max 1000 chars, trim whitespace)
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim().slice(0, 1000);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = validateRequest(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Enhanced fetch wrapper with security and error handling
export const secureApiCall = async (url, options = {}) => {
  try {
    // Get secure headers
    const secureHeaders = getSecureHeaders();
    
    // Validate and sanitize data if present
    let body = options.body;
    if (body && typeof body === 'object') {
      body = JSON.stringify(validateRequest(body));
    } else if (body && typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        body = JSON.stringify(validateRequest(parsed));
      } catch (e) {
        // If not JSON, leave as is
      }
    }
    
    // Prepare request options
    const requestOptions = {
      ...options,
      headers: {
        ...secureHeaders,
        ...options.headers
      },
      body
    };
    
    console.log(`🔐 Secure API call to: ${url}`);
    console.log(`🔑 Headers: ${JSON.stringify(secureHeaders, null, 2)}`);
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      // Don't expose server errors to user
      console.error(`API Error: ${response.status} ${response.statusText}`);
      throw new Error('Unable to process request');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Secure API call error:', error);
    
    // Return safe error message
    return {
      success: false,
      error: 'Unable to process request',
      details: error.message
    };
  }
};

// Initialize session if not present
export const initializeSession = () => {
  if (!sessionStorage.getItem('celeste7_session_id')) {
    sessionStorage.setItem('celeste7_session_id', `session_${generateUUID()}_${Date.now()}`);
  }
  
  if (!localStorage.getItem('celeste7_user_token')) {
    // In production, this should come from authentication
    localStorage.setItem('celeste7_user_token', `demo_token_${generateUUID()}`);
  }
  
  console.log('🔐 Celeste7 security session initialized');
};

// Request debouncing for pattern detection
const debounceTimers = new Map();

export const debouncedRequest = (key, fn, delay = 1000) => {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }
  
  const timer = setTimeout(() => {
    fn();
    debounceTimers.delete(key);
  }, delay);
  
  debounceTimers.set(key, timer);
};

// Offline queue management
export class OfflineQueue {
  static queue = [];
  
  static add(webhook, data) {
    this.queue.push({ 
      webhook, 
      data, 
      timestamp: Date.now(),
      id: generateUUID()
    });
    localStorage.setItem('celeste7_offline_queue', JSON.stringify(this.queue));
    console.log(`📴 Request queued for offline: ${webhook}`);
  }
  
  static async processQueue() {
    const queue = JSON.parse(localStorage.getItem('celeste7_offline_queue') || '[]');
    console.log(`📶 Processing ${queue.length} offline requests`);
    
    for (const item of queue) {
      try {
        await secureApiCall(item.webhook, {
          method: 'POST',
          body: item.data
        });
        console.log(`✅ Offline request processed: ${item.webhook}`);
      } catch (error) {
        console.error(`❌ Offline request failed: ${item.webhook}`, error);
      }
    }
    
    // Clear processed queue
    localStorage.removeItem('celeste7_offline_queue');
    this.queue = [];
  }
}

// Listen for online events to process queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('📶 Back online, processing queued requests...');
    OfflineQueue.processQueue();
  });
  
  window.addEventListener('offline', () => {
    console.log('📴 Gone offline, requests will be queued');
  });
}

// Cache for performance optimization
export class ResponseCache {
  static cache = new Map();
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  static get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`💾 Cache hit: ${key}`);
      return cached.data;
    }
    return null;
  }
  
  static set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log(`💾 Cache set: ${key}`);
  }
  
  static clear() {
    this.cache.clear();
    console.log('💾 Cache cleared');
  }
}

export default {
  getSecureHeaders,
  validateRequest,
  secureApiCall,
  initializeSession,
  debouncedRequest,
  OfflineQueue,
  ResponseCache,
  generateUUID
};