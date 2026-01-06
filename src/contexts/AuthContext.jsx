import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import { localAuth } from '../utils/localAuth';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH !== 'false'; // Default to true for local dev

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Load user session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await getStorageItem('auth_token');
        const storedUser = await getStorageItem('auth_user');
        
        if (storedToken && storedUser) {
          // Verify token is still valid
          const isValid = await verifyToken(storedToken);
          if (isValid) {
            setToken(storedToken);
            setUser(storedUser);
          } else {
            // Token expired, clear storage
            await removeStorageItem('auth_token');
            await removeStorageItem('auth_user');
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      if (USE_LOCAL_AUTH) {
        const result = localAuth.verifyToken(tokenToVerify);
        return result.valid;
      }
      
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToVerify }),
      });
      return response.ok;
    } catch {
      // If API fails, fall back to local auth
      if (USE_LOCAL_AUTH) {
        const result = localAuth.verifyToken(tokenToVerify);
        return result.valid;
      }
      return false;
    }
  };

  const signUp = async (email, password, name) => {
    try {
      // Try local auth first if enabled, or fall back if API fails
      if (USE_LOCAL_AUTH) {
        try {
          const result = await localAuth.signUp(email, password, name);
          if (result.success) {
            await setStorageItem('auth_token', result.token);
            await setStorageItem('auth_user', result.user);
            setToken(result.token);
            setUser(result.user);
            return { success: true };
          }
          return result;
        } catch (error) {
          console.error('Local auth error:', error);
        }
      }

      // Try API if local auth is disabled or failed
      try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        if (response.ok) {
          const data = await response.json();
          await setStorageItem('auth_token', data.token);
          await setStorageItem('auth_user', data.user);
          setToken(data.token);
          setUser(data.user);
          return { success: true };
        }

        let errorMessage = 'Sign up failed. Please try again.';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        return { success: false, error: errorMessage };
      } catch (apiError) {
        // If API fails and local auth is available, use it
        if (USE_LOCAL_AUTH) {
          const result = await localAuth.signUp(email, password, name);
          if (result.success) {
            await setStorageItem('auth_token', result.token);
            await setStorageItem('auth_user', result.user);
            setToken(result.token);
            setUser(result.user);
            return { success: true };
          }
          return result;
        }
        
        // Otherwise return API error
        if (apiError.message.includes('Failed to fetch') || apiError.message.includes('NetworkError')) {
          return { 
            success: false, 
            error: 'Unable to connect to server. Using local storage for development.' 
          };
        }
        return { success: false, error: apiError.message || 'An unexpected error occurred' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const signIn = async (email, password) => {
    try {
      // Try local auth first if enabled, or fall back if API fails
      if (USE_LOCAL_AUTH) {
        try {
          const result = await localAuth.signIn(email, password);
          if (result.success) {
            await setStorageItem('auth_token', result.token);
            await setStorageItem('auth_user', result.user);
            setToken(result.token);
            setUser(result.user);
            return { success: true };
          }
          return result;
        } catch (error) {
          console.error('Local auth error:', error);
        }
      }

      // Try API if local auth is disabled or failed
      try {
        const response = await fetch(`${API_BASE}/auth/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          await setStorageItem('auth_token', data.token);
          await setStorageItem('auth_user', data.user);
          setToken(data.token);
          setUser(data.user);
          return { success: true };
        }

        const data = await response.json();
        throw new Error(data.error || 'Sign in failed');
      } catch (apiError) {
        // If API fails and local auth is available, use it
        if (USE_LOCAL_AUTH) {
          const result = await localAuth.signIn(email, password);
          if (result.success) {
            await setStorageItem('auth_token', result.token);
            await setStorageItem('auth_user', result.user);
            setToken(result.token);
            setUser(result.user);
            return { success: true };
          }
          return result;
        }
        
        return { success: false, error: apiError.message || 'Sign in failed' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Sign in failed' };
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/signout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      await removeStorageItem('auth_token');
      await removeStorageItem('auth_user');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
