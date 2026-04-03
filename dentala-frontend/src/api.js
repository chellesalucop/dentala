// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' 
  ? ''  // Default to relative if no VITE_API_URL is provided in production
  : 'http://127.0.0.1:8000'); // Default to localhost in development

export const API_URL = API_BASE_URL;

