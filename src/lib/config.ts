// Configuration for API endpoints and other environment variables
export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  
  // Debug Configuration
  debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  
  // Validation
  validate: () => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.warn('NEXT_PUBLIC_API_URL not set, using default localhost URL');
    }
    if (!process.env.NEXT_PUBLIC_WS_URL) {
      console.warn('NEXT_PUBLIC_WS_URL not set, using default localhost URL');
    }
  }
};

// Validate configuration on import
config.validate();
