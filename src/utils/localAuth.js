/**
 * Local Storage-based Authentication (for development)
 * This simulates the backend API using localStorage
 */

const USERS_STORAGE_KEY = 'local_auth_users';
const JWT_SECRET = 'local-dev-secret'; // Simple secret for local dev

// Simple password hashing (same as backend)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// Simple JWT token generation
function generateToken(userId, email) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const base64Url = (str) => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  
  // Simple signature (for local dev only)
  const signature = btoa(JWT_SECRET + encodedHeader + encodedPayload)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function parseToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return false; // Token expired
    }
    
    return payload;
  } catch {
    return false;
  }
}

// Get all users from storage (IndexedDB with localStorage fallback)
async function getUsers() {
  try {
    // Try IndexedDB first for better storage
    const { getStorageItem } = await import('./storage');
    const users = await getStorageItem(USERS_STORAGE_KEY);
    if (users) return users;
    
    // Fallback to localStorage
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch {
    // Final fallback
    try {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch {
      return [];
    }
  }
}

// Save users to storage (IndexedDB with localStorage fallback)
async function saveUsers(users) {
  try {
    // Try IndexedDB first
    const { setStorageItem } = await import('./storage');
    await setStorageItem(USERS_STORAGE_KEY, users);
    
    // Also save to localStorage as backup
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
    // Fallback to localStorage only
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage:', e);
    }
  }
}

// Local authentication functions
export const localAuth = {
  async signUp(email, password, name) {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Check if user exists
    const users = await getUsers();
    const existing = users.find(u => u.email === email);
    
    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    // Create new user with consistent ID format
    const hashedPassword = await hashPassword(password);
    const userId = Date.now(); // Simple ID generation
    const newUser = {
      id: userId,
      email,
      password_hash: hashedPassword,
      name,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsers(users);

    // Generate token
    const token = generateToken(userId, email);
    const user = { id: userId, email, name };

    return {
      success: true,
      token,
      user,
    };
  },

  async signIn(email, password) {
    const users = await getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Generate token
    const token = generateToken(user.id, user.email);
    const userData = { id: user.id, email: user.email, name: user.name };

    return {
      success: true,
      token,
      user: userData,
    };
  },

  verifyToken(token) {
    const payload = parseToken(token);
    if (!payload) {
      return { valid: false };
    }
    return { valid: true, user: payload };
  },
};
