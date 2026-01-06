import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

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
    console.log('   Using: 🟢 API/DATABASE (Cloudflare Functions)');
    console.log('');
    console.log('🌐 Environment:');
    if (typeof window !== 'undefined') {
      console.log('   Current URL:', window.location.href);
      console.log('   Origin:', window.location.origin);
    }
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
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 SIGNUP REQUEST');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('👤 User Info:');
    console.log('   Email:', email);
    console.log('   Name:', name);
    console.log('');
    console.log('⚙️  Configuration:');
    console.log('   API_BASE:', API_BASE);
    console.log('   Using: 🟢 API/DATABASE (Cloudflare Functions)');
    console.log('═══════════════════════════════════════════════════════════');
    
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
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      return { success: false, error: errorMessage };
    } catch (error) {
      console.error('❌ [CLIENT] Network error:', error);
      return { 
        success: false, 
        error: 'Unable to connect to server. Please check your connection and try again.' 
      };
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

      if (response.ok) {
        const data = await response.json();
        await setStorageItem('auth_token', data.token);
        await setStorageItem('auth_user', data.user);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || 'Sign in failed' };
    } catch (error) {
      return { 
        success: false, 
        error: 'Unable to connect to server. Please check your connection and try again.' 
      };
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
