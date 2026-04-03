// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' 
  ? ''  // Default to relative if no VITE_API_URL is provided in production
  : 'http://127.0.0.1:8000'); // Default to localhost in development

export const API_URL = API_BASE_URL;
 
/**
 * 🛡️ CLOUDINARY SYNC HELPER:
 * Detects if the path is a full cloud URL (https://res.cloudinary.com...)
 * or a legacy local storage path (profile_photos/xyz.jpg)
 */
export const getProfilePhotoUrl = (path) => {
  if (!path) return null;
  // If it's already a full web URL, return it as-is
  if (path.startsWith('http')) return path;
  // Otherwise, prepend the local storage prefix
  return `${API_URL}/storage/${path}`;
};

