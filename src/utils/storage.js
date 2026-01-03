/**
 * Enhanced storage utility with IndexedDB support
 * Falls back to localStorage if IndexedDB is not available
 * Provides better performance and more storage capacity
 */

const DB_NAME = 'FocusBoardDB';
const DB_VERSION = 1;
const STORE_NAME = 'userData';

let db = null;
let dbPromise = null;

// Initialize IndexedDB
const initDB = () => {
  if (dbPromise) return dbPromise;
  
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB not supported, falling back to localStorage');
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      resolve(null); // Fallback to localStorage
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
};

/**
 * Get value from storage (IndexedDB or localStorage fallback)
 */
export const getStorageItem = async (key) => {
  try {
    const database = await initDB();
    
    if (database) {
      // Use IndexedDB
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => {
          console.warn('IndexedDB get failed, falling back to localStorage');
          resolve(getLocalStorageItem(key));
        };
      });
    } else {
      // Fallback to localStorage
      return getLocalStorageItem(key);
    }
  } catch (error) {
    console.error('Storage get error:', error);
    return getLocalStorageItem(key);
  }
};

/**
 * Set value in storage (IndexedDB or localStorage fallback)
 */
export const setStorageItem = async (key, value) => {
  try {
    const database = await initDB();
    
    if (database) {
      // Use IndexedDB
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ key, value });

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn('IndexedDB set failed, falling back to localStorage');
          setLocalStorageItem(key, value);
          resolve();
        };
      });
    } else {
      // Fallback to localStorage
      setLocalStorageItem(key, value);
    }
  } catch (error) {
    console.error('Storage set error:', error);
    setLocalStorageItem(key, value);
  }
};

/**
 * Remove item from storage
 */
export const removeStorageItem = async (key) => {
  try {
    const database = await initDB();
    
    if (database) {
      return new Promise((resolve) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          removeLocalStorageItem(key);
          resolve();
        };
      });
    } else {
      removeLocalStorageItem(key);
    }
  } catch (error) {
    console.error('Storage remove error:', error);
    removeLocalStorageItem(key);
  }
};

// localStorage fallback functions
const getLocalStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('localStorage set error:', error);
  }
};

const removeLocalStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('localStorage remove error:', error);
  }
};
