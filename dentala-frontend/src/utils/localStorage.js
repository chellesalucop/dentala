/**
 * 🛡️ LOCALSTORAGE UTILITY: Enhanced data persistence management
 * Fixes issues with user data not persisting across sessions
 */

export const storage = {
  // Get user data with validation
  getUser: () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return null;
      
      const user = JSON.parse(userString);
      console.log('🔍 Retrieved user from localStorage:', user);
      return user;
    } catch (error) {
      console.error('❌ Error getting user from localStorage:', error);
      return null;
    }
  },

  // Set user data with validation and cross-tab sync
  setUser: (user) => {
    try {
      if (!user) {
        console.warn('⚠️ Attempting to save null user data');
        return;
      }
      
      console.log('💾 Saving user to localStorage:', user);
      localStorage.setItem('user', JSON.stringify(user));
      
      // 🛡️ CROSS-TAB SYNC: Broadcast update to other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(user)
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Error saving user to localStorage:', error);
      return false;
    }
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  // Set auth token
  setToken: (token) => {
    localStorage.setItem('auth_token', token);
  },

  // Clear all data
  clear: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  },

  // Listen for storage changes from other tabs
  onStorageChange: (callback) => {
    window.addEventListener('storage', (event) => {
      if (event.key === 'user') {
        const user = event.newValue ? JSON.parse(event.newValue) : null;
        callback(user);
      }
    });
  }
};
