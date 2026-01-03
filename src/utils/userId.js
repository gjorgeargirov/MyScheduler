/**
 * Get or create a unique user ID for this browser
 * This ensures each user has completely isolated data
 */
export const getUserId = () => {
  const USER_ID_KEY = 'focusboard_userId';
  
  try {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      // Generate a unique ID
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
  } catch (error) {
    // Fallback if localStorage is not available
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
};
