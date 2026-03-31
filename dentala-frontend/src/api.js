// API configuration for different environments
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? ''  // Use relative URLs in production
  : 'http://127.0.0.1:8000';  // Use localhost in development

export const API_URL = API_BASE_URL;
