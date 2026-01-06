import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import { localAuth } from '../utils/localAuth';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
// Determine auth mode:
// - If VITE_USE_LOCAL_AUTH is explicitly set to 'true', use local auth
// - If VITE_USE_LOCAL_AUTH is explicitly set to 'false', use API auth
// - If not set: in production (PROD=true), default to API auth; in dev, default to local auth
const explicitLocalAuth = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';
const explicitApiAuth = import.meta.env.VITE_USE_LOCAL_AUTH === 'false';
const isProduction = import.meta.env.PROD === true;
const USE_LOCAL_AUTH = explicitLocalAuth || (!explicitApiAuth && !isProduction);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Debug logging for environment variables and configuration (on mount)
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 AUTHENTICATION CONFIGURATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📡 API Configuration:');
    console.log('   VITE_API_BASE (raw):', import.meta.env.VITE_API_BASE);
    console.log('   API_BASE (computed):', API_BASE);
    if (typeof window !== 'undefined') {
      console.log('   Full API URL:', `${window.location.origin}${API_BASE}`);
    }
    console.log('');
    console.log('🔐 Authentication Mode:');
    console.log('   VITE_USE_LOCAL_AUTH (raw):', import.meta.env.VITE_USE_LOCAL_AUTH);
    console.log('   USE_LOCAL_AUTH (computed):', USE_LOCAL_AUTH);
    console.log('   Using:', USE_LOCAL_AUTH ? '🔴 LOCAL STORAGE' : '🟢 API/DATABASE');
    console.log('');
    console.log('🌐 Environment:');
    if (typeof window !== 'undefined') {
      console.log('   Current URL:', window.location.href);
      console.log('   Origin:', window.location.origin);
    }
    console.log('   All VITE env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
    console.log('═══════════════════════════════════════════════════════════');
  }, []);

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
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 SIGNUP REQUEST');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('👤 User Info:');
    console.log('   Email:', email);
    console.log('   Name:', name);
    console.log('');
    console.log('⚙️  Configuration:');
    console.log('   USE_LOCAL_AUTH:', USE_LOCAL_AUTH);
    console.log('   API_BASE:', API_BASE);
    console.log('   Will use:', USE_LOCAL_AUTH ? '🔴 LOCAL STORAGE' : '🟢 API/DATABASE');
    console.log('═══════════════════════════════════════════════════════════');
    try {
      // Try local auth first if enabled, or fall back if API fails
      if (USE_LOCAL_AUTH) {
        console.log('⚠️  [CLIENT] Using LOCAL auth (USE_LOCAL_AUTH is true)');
        console.log('⚠️  [CLIENT] User will be saved to browser storage, NOT database!');
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
      const signupUrl = `${API_BASE}/auth/signup`;
      console.log('🌐 [CLIENT] Attempting API signup');
      console.log('   URL:', signupUrl);
      if (typeof window !== 'undefined') {
        console.log('   Full URL:', `${window.location.origin}${signupUrl}`);
      }
      try {
        const response = await fetch(signupUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        console.log('📡 [CLIENT] API Response:');
        console.log('   Status:', response.status, response.statusText);
        console.log('   OK:', response.ok);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [CLIENT] API signup SUCCESSFUL!');
          console.log('   User ID:', data.user?.id);
          console.log('   User Email:', data.user?.email);
          console.log('   Token received:', data.token ? 'Yes' : 'No');
          await setStorageItem('auth_token', data.token);
          await setStorageItem('auth_user', data.user);
          setToken(data.token);
          setUser(data.user);
          return { success: true };
        }
        
        console.error('❌ [CLIENT] API signup FAILED');
        console.error('   Status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('   Response:', errorText);

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
