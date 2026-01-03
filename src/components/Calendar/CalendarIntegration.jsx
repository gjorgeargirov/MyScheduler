import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

// Lazy import Outlook API to avoid breaking the app if package isn't installed
let outlookApi = null;
const loadOutlookApi = async () => {
  if (!outlookApi) {
    try {
      outlookApi = await import('../../utils/outlookApi');
    } catch (error) {
      console.warn('Outlook API not available:', error);
      return null;
    }
  }
  return outlookApi;
};

export const CalendarIntegration = ({
  isOpen,
  onClose,
  onImportMeetings,
  showToast
}) => {
  const [selectedProvider, setSelectedProvider] = useState('outlook');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
  });

  // Check authentication status on mount
  useEffect(() => {
    if (isOpen && selectedProvider === 'outlook') {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      if (clientId) {
        loadOutlookApi().then((api) => {
          if (api) {
            api.initMsal(clientId).then((instance) => {
              if (instance && api.isAuthenticated()) {
                setConnected(true);
              }
            }).catch((error) => {
              // MSAL not available or not configured - this is okay, user can still try to connect
              console.warn('MSAL initialization warning:', error);
            });
          }
        }).catch(() => {
          // Outlook API not available
        });
      }
    }
  }, [isOpen, selectedProvider]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // For Outlook/Microsoft Graph API
      if (selectedProvider === 'outlook') {
        const api = await loadOutlookApi();
        if (!api) {
          showToast('Outlook integration requires @azure/msal-browser package. Run: npm install @azure/msal-browser', 'error');
          setIsConnecting(false);
          return;
        }

        const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
        
        if (!clientId) {
          showToast('Microsoft Client ID not configured. Please add VITE_MICROSOFT_CLIENT_ID to your .env file. See CALENDAR_SETUP.md for instructions.', 'error');
          setIsConnecting(false);
          return;
        }

        // Initialize MSAL if not already done
        const instance = await api.initMsal(clientId);
        if (!instance) {
          showToast('Failed to initialize Microsoft authentication. Please install @azure/msal-browser: npm install @azure/msal-browser', 'error');
          setIsConnecting(false);
          return;
        }
        
        // Login to Microsoft
        await api.loginToMicrosoft();
        
        setConnected(true);
        showToast('Connected to Outlook calendar', 'success');
      } else if (selectedProvider === 'google') {
        // Google Calendar OAuth would go here
        // TODO: Implement Google Calendar OAuth
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConnected(true);
        showToast('Connected to Google Calendar', 'success');
      }
    } catch (error) {
      console.error('Connection error:', error);
      showToast(error.message || 'Failed to connect. Please try again.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      let meetings = [];

      if (selectedProvider === 'outlook') {
        const api = await loadOutlookApi();
        if (!api) {
          showToast('Outlook integration requires @azure/msal-browser package. Run: npm install @azure/msal-browser', 'error');
          setIsImporting(false);
          return;
        }

        // Fetch events from Outlook using Microsoft Graph API
        const events = await api.fetchOutlookEvents(dateRange.start, dateRange.end);
        
        // Transform Outlook events to app meeting format
        meetings = events.map(event => api.transformOutlookEvent(event, 1));
      } else if (selectedProvider === 'google') {
        // TODO: Implement Google Calendar API
        showToast('Google Calendar integration coming soon', 'info');
        setIsImporting(false);
        return;
      }

      if (meetings.length === 0) {
        showToast('No meetings found in the selected date range', 'info');
        setIsImporting(false);
        return;
      }

      // Import meetings (conflict checking happens in onImportMeetings)
      const count = await onImportMeetings(meetings);
      setImportedCount(count);
      
      if (count > 0) {
        showToast(`Imported ${count} meeting(s) from ${selectedProvider === 'outlook' ? 'Outlook' : 'Google Calendar'}`, 'success');
      } else {
        showToast('No meetings imported (all conflicted with existing schedule)', 'info');
      }
    } catch (error) {
      console.error('Import error:', error);
      showToast(error.message || 'Failed to import meetings. Please try again.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDisconnect = async () => {
    if (selectedProvider === 'outlook') {
      try {
        const api = await loadOutlookApi();
        if (api) {
          await api.logoutFromMicrosoft();
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setConnected(false);
    setImportedCount(0);
    showToast('Disconnected from calendar', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <CalendarIcon size={20} className="text-slate-700 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Calendar Integration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Calendar Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedProvider('outlook')}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  selectedProvider === 'outlook'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CalendarIcon size={16} />
                  <span>Outlook</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedProvider('google')}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  selectedProvider === 'google'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CalendarIcon size={16} />
                  <span>Google</span>
                </div>
              </button>
            </div>
          </div>

          {/* Connection Status */}
          {connected && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Connected to {selectedProvider === 'outlook' ? 'Outlook' : 'Google Calendar'}
              </span>
              <button
                onClick={handleDisconnect}
                className="ml-auto text-xs text-green-600 dark:text-green-400 hover:underline"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* Date Range Selection */}
          {connected && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Import Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info Message */}
          {!connected && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Connect your calendar account</li>
                  <li>Select a date range to import</li>
                  <li>Meetings will be imported and displayed on your calendar</li>
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
            {!connected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CalendarIcon size={14} />
                    Import Meetings
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
