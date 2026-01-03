import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

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
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToVerify }),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const signUp = async (email, password, name) => {
    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      // Handle network errors
      if (!response.ok) {
        let errorMessage = 'Sign up failed. Please try again.';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();

      // Store token and user
      await setStorageItem('auth_token', data.token);
      await setStorageItem('auth_user', data.user);
      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      // Handle network errors or CORS issues
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Unable to connect to server. Please check your internet connection or ensure the API is running.' 
        };
      }
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sign in failed');
      }

      // Store token and user
      await setStorageItem('auth_token', data.token);
      await setStorageItem('auth_user', data.user);
      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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
