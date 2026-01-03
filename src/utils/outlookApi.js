/**
 * Microsoft Graph API integration for Outlook Calendar
 * 
 * To use this, you need to:
 * 1. Register an app in Azure AD (https://portal.azure.com)
 * 2. Get Client ID and set redirect URI
 * 3. Add VITE_MICROSOFT_CLIENT_ID to .env file
 */

const MICROSOFT_AUTHORITY = 'https://login.microsoftonline.com/common';
const MICROSOFT_SCOPES = ['Calendars.Read', 'offline_access'];
const REDIRECT_URI = window.location.origin + '/auth/callback';

/**
 * Initialize Microsoft Authentication Library (MSAL)
 * Note: You'll need to install @azure/msal-browser package
 * npm install @azure/msal-browser
 */
let msalInstance = null;

export const initMsal = async (clientId) => {
  if (!clientId) {
    return null; // Return null instead of throwing to allow graceful degradation
  }

  // Dynamic import to avoid errors if package is not installed
  try {
    const { PublicClientApplication } = await import('@azure/msal-browser');
    
    const msalConfig = {
      auth: {
        clientId: clientId,
        authority: MICROSOFT_AUTHORITY,
        redirectUri: REDIRECT_URI,
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
      },
    };

    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
    return msalInstance;
  } catch (error) {
    console.warn('MSAL not available. Please install @azure/msal-browser:', error);
    return null;
  }
};

/**
 * Login to Microsoft account and get access token
 */
export const loginToMicrosoft = async () => {
  if (!msalInstance) {
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const instance = await initMsal(clientId);
    if (!instance) {
      throw new Error('Microsoft Client ID is not configured. Please set VITE_MICROSOFT_CLIENT_ID in your .env file and install @azure/msal-browser package.');
    }
  }

  if (!msalInstance) {
    throw new Error('Failed to initialize Microsoft authentication. Please check your configuration.');
  }

  try {
    const loginRequest = {
      scopes: MICROSOFT_SCOPES,
    };

    const response = await msalInstance.loginPopup(loginRequest);
    return response.accessToken;
  } catch (error) {
    console.error('Microsoft login error:', error);
    throw new Error('Failed to login to Microsoft account: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Get access token (silent if possible, otherwise prompt)
 */
export const getAccessToken = async () => {
  if (!msalInstance) {
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const instance = await initMsal(clientId);
    if (!instance) {
      throw new Error('Microsoft Client ID is not configured. Please set VITE_MICROSOFT_CLIENT_ID in your .env file and install @azure/msal-browser package.');
    }
  }

  if (!msalInstance) {
    throw new Error('Failed to initialize Microsoft authentication.');
  }

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    return await loginToMicrosoft();
  }

  try {
    const silentRequest = {
      scopes: MICROSOFT_SCOPES,
      account: accounts[0],
    };

    const response = await msalInstance.acquireTokenSilent(silentRequest);
    return response.accessToken;
  } catch (error) {
    // If silent token acquisition fails, try popup
    return await loginToMicrosoft();
  }
};

/**
 * Fetch calendar events from Outlook using Microsoft Graph API
 */
export const fetchOutlookEvents = async (startDate, endDate) => {
  const accessToken = await getAccessToken();

  // Format dates for Graph API (ISO 8601)
  const startDateTime = new Date(startDate).toISOString();
  const endDateTime = new Date(endDate + 'T23:59:59').toISOString();

  const url = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&$select=subject,start,end,location,bodyPreview,isAllDay`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error fetching Outlook events:', error);
    throw error;
  }
};

/**
 * Transform Outlook event to app meeting format
 */
export const transformOutlookEvent = (event, defaultProjectId = 1) => {
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  
  // Calculate duration in hours
  const durationMs = end - start;
  const duration = durationMs / (1000 * 60 * 60); // Convert to hours

  // Format time as HH:MM
  const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  
  // Format date as YYYY-MM-DD
  const date = start.toISOString().split('T')[0];

  return {
    title: event.subject || 'Untitled Event',
    start: startTime,
    duration: Math.max(0.5, Math.round(duration * 2) / 2), // Round to nearest 0.5 hours, minimum 0.5
    date: date,
    projectId: defaultProjectId,
    source: 'outlook',
    location: event.location?.displayName || '',
    notes: event.bodyPreview || '',
  };
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  if (!msalInstance) return false;
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0;
};

/**
 * Logout from Microsoft account
 */
export const logoutFromMicrosoft = async () => {
  if (!msalInstance) return;
  
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    await msalInstance.logoutPopup({
      account: accounts[0],
    });
  }
};
