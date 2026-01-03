import { useState, useEffect, useRef } from 'react';
import { getUserId } from '../utils/userId';
import { getStorageItem, setStorageItem } from '../utils/storage';

export const useLocalStorage = (key, defaultValue, customUserId = null) => {
  // Get user-specific key - use customUserId if provided (from auth), otherwise browser ID
  const browserUserId = getUserId();
  const userId = customUserId || browserUserId;
  const userKey = `${userId}_${key}`;
  const isInitialMount = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [value, setValue] = useState(defaultValue);

  // Load from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadValue = async () => {
      try {
        const stored = await getStorageItem(userKey);
        if (isMounted) {
          setValue(stored !== null ? stored : defaultValue);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading from storage:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadValue();

    return () => {
      isMounted = false;
    };
  }, [userKey]); // Only run on mount or key change

  // Save to IndexedDB when value changes (but not on initial load)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isLoading) {
      setStorageItem(userKey, value).catch(error => {
        console.error('Error saving to storage:', error);
      });
    }
  }, [userKey, value, isLoading]);

  return [value, setValue];
};
