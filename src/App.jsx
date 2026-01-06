import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Wand2,
  Trash2,
  Folder,
  CheckCircle2,
  AlertCircle,
  GripHorizontal,
  MoreVertical,
  Edit2,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  FileText,
  Calendar,
  Users,
  CheckSquare,
  MessageCircle,
  Send,
  RotateCcw,
  Sparkles,
  RefreshCw,
  LogIn,
  LogOut,
  User
} from 'lucide-react';

// Import extracted components and utilities
import { useLocalStorage } from './hooks/useLocalStorage';
import { Toast } from './components/Common/Toast';
import NotificationCenter from './components/Modals/NotificationCenter';
import { LoadingOverlay } from './components/Common/LoadingSpinner';
import { ProjectModal } from './components/Forms/ProjectModal';
import AppHeader from './components/Layout/AppHeader';
import CalendarPage from './components/Pages/CalendarPage';
import TasksPage from './components/Pages/TasksPage';
import TaskDetailsModal from './components/Modals/TaskDetailsModal';
import TaskFormModal from './components/Modals/TaskFormModal';
import MeetingFormModal from './components/Modals/MeetingFormModal';
import SettingsModal from './components/Modals/SettingsModal';
import { 
  formatDateForStorage, 
  formatDate, 
  isSameDay, 
  isToday, 
  timeToHours, 
  hoursToTime,
  isOverdue,
  isDueSoon
} from './utils/dateHelpers';
import { getUserId } from './utils/userId';
import { getStorageItem, setStorageItem } from './utils/storage';
import { useAuth } from './contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// Module-level counter for unique ID generation
let globalIdCounter = 0;

const AIKanbanScheduler = () => {
  
  // Authentication
  const { user, signOut, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Get user ID for data isolation - use authenticated user ID if logged in, otherwise browser ID
  const browserUserId = getUserId();
  const userId = isAuthenticated && user ? `user_${user.id}` : browserUserId;
  const getUserKey = useCallback((key) => `${userId}_${key}`, [userId]);
  
  // Log app configuration on mount
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 APP CONFIGURATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('👤 User Status:');
    console.log('   Authenticated:', isAuthenticated);
    console.log('   User:', user ? `${user.name} (${user.email})` : 'Not logged in');
    console.log('   User ID:', userId);
    console.log('   Browser User ID:', browserUserId);
    console.log('');
    console.log('💾 Storage Configuration:');
    console.log('   Storage key prefix:', userId);
    console.log('   Using:', isAuthenticated ? '🟢 Authenticated user storage' : '🔴 Browser storage');
    console.log('═══════════════════════════════════════════════════════════');
  }, [isAuthenticated, user, userId, browserUserId]);
  
  // --- State with localStorage persistence ---
  // Use authenticated user ID if logged in, otherwise browser ID
  // Note: When user signs in, data will be associated with their account ID
  // When user signs out, data will be associated with browser ID (local only)
  const [projects, setProjects] = useLocalStorage('focusboard_projects', [
    { id: 1, name: 'Website Redesign', color: 'bg-blue-500' },
    { id: 2, name: 'Mobile App', color: 'bg-indigo-500' },
    { id: 3, name: 'Marketing', color: 'bg-purple-500' },
    { id: 4, name: 'Internal Tools', color: 'bg-orange-500' },
  ], userId);

  const [tasks, setTasks] = useLocalStorage('focusboard_tasks', [
    { id: 1, title: 'Design landing page', status: 'backlog', duration: 2, priority: 'high', projectId: 1, notes: '', dueDate: null, sticker: '' },
    { id: 2, title: 'Review code PR', status: 'in-progress', duration: 1, priority: 'medium', projectId: 2, notes: '', dueDate: null, sticker: '' },
    { id: 3, title: 'Write documentation', status: 'in-progress', duration: 1.5, priority: 'low', projectId: 1, notes: '', dueDate: null, sticker: '' },
    { id: 4, title: 'Team standup', status: 'done', duration: 0.5, priority: 'high', projectId: 3, notes: '', dueDate: null, sticker: '' },
  ], userId);

  const [meetings, setMeetings] = useLocalStorage('focusboard_meetings', [
    { id: 1, title: 'Team Standup', start: '09:00', duration: 0.5, projectId: 3 },
    { id: 2, title: 'Client Call', start: '14:00', duration: 1, projectId: 1 },
  ], userId);

  const [schedule, setSchedule] = useLocalStorage('focusboard_schedule', [], userId);
  
  // Migrate data when user logs in (from browser ID to user ID)
  useEffect(() => {
    if (isAuthenticated && user && userId !== browserUserId) {
      // User just logged in - check if there's browser-specific data to migrate
      const migrateData = async () => {
        try {
          const browserProjects = await getStorageItem(`${browserUserId}_focusboard_projects`);
          const browserTasks = await getStorageItem(`${browserUserId}_focusboard_tasks`);
          const browserMeetings = await getStorageItem(`${browserUserId}_focusboard_meetings`);
          const browserSchedule = await getStorageItem(`${browserUserId}_focusboard_schedule`);
          
          // Only migrate if account has no data yet
          const accountProjects = await getStorageItem(`${userId}_focusboard_projects`);
          if (!accountProjects && browserProjects) {
            // Migrate browser data to account
            await setStorageItem(`${userId}_focusboard_projects`, browserProjects);
            if (browserTasks) await setStorageItem(`${userId}_focusboard_tasks`, browserTasks);
            if (browserMeetings) await setStorageItem(`${userId}_focusboard_meetings`, browserMeetings);
            if (browserSchedule) await setStorageItem(`${userId}_focusboard_schedule`, browserSchedule);
            
            // Reload state
            window.location.reload();
          }
        } catch (error) {
          console.error('Error migrating data:', error);
        }
      };
      
      migrateData();
    }
  }, [isAuthenticated, user, userId, browserUserId]);
  
  // Migrate existing schedule items to have unique IDs and dates (run once on mount)
  useEffect(() => {
    const todayStr = formatDateForStorage(new Date());
    
    // Migrate schedule items
    const scheduleNeedsMigration = schedule.some(item => !item.id || !item.date);
    if (scheduleNeedsMigration) {
      const migrated = schedule.map((item, index) => ({
        ...item,
        id: item.id || generateUniqueId(`schedule-${item.taskId}-${item.start || 'unknown'}-migrated-`),
        date: item.date || todayStr
      }));
      setSchedule(migrated);
    }
    
    // Migrate meetings
    const meetingsNeedsMigration = meetings.some(m => !m.date);
    if (meetingsNeedsMigration) {
      const migratedMeetings = meetings.map(m => ({
        ...m,
        date: m.date || todayStr
      }));
      setMeetings(migratedMeetings);
    }

    // Migrate tasks to include sticker property
    const tasksNeedsMigration = tasks.some(t => t.sticker === undefined);
    if (tasksNeedsMigration) {
      const migratedTasks = tasks.map(t => ({
        ...t,
        sticker: t.sticker || ''
      }));
      setTasks(migratedTasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]); // Persistent notifications
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // Forms
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('1');
  const [newTaskProject, setNewTaskProject] = useState(() => projects.length > 0 ? projects[0].id : 1);
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskSticker, setNewTaskSticker] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [taskFormErrors, setTaskFormErrors] = useState({});
  
  // Update newTaskProject when projects change (if selected project was deleted)
  useEffect(() => {
    if (projects.length > 0) {
      const projectExists = projects.find(p => p.id === newTaskProject);
      if (!projectExists) {
        setNewTaskProject(projects[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingStart, setNewMeetingStart] = useState('08:00');
  const [newMeetingEnd, setNewMeetingEnd] = useState('09:00');
  const [newMeetingProject, setNewMeetingProject] = useState(1);
  const [newMeetingRepeat, setNewMeetingRepeat] = useState(false);
  const [newMeetingRepeatDays, setNewMeetingRepeatDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false
  });
  
  // Meeting editing
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editMeetingTitle, setEditMeetingTitle] = useState('');
  const [editMeetingStart, setEditMeetingStart] = useState('08:00');
  const [editMeetingEnd, setEditMeetingEnd] = useState('09:00');
  const [editMeetingProject, setEditMeetingProject] = useState(1);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('bg-blue-500');
  
  // Project editing
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectColor, setEditProjectColor] = useState('bg-blue-500');

  // Task editing
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDuration, setEditTaskDuration] = useState(1);
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [editTaskProject, setEditTaskProject] = useState(1);
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskNotes, setEditTaskNotes] = useState('');
  const [editTaskSticker, setEditTaskSticker] = useState('');
  const [showEditStickerPicker, setShowEditStickerPicker] = useState(false);

  // Popular emojis for sticker picker - Task-focused stickers
  const popularEmojis = [
    // Task status & actions
    '✅', '❌', '⏸️', '▶️', '⏹️', '🔄', '⏭️', '⏮️', '⏩', '⏪',
    // Documents & notes
    '📝', '📋', '📌', '📎', '📄', '📃', '📑', '📊', '📈', '📉',
    // Time & dates
    '📅', '📆', '🗓️', '⏰', '⏳', '⏲️', '🕐', '🕑', '🕒', '🕓',
    // Technology & work
    '💻', '🖥️', '⌨️', '🖱️', '💾', '📱', '📞', '📧', '📨', '📩',
    // Goals & achievements
    '🎯', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '⭐', '🌟', '💎',
    // Communication
    '📢', '📣', '🔔', '🔕', '💬', '💭', '🗨️', '🗯️', '📮', '📬',
    // Tools & utilities
    '🔍', '🔎', '🔐', '🔑', '🔒', '🔓', '💡', '🔦', '⚡', '🔋',
    // Progress & workflow
    '🚀', '📦', '📤', '📥', '📂', '📁', '🗂️', '📇', '🗃️', '🗄️',
    // Creative & design
    '🎨', '🖌️', '🖍️', '✏️', '✒️', '🖊️', '🖋️', '📝', '📏', '📐',
    // Learning & knowledge
    '📚', '📖', '📗', '📘', '📙', '📕', '📓', '📔', '📒', '🔖',
    // Buildings & locations
    '🏢', '🏭', '🏗️', '🏛️', '🏘️', '🏚️', '🏠', '🏡', '🏪', '🏫',
    '🏬', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🕍', '⛩️', '🛕',
    // Tools & hardware
    '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🗜️', '⚖️', '🦯',
    '🔗', '⛓️', '🧰', '🧲', '🪚', '🪛', '🪜', '🪣', '🪤', '🪡'
  ];

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Navigation
  const [activePage, setActivePage] = useState('calendar'); // 'calendar' or 'tasks'
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Auto-rollover incomplete tasks from previous day
  useEffect(() => {
    const todayStr = formatDateForStorage(new Date());
    const selectedDateStr = formatDateForStorage(selectedDate);
    
    // Only rollover when viewing today or a future date
    const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
    const todayDateObj = new Date(todayStr + 'T00:00:00');
    if (selectedDateObj < todayDateObj) {
      return; // Don't rollover when viewing past dates
    }

    // Calculate the previous day (one day before selected date)
    const previousDate = new Date(selectedDateObj);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateStr = formatDateForStorage(previousDate);

    // Get schedule items from the previous day only
    const previousScheduleItems = schedule.filter(item => {
      const itemDate = item.date || todayStr;
      return itemDate === previousDateStr;
    });

    if (previousScheduleItems.length === 0) {
      return; // No schedule items from previous day
    }

    // Find tasks that were scheduled yesterday but aren't done
    const incompleteTasks = previousScheduleItems
      .map(item => {
        const task = tasks.find(t => t.id === item.taskId);
        return task && task.status !== 'done' ? { task, previousScheduleItem: item } : null;
      })
      .filter(Boolean);

    if (incompleteTasks.length === 0) {
      return; // All tasks are done
    }

    // Check if tasks are already scheduled for the selected date
    const existingScheduleForDate = schedule.filter(
      item => (item.date || todayStr) === selectedDateStr
    );
    const alreadyScheduledTaskIds = new Set(
      existingScheduleForDate.map(item => item.taskId)
    );

    // Filter out tasks that are already scheduled for today
    const tasksToRollover = incompleteTasks.filter(
      ({ task }) => !alreadyScheduledTaskIds.has(task.id)
    );

    if (tasksToRollover.length > 0) {
      // Add tasks to schedule for the selected date
      const newScheduleItems = tasksToRollover.map(({ task, previousScheduleItem }) => ({
        id: generateUniqueId(`schedule-${task.id}-rollover-`),
        taskId: task.id,
        taskTitle: task.title,
        start: previousScheduleItem?.start || '09:00', // Use previous start time or default
        duration: task.duration,
        date: selectedDateStr
      }));

      setSchedule(prevSchedule => [...prevSchedule, ...newScheduleItems]);
      
      if (selectedDateStr === todayStr) {
        showToast(`${tasksToRollover.length} incomplete task(s) rolled over from yesterday`, 'info');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, schedule, tasks]);

  // Force dark mode - always enabled
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  // Task details modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [showBreakTimePicker, setShowBreakTimePicker] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState('12:00');
  const [breakDuration, setBreakDuration] = useState(1);


  // Handle working hours update
  const handleSaveWorkingHours = (start, end) => {
    setWorkdayStart(start);
    setWorkdayEnd(end);
  };

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [draggedMeetingId, setDraggedMeetingId] = useState(null);
  const [draggedScheduleItem, setDraggedScheduleItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState(null);
  
  // Touch drag state for mobile
  const [touchDragState, setTouchDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    element: null,
    type: null, // 'task', 'meeting', 'schedule'
    id: null
  });
  const touchDragStateRef = useRef(touchDragState);
  
  // Keep ref in sync with state
  useEffect(() => {
    touchDragStateRef.current = touchDragState;
  }, [touchDragState]);

  // Time & Config
  const [currentTime, setCurrentTime] = useState(new Date());
  // Workday hours from localStorage
  const [workdayStart, setWorkdayStart] = useLocalStorage('workdayStart', 9, userId);
  const [workdayEnd, setWorkdayEnd] = useLocalStorage('workdayEnd', 17, userId);
  const [showSettings, setShowSettings] = useState(false);
  
  // Track which reminders have been shown (to avoid duplicates) - using ref to avoid infinite loops
  const shownRemindersRef = useRef(new Set());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- Helpers (defined early so they can be used in useEffects) ---
  // Note: These functions use setToasts and setNotificationPermission which are defined above
  
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    const timestamp = Date.now();
    
    // Add to notifications (persistent) - all notifications go to notification center only
    setNotifications(prev => [{ id, message, type, timestamp, read: false }, ...prev]);
    
    // No toast display - notifications only appear in notification center
  }, []);
  
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);
  
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);
  
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Show browser/desktop notification
  const showBrowserNotification = useCallback((title, message) => {
    if (!('Notification' in window)) {
      return; // Browser doesn't support notifications
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/vite.svg', // You can add a custom icon later
            badge: '/vite.svg',
            tag: 'reminder', // Prevents duplicate notifications
            requireInteraction: false
          });
        }
      });
    } else if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: 'reminder',
        requireInteraction: false
      });
    }
  }, []);
  
  // Reminder system: Check for upcoming tasks/meetings 10 minutes before
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const todayStr = formatDateForStorage(now);
      const reminderMinutes = 10; // 10 minutes before
      const reminderHours = reminderMinutes / 60; // Convert to hours
      
      // Get all scheduled items for today
      const todaySchedule = schedule.filter(s => (s.date || todayStr) === todayStr);
      const todayMeetings = meetings.filter(m => {
        // Check if meeting should appear today (handles recurring meetings)
        if (m.repeatDays) {
          const today = new Date(todayStr + 'T00:00:00');
          const dayOfWeek = today.getDay();
          const dayMap = {
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5
          };
          const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
          return dayName ? m.repeatDays[dayName] : false;
        }
        return (m.date || todayStr) === todayStr;
      });
      
      // Combine tasks and meetings with their start times
      const upcomingItems = [];
      
      // Add tasks
      todaySchedule.forEach(item => {
        const task = tasks.find(t => t.id === item.taskId);
        if (task) {
          const startHours = timeToHours(item.start);
          const timeUntilStart = startHours - currentHour;
          
          // Check if it's between 10 and 9 minutes before (within the 10-minute reminder window)
          // This gives us a 1-minute window to catch the reminder
          const minTime = reminderHours - 0.017; // ~9 minutes (0.15 hours - 0.017 = ~0.133 hours)
          const maxTime = reminderHours + 0.017; // ~11 minutes (0.15 hours + 0.017 = ~0.167 hours)
          
          if (timeUntilStart > 0 && timeUntilStart >= minTime && timeUntilStart <= maxTime) {
            upcomingItems.push({
              id: `task-${item.taskId}-${item.start}`,
              type: 'task',
              title: task.title,
              start: item.start,
              startHours: startHours
            });
          }
        }
      });
      
      // Add meetings
      todayMeetings.forEach(m => {
        const startHours = timeToHours(m.start);
        const timeUntilStart = startHours - currentHour;
        
        // Check if it's between 10 and 9 minutes before (within the 10-minute reminder window)
        const minTime = reminderHours - 0.017; // ~9 minutes
        const maxTime = reminderHours + 0.017; // ~11 minutes
        
        if (timeUntilStart > 0 && timeUntilStart >= minTime && timeUntilStart <= maxTime) {
          upcomingItems.push({
            id: `meeting-${m.id}-${m.start}`,
            type: 'meeting',
            title: m.title,
            start: m.start,
            startHours: startHours
          });
        }
      });
      
      // Show reminders for items we haven't shown yet
      upcomingItems.forEach(item => {
        if (!shownRemindersRef.current.has(item.id)) {
          const itemType = item.type === 'task' ? 'Task' : 'Meeting';
          const minutesUntil = Math.round((item.startHours - currentHour) * 60);
          const message = `${itemType} "${item.title}" starts in ${minutesUntil} minutes at ${item.start}`;
          
          // Show toast notification (in-page)
          showToast(`⏰ ${message}`, 'info');
          
          // Show browser/desktop notification
          showBrowserNotification(`⏰ Reminder: ${itemType} starting soon`, message);
          
          // Add to shown reminders
          shownRemindersRef.current.add(item.id);
        }
      });
      
      // Clean up old reminders (for items that have already started) to prevent memory buildup
      const cleaned = new Set();
      shownRemindersRef.current.forEach(id => {
        // Parse the ID to get the start time
        const parts = id.split('-');
        if (parts.length >= 3) {
          const startTime = parts[parts.length - 1]; // Last part is the start time
          const startHours = timeToHours(startTime);
          // Keep reminders for items that haven't started yet or started less than 1 hour ago
          if (startHours >= currentHour - 1) {
            cleaned.add(id);
          }
        } else {
          // If we can't parse, keep it (better safe than sorry)
          cleaned.add(id);
        }
      });
      shownRemindersRef.current = cleaned;
    };
    
    // Check immediately and then every minute
    checkReminders();
    const reminderTimer = setInterval(checkReminders, 60000); // Check every minute
    
    return () => clearInterval(reminderTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, schedule, meetings, tasks]);

  // Ensure dark mode is always enabled
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('dark');
    
    // Also set on body as fallback
    const body = document.body;
    body.classList.add('dark');
  }, []);

  // Request notification permission on mount (but don't be pushy)
  useEffect(() => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      setNotificationPermission(permission);
    }
  }, []);

  const getProject = useCallback((id) => {
    // Handle null, undefined, or 0
    if (!id || id === 0 || id === '0' || id === null || id === undefined) {
      return { name: 'No Project', color: 'bg-gray-400' };
    }
    
    // Convert to number for comparison
    const numId = Number(id);
    if (isNaN(numId)) {
      return { name: 'No Project', color: 'bg-gray-400' };
    }
    
    // Find project by comparing both as numbers
    const project = projects.find(p => {
      const pId = Number(p.id);
      return pId === numId;
    });
    
    return project || { name: 'No Project', color: 'bg-gray-400' };
  }, [projects]);

  const colorToHex = (bg) => {
    const colors = {
      'bg-blue-500': '#3b82f6', 'bg-indigo-500': '#6366f1', 'bg-purple-500': '#a855f7',
      'bg-orange-500': '#f97316', 'bg-red-500': '#ef4444', 'bg-pink-500': '#ec4899',
      'bg-green-500': '#22c55e', 'bg-teal-500': '#14b8a6', 'bg-yellow-500': '#eab308',
      'bg-cyan-500': '#06b6d4', 'bg-gray-400': '#9ca3af'
    };
    return colors[bg] || '#9ca3af';
  };

  // timeToHours and hoursToTime are now imported from utils

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityWeight = (priority) => {
    return { high: 3, medium: 2, low: 1 }[priority] || 2;
  };

  // Unified conflict detection - optimized and memoized
  const checkConflict = useCallback((start, duration, excludeId = null, dateStr = null) => {
    const startHours = timeToHours(start);
    const endHours = startHours + duration;
    const targetDate = dateStr || formatDateForStorage(selectedDate);
    
    // Pre-filter items for the target date to avoid repeated date checks
    const todayStr = formatDateForStorage(new Date());
    const dateMeetings = meetings.filter(m => {
      if (excludeId && m.id === excludeId) return false;
      
      // Handle recurring meetings
      if (m.repeatDays) {
        const targetDateObj = new Date(targetDate + 'T00:00:00');
        const dayOfWeek = targetDateObj.getDay();
        const dayMap = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5
        };
        const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
        return dayName && m.repeatDays[dayName];
      }
      
      // Regular meetings with specific date
      const meetingDate = m.date || todayStr;
      return meetingDate === targetDate;
    });
    
    const dateSchedule = schedule.filter(s => {
      const itemDate = s.date || todayStr;
      return itemDate === targetDate && (!excludeId || s.taskId !== excludeId);
    });
    
    // Check meetings
    for (const meeting of dateMeetings) {
      const mStart = timeToHours(meeting.start);
      const mEnd = mStart + meeting.duration;
      if (startHours < mEnd && endHours > mStart) {
        return { conflict: true, type: 'meeting', item: meeting };
      }
    }
    
    // Check scheduled tasks
    for (const item of dateSchedule) {
      const tStart = timeToHours(item.start);
      const tEnd = tStart + item.duration;
      if (startHours < tEnd && endHours > tStart) {
        const task = tasks.find(t => t.id === item.taskId);
        return { conflict: true, type: 'task', item: task, scheduleItem: item };
      }
    }
    
    return { conflict: false };
  }, [meetings, schedule, tasks, selectedDate, formatDateForStorage]);

  // Check if a meeting conflicts (wrapper for backward compatibility)
  const checkMeetingConflict = useCallback((start, duration, excludeId = null) => {
    return checkConflict(start, duration, excludeId);
  }, [checkConflict]);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Project filter
      if (filterProject !== 'all' && task.projectId !== Number(filterProject)) {
        return false;
      }
      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'all' && task.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, filterProject, filterPriority, filterStatus]);

  // --- Actions ---

  // Move task function - defined early for use in handleDrop
  const moveTask = useCallback((taskId, newStatus) => {
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (newStatus === 'done') {
      // Remove from schedule when marked as done
      setSchedule(prevSchedule => prevSchedule.filter(s => s.taskId !== taskId));
      showToast('Task completed!');
    }
  }, []);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = useCallback((e, columnId) => {
    e.preventDefault();
    if (draggedTaskId) {
      moveTask(draggedTaskId, columnId);
      setDraggedTaskId(null);
      setDragOverColumn(null);
    }
  }, [draggedTaskId, moveTask]);

  const addTask = () => {
    // Reset errors
    const errors = {};
    
    // Validate required fields
    if (!newTaskTitle.trim()) {
      errors.title = 'Task title is required';
    }
    
    if (!newTaskDuration || parseFloat(newTaskDuration) < 0.5) {
      errors.duration = 'Duration must be at least 0.5 hours';
    }
    
    if (projects.length === 0) {
      errors.project = 'No projects available. Please create a project first.';
      setTaskFormErrors(errors);
      return;
    }
    
    // If there are errors, show them and return
    if (Object.keys(errors).length > 0) {
      setTaskFormErrors(errors);
      return;
    }
    
    // Clear errors if validation passes
    setTaskFormErrors({});
    
    // Ensure projectId is valid and exists - convert to number for consistency
    const projectId = Number(newTaskProject);
    
    // Verify the project exists by comparing both as numbers
    const selectedProject = projects.find(p => Number(p.id) === projectId);
    
    if (!selectedProject) {
      // If selected project doesn't exist, use first available project
      const firstProject = projects[0];
      setNewTaskProject(Number(firstProject.id));
      showToast(`Project not found, using "${firstProject.name}" instead`, 'info');
      
    const newTask = {
      id: generateUniqueId(`task-`),
      title: newTaskTitle,
      status: 'backlog',
        duration: Number(newTaskDuration),
        priority: newTaskPriority,
        projectId: Number(firstProject.id),
        notes: newTaskNotes || '',
        dueDate: newTaskDueDate || null,
        sticker: newTaskSticker || '',
    };
    setTasks([...tasks, newTask]);
    } else {
      // Project exists, create task with selected project
      const newTask = {
        id: generateUniqueId(`task-`),
        title: newTaskTitle,
        status: 'backlog',
        duration: Number(newTaskDuration),
        priority: newTaskPriority,
        projectId: Number(selectedProject.id), // Ensure it's a number
        notes: newTaskNotes || '',
        dueDate: newTaskDueDate || null,
        sticker: newTaskSticker || '',
      };
      setTasks([...tasks, newTask]);
    }
    
    // Reset form
    setNewTaskTitle('');
    setNewTaskDuration('1');
    setNewTaskPriority('medium');
    setNewTaskNotes('');
    setNewTaskDueDate('');
    setNewTaskSticker('');
    setTaskFormErrors({});
    setShowTaskForm(false);
  };

  const startEditTask = (task) => {
    setEditingTask(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDuration(task.duration);
    setEditTaskPriority(task.priority);
    setEditTaskProject(task.projectId);
    setEditTaskDueDate(task.dueDate || '');
    setEditTaskNotes(task.notes || '');
    setEditTaskSticker(task.sticker || '');
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setTaskNotes(task.notes || '');
    setTaskDueDate(task.dueDate || '');
  };

  const saveTaskDetails = () => {
    if (!selectedTask) return;
    
    setTasks(tasks.map(t => 
      t.id === selectedTask.id 
        ? { ...t, notes: taskNotes, dueDate: taskDueDate || null }
        : t
    ));
    setSelectedTask(null);
    setTaskNotes('');
    setTaskDueDate('');
    showToast('Task details updated');
  };


  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };


  const isSameDay = useCallback((date1, date2) => {
    return formatDateForStorage(date1) === formatDateForStorage(date2);
  }, [formatDateForStorage]);

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  const saveEditTask = () => {
    if (!editTaskTitle.trim()) return showToast('Please enter a task title', 'error');
    
    // Ensure projectId is a number and exists
    const projectId = Number(editTaskProject);
    const selectedProject = projects.find(p => Number(p.id) === projectId);
    
    let finalProjectId = projectId;
    if (!selectedProject && projects.length > 0) {
      // If project doesn't exist, use first available
      finalProjectId = Number(projects[0].id);
      setEditTaskProject(finalProjectId);
      showToast(`Project not found, using "${projects[0].name}" instead`, 'info');
    } else if (!selectedProject) {
      finalProjectId = 0;
    }
    
    setTasks(tasks.map(t => 
      t.id === editingTask 
        ? { 
            ...t, 
            title: editTaskTitle, 
            duration: Number(editTaskDuration), 
            priority: editTaskPriority, 
            projectId: finalProjectId,
            dueDate: editTaskDueDate || null,
            notes: editTaskNotes || '',
            sticker: editTaskSticker || ''
          }
        : t
    ));
    // Update schedule if task is scheduled
    const scheduleItem = schedule.find(s => s.taskId === editingTask);
    if (scheduleItem) {
      const conflict = checkConflict(scheduleItem.start, editTaskDuration, editingTask);
      if (conflict.conflict) {
        showToast('Schedule conflict detected! Please reschedule.', 'error');
      }
    }
    setEditingTask(null);
    showToast('Task updated');
  };

  const cancelEditTask = () => {
    setEditingTask(null);
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setSchedule(schedule.filter(s => s.taskId !== taskId));
    showToast('Task deleted');
  };

  const openProjectModal = (project = null) => {
    if (project) {
      setEditingProject(project.id);
      setEditProjectName(project.name);
      setEditProjectColor(project.color);
    } else {
      setEditingProject(null);
      setEditProjectName('');
      setEditProjectColor('bg-blue-500');
      setNewProjectName('');
      setNewProjectColor('bg-blue-500');
    }
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setEditingProject(null);
    setEditProjectName('');
    setEditProjectColor('bg-blue-500');
    setNewProjectName('');
    setNewProjectColor('bg-blue-500');
  };

  const addProject = () => {
    if (!newProjectName.trim()) return showToast('Please enter a project name', 'error');
    setProjects([...projects, { id: Date.now(), name: newProjectName, color: newProjectColor }]);
    setNewProjectName('');
    setNewProjectColor('bg-blue-500');
    closeProjectModal();
    showToast('Project created');
  };

  const saveEditProject = () => {
    if (!editProjectName.trim()) return showToast('Please enter a project name', 'error');
    
    setProjects(projects.map(p => 
      p.id === editingProject
        ? { ...p, name: editProjectName, color: editProjectColor }
        : p
    ));
    
    closeProjectModal();
    showToast('Project updated');
  };

  const handleDeleteProject = (projectId) => {
    // Check if any tasks are using this project
    const tasksUsingProject = tasks.filter(t => t.projectId === projectId);
    
    if (tasksUsingProject.length > 0) {
      if (!window.confirm(`This project has ${tasksUsingProject.length} task(s). Delete anyway? Tasks will be moved to "No Project".`)) {
        return;
      }
      // Reassign tasks to a default project (first available or create a default)
      const defaultProject = projects.find(p => p.id !== projectId) || { id: 0, name: 'No Project', color: 'bg-gray-400' };
      setTasks(tasks.map(t => 
        t.projectId === projectId ? { ...t, projectId: defaultProject.id } : t
      ));
    }
    
    setProjects(projects.filter(p => p.id !== projectId));
    closeProjectModal();
    showToast('Project deleted');
  };

  // Helper to get days based on selected repeat days
  const getRepeatDays = (startDate, repeatDays, days = 90) => {
    const selectedDays = [];
    const dayMap = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5
    };
    
    const current = new Date(startDate);
    let count = 0;
    
    while (selectedDays.length < days && count < 365) {
      const dayOfWeek = current.getDay();
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
      
      if (dayName && repeatDays[dayName]) {
        selectedDays.push(formatDateForStorage(new Date(current)));
      }
      current.setDate(current.getDate() + 1);
      count++;
    }
    
    return selectedDays;
  };

  const startEditMeeting = (meeting) => {
    setEditingMeeting(meeting.id);
    setEditMeetingTitle(meeting.title);
    setEditMeetingStart(meeting.start);
    const endTime = hoursToTime(timeToHours(meeting.start) + meeting.duration);
    setEditMeetingEnd(endTime);
    // Breaks don't have projects, so set to null or first project (but won't be used for breaks)
    setEditMeetingProject(meeting.isBreak ? null : (meeting.projectId || 1));
    setShowMeetingForm(true);
  };

  const saveEditMeeting = () => {
    if (!editMeetingTitle.trim()) return showToast('Enter a meeting title', 'error');
    
    const start = timeToHours(editMeetingStart);
    const end = timeToHours(editMeetingEnd);
    
    if (end <= start) return showToast('End time must be after start time', 'error');

    const duration = end - start;
    const meeting = meetings.find(m => m.id === editingMeeting);
    if (!meeting) return;

    // Check conflict (excluding the current meeting)
    const conflict = checkMeetingConflict(editMeetingStart, duration, editingMeeting);
    if (conflict.conflict) {
      showToast(`Conflict detected with ${conflict.type === 'meeting' ? 'meeting' : 'task'}: ${conflict.item.title}`, 'error');
      return;
    }

    // Update the meeting
    setMeetings(meetings.map(m => 
      m.id === editingMeeting
        ? {
            ...m,
            title: editMeetingTitle,
            start: editMeetingStart,
            duration: duration,
            // Breaks are private, keep projectId as null
            projectId: m.isBreak ? null : editMeetingProject
          }
        : m
    ));
    
    setEditingMeeting(null);
    setEditMeetingTitle('');
    setEditMeetingStart('08:00');
    setEditMeetingEnd('09:00');
    setEditMeetingProject(1);
    setShowMeetingForm(false);
    showToast('Meeting updated');
  };

  const addMeeting = () => {
    if (!newMeetingTitle.trim()) return showToast('Enter a meeting title', 'error');
    
    const start = timeToHours(newMeetingStart);
    const end = timeToHours(newMeetingEnd);
    
    if (end <= start) return showToast('End time must be after start time', 'error');

    const duration = end - start;
    
    if (newMeetingRepeat) {
      // Check if at least one day is selected
      const hasSelectedDays = Object.values(newMeetingRepeatDays).some(selected => selected);
      if (!hasSelectedDays) {
        showToast('Please select at least one day to repeat', 'error');
        return;
      }
      
      // Check conflict for the creation date
      const conflict = checkMeetingConflict(newMeetingStart, duration);
      if (conflict.conflict) {
        showToast(`Conflict detected with ${conflict.type === 'meeting' ? 'meeting' : 'task'}: ${conflict.item.title}`, 'error');
        return;
      }

      // Create a single recurring meeting entry with repeatDays configuration
      // This allows the meeting to appear on any date that matches the repeat pattern
      const recurringMeeting = {
        id: generateUniqueId(`meeting-recurring-`),
        title: newMeetingTitle,
        start: newMeetingStart,
        duration: duration,
        projectId: newMeetingProject,
        date: formatDateForStorage(selectedDate), // Store the creation date for reference
        repeatDays: { ...newMeetingRepeatDays }, // Store the repeat pattern
        isRecurring: true
      };

      setMeetings([...meetings, recurringMeeting]);
      const dayCount = Object.values(newMeetingRepeatDays).filter(Boolean).length;
      showToast(`Recurring meeting created (${dayCount} day(s) per week)`);
    } else {
      // Single meeting
      const conflict = checkMeetingConflict(newMeetingStart, duration);
      if (conflict.conflict) {
        showToast(`Conflict detected with ${conflict.type === 'meeting' ? 'meeting' : 'task'}: ${conflict.item.title}`, 'error');
        return;
      }

    setMeetings([...meetings, {
      id: Date.now(),
      title: newMeetingTitle,
      start: newMeetingStart,
        duration: duration,
        projectId: newMeetingProject,
        date: formatDateForStorage(selectedDate)
    }]);
      
      showToast('Meeting scheduled');
    }
    
    setNewMeetingTitle('');
    setNewMeetingStart('08:00');
    setNewMeetingEnd('09:00');
    setNewMeetingProject(projects.length > 0 ? projects[0].id : 1);
    setNewMeetingRepeat(false);
    setNewMeetingRepeatDays({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false
    });
    setShowMeetingForm(false);
  };

  // Open break time picker
  const openBreakTimePicker = (breakType) => {
    const defaultTimes = {
      lunch: { start: '12:00', duration: 1 },
      coffee: { start: '10:30', duration: 0.5 },
      pause: { start: '15:00', duration: 0.5 },
      exercise: { start: '07:00', duration: 1 }
    };
    const defaults = defaultTimes[breakType] || { start: '12:00', duration: 1 };
    setBreakStartTime(defaults.start);
    setBreakDuration(defaults.duration);
    setSelectedBreakType(breakType);
    setShowBreakTimePicker(true);
  };

  // Quick add break blocks (lunch, coffee, pause, etc.) - repeats daily
  const addQuickBreak = (breakType, startTime, duration) => {
    const breakConfigs = {
      lunch: { title: '🍽️ Lunch Break', color: '#f59e0b' },
      coffee: { title: '☕ Coffee Break', color: '#a855f7' },
      pause: { title: '⏸️ Pause', color: '#64748b' },
      exercise: { title: '💪 Exercise', color: '#10b981' }
    };

    const config = breakConfigs[breakType];
    if (!config) return;

    // Check if this break already exists (same type, time, and duration)
    const existingBreak = meetings.find(m => 
      m.isBreak && 
      m.breakType === breakType && 
      m.start === startTime && 
      m.duration === duration &&
      m.repeatDays // Only check recurring breaks
    );

    if (existingBreak) {
      showToast(`${config.title} already exists`, 'info');
      setShowBreakTimePicker(false);
      setSelectedBreakType(null);
      return;
    }

    // Check for conflict on the selected date
    const conflict = checkMeetingConflict(startTime, duration);
    if (conflict.conflict) {
      showToast(`Conflict detected with ${conflict.type === 'meeting' ? 'meeting' : 'task'}: ${conflict.item.title}`, 'error');
      return;
    }

    // Create recurring break that repeats every weekday (Monday-Friday)
    setMeetings([...meetings, {
      id: Date.now() + Math.random(),
      title: config.title,
      start: startTime,
      duration: duration,
      projectId: null, // Breaks are private, not associated with projects
      date: formatDateForStorage(selectedDate),
      isBreak: true,
      breakType: breakType,
      breakColor: config.color,
      repeatDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true
      }
    }]);
    
    showToast(`${config.title} added (repeats daily)`);
    setShowBreakTimePicker(false);
    setSelectedBreakType(null);
  };

  // Import meetings from external calendars
  const importMeetingsFromCalendar = async (importedMeetings) => {
    let importedCount = 0;
    const newMeetings = [];

    for (const meeting of importedMeetings) {
      // Check for conflicts
      const conflict = checkMeetingConflict(meeting.start, meeting.duration, null, meeting.date);
      if (!conflict.conflict) {
        newMeetings.push({
          id: generateUniqueId(`meeting-imported-`),
          title: meeting.title,
          start: meeting.start,
          duration: meeting.duration,
          projectId: meeting.projectId || (projects.length > 0 ? projects[0].id : 1),
          date: meeting.date || formatDateForStorage(selectedDate),
          source: meeting.source || 'external'
        });
        importedCount++;
      }
    }

    if (newMeetings.length > 0) {
      setMeetings([...meetings, ...newMeetings]);
    }

    return importedCount;
  };
  
  // Helper to check conflicts for a specific date (uses unified checkConflict)
  const checkMeetingConflictForDate = useCallback((start, duration, dateStr) => {
    return checkConflict(start, duration, null, dateStr);
  }, [checkConflict]);

  // Helper to generate unique IDs - always uses global counter for true uniqueness
  const generateUniqueId = (prefix = '') => {
    globalIdCounter += 1;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const perf = typeof performance !== 'undefined' ? performance.now() : Math.random();
    return `${prefix}${timestamp}-${globalIdCounter}-${random}-${perf.toFixed(3)}`;
  };

  // OpenAI-powered AI Schedule Generator
  const generateSchedule = async () => {
    const selectedDateStr = formatDateForStorage(selectedDate);
    
    // Get all in-progress tasks (both unscheduled and already scheduled for this date)
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    if (inProgressTasks.length === 0) return showToast('No tasks in "In Progress" to schedule', 'error');
    
    // Remove existing schedule items for these tasks on this date (to allow reorganization)
    const tasksToReschedule = inProgressTasks.map(t => t.id);
    const updatedSchedule = schedule.filter(s => {
      const itemDate = s.date || formatDateForStorage(new Date());
      return !(itemDate === selectedDateStr && tasksToReschedule.includes(s.taskId));
    });
    setSchedule(updatedSchedule);
    
    // Now all in-progress tasks are ready to be scheduled
    const toSchedule = inProgressTasks;
    
    setIsLoading(true);
    showToast('Reorganizing schedule with AI...', 'info');
    
    try {
      // Prepare current schedule information (only for selected date) - use updatedSchedule
      const currentSchedule = updatedSchedule
        .filter(s => (s.date || formatDateForStorage(new Date())) === selectedDateStr)
        .map(s => {
          const task = tasks.find(t => t.id === s.taskId);
          return {
            task: task?.title || 'Unknown',
            start: s.start,
            duration: s.duration,
            priority: task?.priority || 'medium'
          };
        });
      
      const currentMeetings = meetings
        .filter(m => (m.date || formatDateForStorage(new Date())) === selectedDateStr)
        .map(m => ({
          title: m.title,
          start: m.start,
          duration: m.duration
        }));
      
      // Split long tasks into smaller chunks
      const MAX_CHUNK_DURATION = 2; // Maximum duration for each chunk (2 hours)
      const MIN_TASK_DURATION_TO_SPLIT = 3; // Split tasks longer than 3 hours
      
      const tasksToSchedule = [];
      const taskChunksMap = new Map(); // Map original task ID to array of chunk info
      
      for (const task of toSchedule) {
        const project = getProject(task.projectId);
        
        if (task.duration > MIN_TASK_DURATION_TO_SPLIT) {
          // Split long task into chunks
          const numChunks = Math.ceil(task.duration / MAX_CHUNK_DURATION);
          const chunkDuration = task.duration / numChunks;
          const chunks = [];
          
          for (let i = 0; i < numChunks; i++) {
            const chunkId = `${task.id}-chunk-${i + 1}`;
            chunks.push({
              id: chunkId,
              originalTaskId: task.id,
              chunkIndex: i + 1,
              totalChunks: numChunks,
              duration: i === numChunks - 1 ? (task.duration - (chunkDuration * (numChunks - 1))) : chunkDuration, // Last chunk gets remainder
              title: `${task.title} (Part ${i + 1}/${numChunks})`,
              priority: task.priority,
              project: project.name,
              dueDate: task.dueDate,
              notes: task.notes
            });
            tasksToSchedule.push(chunks[i]);
          }
          
          taskChunksMap.set(task.id, chunks);
        } else {
          // Regular task, no splitting needed
          tasksToSchedule.push({
            id: task.id,
            title: task.title,
            duration: task.duration,
            priority: task.priority,
            project: project.name,
            dueDate: task.dueDate,
            notes: task.notes
          });
        }
      }
      
      // Calculate available time slots (only for selected date)
      const allOccupied = [];
      
      // Add meetings for selected date
      meetings
        .filter(m => (m.date || formatDateForStorage(new Date())) === selectedDateStr)
        .forEach(m => {
          const start = timeToHours(m.start);
          const end = start + m.duration;
          if (end > workdayStart && start < workdayEnd) {
            allOccupied.push({ 
              start: Math.max(start, workdayStart), 
              end: Math.min(end, workdayEnd),
              type: 'meeting',
              title: m.title
            });
          }
        });
      
      // Add scheduled tasks for selected date (use updatedSchedule - excludes tasks being rescheduled)
      updatedSchedule
        .filter(s => (s.date || formatDateForStorage(new Date())) === selectedDateStr)
        .forEach(s => {
          const start = timeToHours(s.start);
          const end = start + s.duration;
          if (end > workdayStart && start < workdayEnd) {
            allOccupied.push({ 
              start: Math.max(start, workdayStart), 
              end: Math.min(end, workdayEnd),
              type: 'task',
              title: s.taskTitle || 'Task'
            });
          }
        });
      
      // Sort and merge overlapping
      allOccupied.sort((a, b) => a.start - b.start);
      const mergedOccupied = [];
      for (const slot of allOccupied) {
        if (mergedOccupied.length === 0) {
          mergedOccupied.push({ ...slot });
        } else {
          const last = mergedOccupied[mergedOccupied.length - 1];
          if (slot.start <= last.end) {
            last.end = Math.max(last.end, slot.end);
          } else {
            mergedOccupied.push({ ...slot });
          }
        }
      }
      
      // Calculate free time slots
      const freeSlots = [];
      if (mergedOccupied.length === 0) {
        freeSlots.push({ start: workdayStart, end: workdayEnd });
      } else {
        // Before first occupied slot
        if (mergedOccupied[0].start > workdayStart) {
          freeSlots.push({ start: workdayStart, end: mergedOccupied[0].start });
        }
        // Between occupied slots
        for (let i = 1; i < mergedOccupied.length; i++) {
          const gapStart = mergedOccupied[i - 1].end;
          const gapEnd = mergedOccupied[i].start;
          if (gapEnd > gapStart) {
            freeSlots.push({ start: gapStart, end: gapEnd });
          }
        }
        // After last occupied slot
        const lastSlot = mergedOccupied[mergedOccupied.length - 1];
        if (lastSlot.end < workdayEnd) {
          freeSlots.push({ start: lastSlot.end, end: workdayEnd });
        }
      }
      
      // Sort tasks by priority (high > medium > low) and due date before sending to AI
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      const sortedTasks = [...tasksToSchedule].sort((a, b) => {
        // First sort by priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by due date (earlier due dates first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1; // Tasks with due dates come first
        if (b.dueDate) return 1;
        return 0;
      });

      // Create prompt for OpenAI
      const prompt = `You are a calendar scheduling assistant. Help me schedule tasks optimally.

WORKDAY: ${workdayStart}:00 to ${workdayEnd}:00 (${workdayEnd - workdayStart} hours available)

CURRENT SCHEDULE (OCCUPIED TIME):
${mergedOccupied.length > 0 ? mergedOccupied.map(s => `  - ${hoursToTime(s.start)} to ${hoursToTime(s.end)}: ${s.title} (${s.type})`).join('\n') : 'No occupied time slots.'}

AVAILABLE FREE TIME SLOTS (USE THESE - THEY ARE GUARANTEED TO BE FREE):
${freeSlots.length > 0 ? freeSlots.map((slot, i) => {
  const slotDuration = slot.end - slot.start;
  const canFitTasks = sortedTasks.filter(t => t.duration <= slotDuration).length;
  return `  ${i + 1}. ${hoursToTime(slot.start)} to ${hoursToTime(slot.end)} (${slotDuration.toFixed(1)} hours available) - Can fit ${canFitTasks} task(s) from the list`;
}).join('\n') : 'NO FREE TIME AVAILABLE'}

**CRITICAL: You MUST use these available free time slots. Do NOT skip them!**
**Example: If slot 1 is "12:00 to 14:00 (2.0 hours available)", you can schedule:**
- One 2.0h task at 12:00
- One 1.0h task at 12:00 and one 1.0h task at 13:00
- One 1.5h task at 12:00 and one 0.5h task at 13:30
- But NOT a 2.5h task (it won't fit)

TASKS TO SCHEDULE (SORTED BY PRIORITY - HIGH PRIORITY FIRST):
${sortedTasks.map((t, i) => {
  const priorityEmoji = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
  const isChunk = t.originalTaskId !== undefined;
  const chunkInfo = isChunk ? ` [CHUNK ${t.chunkIndex}/${t.totalChunks} of task ${t.originalTaskId}]` : '';
  return `${i + 1}. ${priorityEmoji} Task ID ${t.id}: "${t.title}" - ${t.duration.toFixed(1)}h, PRIORITY: ${t.priority.toUpperCase()}, Project: ${t.project}${chunkInfo}${t.dueDate ? `, Due: ${t.dueDate}` : ''}${t.notes ? `, Notes: ${t.notes}` : ''}`;
}).join('\n')}

IMPORTANT - TASK SPLITTING:
- Some long tasks have been split into smaller chunks (shown as "Part X/Y")
- Each chunk MUST be scheduled in a DIFFERENT time slot
- Chunks from the same original task should be spaced out throughout the day (not back-to-back)
- Schedule chunks in different available time slots to allow for breaks, meetings, and other tasks between them
- Example: If "Design Project (Part 1/3)" is scheduled at 09:00, schedule "Design Project (Part 2/3)" at a later time like 11:00 or 14:00, NOT immediately after

CRITICAL SCHEDULING RULES (FOLLOW IN THIS EXACT ORDER):
1. **PRIORITY IS THE MOST IMPORTANT FACTOR**: 
   - ALWAYS schedule HIGH priority tasks FIRST, before any medium or low priority tasks
   - HIGH priority tasks should get the BEST available time slots (earliest/most convenient)
   - Then schedule MEDIUM priority tasks
   - Finally schedule LOW priority tasks in remaining slots
   - If you cannot fit all tasks, prioritize HIGH priority tasks - they MUST be scheduled

2. **DUE DATE SECONDARY**: 
   - Among tasks of the same priority, schedule tasks with earlier due dates first
   - Tasks without due dates come last within their priority group

3. **TIME SLOT SELECTION**:
   - HIGH priority tasks → Use the BEST/EARLIEST available slots
   - MEDIUM priority tasks → Use remaining good slots
   - LOW priority tasks → Use any remaining slots

4. **TECHNICAL REQUIREMENTS**:
   - Use ONLY the available free time slots listed above
   - Each task must fit completely within a free time slot
   - Do NOT schedule tasks in occupied time slots
   - **CRITICAL: NEVER schedule multiple tasks at the same start time** - each task must have a unique start time
   - **CRITICAL: Tasks must NOT overlap** - if Task A is 09:00-10:00 (1 hour), Task B must start at 10:00 or later, NOT at 09:30
   - **CRITICAL: For split tasks (chunks), schedule each chunk in a DIFFERENT time slot with gaps between them**
   - If a task is split into chunks, space them out (e.g., Part 1 at 09:00, Part 2 at 11:00, Part 3 at 14:00)
   - Use 24-hour format (HH:MM) for start times
   - Calculate end times: Task at 09:00 with 1.5h duration ends at 10:30
   - Ensure no task ends after workday end time (${workdayEnd}:00)

Return ONLY a JSON array with this exact format:
[
  {"taskId": 123, "start": "09:00"},
  {"taskId": 456, "start": "11:00"}
]

CRITICAL RULES - READ CAREFULLY:
- DO NOT include "duration" in your response - it will be taken from the original task
- ONLY provide "taskId" and "start" time
- The duration is already specified in the task list above - DO NOT change it
- You are ONLY choosing WHEN to schedule each task, NOT how long it takes

**OVERLAP PREVENTION (CRITICAL):**
- **NEVER schedule multiple tasks at the same start time** - each task must have a unique start time
- **Tasks MUST NOT overlap** - calculate end times carefully:
  * Task with 1.0h duration at 09:00 ends at 10:00
  * Task with 1.5h duration at 09:00 ends at 10:30
  * Task with 2.0h duration at 09:00 ends at 11:00
- If Task A is 09:00-10:00 (1h duration), Task B must start at 10:00 or later, NOT at 09:30 or 09:00
- If Task A is 09:00-10:30 (1.5h duration), Task B must start at 10:30 or later
- **ALWAYS check that task end time (start + duration) does not exceed workday end (${workdayEnd}:00)**

**USING AVAILABLE SLOTS (MANDATORY):**
- **YOU MUST USE THE AVAILABLE FREE TIME SLOTS LISTED ABOVE**
- **DO NOT skip available slots - use them in order of priority**
- Each task must fit COMPLETELY within a free time slot
- **Fill available slots efficiently - don't leave gaps unused if tasks can fit**
- Example: If free slot is 12:00-14:00 (2 hours), you can schedule:
  * One 2h task at 12:00
  * One 1h task at 12:00 and one 1h task at 13:00
  * One 1.5h task at 12:00 and one 0.5h task at 13:30
  * But NOT a 2.5h task (it won't fit)
- **If you have a 2-hour slot (12:00-14:00) and a 1.5h task, schedule it at 12:00, NOT at 15:00**

**CHUNK SCHEDULING:**
- For split tasks (chunks), schedule each chunk in a DIFFERENT time slot
- Space chunks out: if Part 1 is at 09:00, Part 2 should be at 11:00 or later (not 10:00)
- Each chunk must fit in its own available slot

**PRIORITY ORDER:**
- The tasks are already sorted by priority in the list above
- Schedule them in that order - HIGH priority tasks FIRST
- Use the exact taskId numbers from the "TASKS TO SCHEDULE" list above
- Only include tasks that can fit in the available free slots
- If a task cannot be scheduled, omit it from the response
- **NEVER omit a HIGH priority task if there's any way to fit it**

**VALIDATION CHECKLIST before including a task:**
1. Is the start time within workday hours (${workdayStart}:00 to ${workdayEnd}:00)?
2. Does start + duration fit within an available free slot?
3. Does start + duration not exceed workday end?
4. Does this task not overlap with any other task in your response?
5. For chunks: Is this chunk spaced out from other chunks of the same task?`;

      // Call OpenAI API
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful calendar scheduling assistant. Always respond with valid JSON only, no explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse JSON response (handle markdown code blocks if present)
      let scheduleData;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, aiResponse];
        scheduleData = JSON.parse(jsonMatch[1] || aiResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse);
        throw new Error('Invalid response format from AI');
      }

      if (!Array.isArray(scheduleData)) {
        throw new Error('AI response is not an array');
      }

      // Convert AI suggestions to schedule items
      const newScheduleItems = [];
      const scheduledTaskIds = new Set();
      const scheduledChunkIds = new Set(); // Track scheduled chunks
      const usedTimeSlots = new Map(); // Track used time slots to prevent duplicates - key: startHours, value: endHours
      const originalTaskChunksScheduled = new Map(); // Track how many chunks of each original task are scheduled

      // Sort suggestions by priority and start time to process high priority first
      const sortedSuggestions = [...scheduleData].sort((a, b) => {
        const taskA = tasksToSchedule.find(t => t.id === a.taskId);
        const taskB = tasksToSchedule.find(t => t.id === b.taskId);
        if (!taskA || !taskB) return 0;
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[taskB.priority] || 2) - (priorityOrder[taskA.priority] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        return timeToHours(a.start) - timeToHours(b.start);
      });

      for (const suggestion of sortedSuggestions) {
        // Find task in tasksToSchedule (could be original or chunk)
        const taskOrChunk = tasksToSchedule.find(t => t.id === suggestion.taskId);
        if (!taskOrChunk) continue;
        
        // Check if this is a chunk
        const isChunk = taskOrChunk.originalTaskId !== undefined;
        const originalTaskId = isChunk ? taskOrChunk.originalTaskId : taskOrChunk.id;
        const originalTask = toSchedule.find(t => t.id === originalTaskId);
        
        if (!originalTask) continue;
        
        // Use chunk duration if it's a chunk, otherwise use original task duration
        const taskDuration = taskOrChunk.duration;
        
        // Validate the time slot
        const startHours = timeToHours(suggestion.start);
        const endHours = startHours + taskDuration;
        
        if (startHours < workdayStart || endHours > workdayEnd) {
          showToast(`Skipped "${taskOrChunk.title}": Outside workday hours`, 'info');
          continue; // Skip if outside workday
        }
        
        // Check if this time slot fits within any available free slot
        let fitsInFreeSlot = false;
        for (const freeSlot of freeSlots) {
          if (startHours >= freeSlot.start && endHours <= freeSlot.end) {
            fitsInFreeSlot = true;
            break;
          }
        }
        
        if (!fitsInFreeSlot) {
          showToast(`Skipped "${taskOrChunk.title}": Time slot ${suggestion.start} does not fit in any available free slot`, 'info');
          continue;
        }
        
        // Check for overlaps with items already scheduled in this batch
        let hasOverlap = false;
        for (const [existingStart, existingEnd] of usedTimeSlots.entries()) {
          if (startHours < existingEnd && endHours > existingStart) {
            hasOverlap = true;
            break;
          }
        }
        
        if (hasOverlap) {
          showToast(`Skipped "${taskOrChunk.title}": Time slot overlap with another task in this batch`, 'info');
          continue;
        }
        
        // Check for conflicts with existing schedule/meetings (excluding items being rescheduled)
        const conflict = checkConflict(suggestion.start, taskDuration, originalTaskId, selectedDateStr);
        if (conflict.conflict) {
          showToast(`Skipped "${taskOrChunk.title}": Conflict with ${conflict.type === 'meeting' ? 'meeting' : 'task'} "${conflict.item?.title || 'Unknown'}"`, 'info');
          continue;
        }
        
        // For chunks, check if this chunk is already scheduled
        if (isChunk && scheduledChunkIds.has(taskOrChunk.id)) {
          continue;
        }
        
        // For non-chunk tasks, check if already scheduled
        if (!isChunk && scheduledTaskIds.has(originalTaskId)) {
          continue;
        }
        
        // Generate truly unique ID
        const uniqueId = generateUniqueId(`schedule-${originalTaskId}-${suggestion.start}-${isChunk ? `chunk${taskOrChunk.chunkIndex}` : ''}-`);
        
        newScheduleItems.push({
          id: uniqueId,
          taskId: originalTaskId, // Always use original task ID
          taskTitle: isChunk ? taskOrChunk.title : originalTask.title, // Use chunk title if it's a chunk
          start: suggestion.start,
          duration: taskDuration,
          date: formatDateForStorage(selectedDate),
          isChunk: isChunk, // Mark if this is a chunk
          chunkIndex: isChunk ? taskOrChunk.chunkIndex : undefined,
          totalChunks: isChunk ? taskOrChunk.totalChunks : undefined
        });
        
        if (isChunk) {
          scheduledChunkIds.add(taskOrChunk.id);
          // Track chunks scheduled for original task
          const chunksCount = originalTaskChunksScheduled.get(originalTaskId) || 0;
          originalTaskChunksScheduled.set(originalTaskId, chunksCount + 1);
        } else {
          scheduledTaskIds.add(originalTaskId);
        }
        
        // Track this time slot using hours for better overlap detection
        usedTimeSlots.set(startHours, endHours);
      }
      
      // Check if all chunks of a split task are scheduled
      for (const [originalTaskId, chunks] of taskChunksMap.entries()) {
        const scheduledChunksCount = originalTaskChunksScheduled.get(originalTaskId) || 0;
        if (scheduledChunksCount > 0 && scheduledChunksCount < chunks.length) {
          const originalTask = toSchedule.find(t => t.id === originalTaskId);
          showToast(`"${originalTask?.title}" partially scheduled (${scheduledChunksCount}/${chunks.length} parts)`, 'info');
        }
      }

            // Add to schedule (use updatedSchedule as base - this reorganizes tasks)
            if (newScheduleItems.length > 0) {
              setSchedule([...updatedSchedule, ...newScheduleItems]);
              showToast(`AI reorganized ${newScheduleItems.length} task(s)!`, 'success');
            } else {
              setSchedule(updatedSchedule); // Restore schedule even if nothing was scheduled
              showToast('AI could not schedule any tasks. Try manual scheduling.', 'info');
            }
            setIsLoading(false);
      
      // Report unscheduled tasks (check both regular tasks and split tasks)
      const unscheduled = toSchedule.filter(t => {
        if (taskChunksMap.has(t.id)) {
          // For split tasks, check if at least one chunk was scheduled
          return !originalTaskChunksScheduled.has(t.id);
        } else {
          // For regular tasks, check if scheduled
          return !scheduledTaskIds.has(t.id);
        }
      });
      
      if (unscheduled.length > 0) {
        unscheduled.forEach(task => {
          showToast(`Could not schedule "${task.title}"`, 'error');
        });
      }
      
    } catch (error) {
      console.error('AI Scheduling error:', error);
      showToast(`AI scheduling failed: ${error.message}. Using fallback algorithm...`, 'error');
      
      // Fallback to original algorithm with task splitting support
      setTimeout(() => {
      // Use the same task splitting logic
      const MAX_CHUNK_DURATION = 2;
      const MIN_TASK_DURATION_TO_SPLIT = 3;
      
      const tasksToScheduleFallback = [];
      const taskChunksMapFallback = new Map();
      
      for (const task of toSchedule) {
        if (task.duration > MIN_TASK_DURATION_TO_SPLIT) {
          const numChunks = Math.ceil(task.duration / MAX_CHUNK_DURATION);
          const chunkDuration = task.duration / numChunks;
          const chunks = [];
          
          for (let i = 0; i < numChunks; i++) {
            chunks.push({
              id: `${task.id}-chunk-${i + 1}`,
              originalTaskId: task.id,
              chunkIndex: i + 1,
              totalChunks: numChunks,
              duration: i === numChunks - 1 ? (task.duration - (chunkDuration * (numChunks - 1))) : chunkDuration,
              title: `${task.title} (Part ${i + 1}/${numChunks})`,
              priority: task.priority,
              projectId: task.projectId
            });
            tasksToScheduleFallback.push(chunks[i]);
          }
          taskChunksMapFallback.set(task.id, chunks);
        } else {
          tasksToScheduleFallback.push({
            id: task.id,
            originalTaskId: undefined,
            duration: task.duration,
            title: task.title,
            priority: task.priority,
            projectId: task.projectId
          });
        }
      }
      
      // Sort by priority (high first) and duration (shorter first for flexibility)
      const sortedTasks = [...tasksToScheduleFallback].sort((a, b) => {
        const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return a.duration - b.duration;
      });

      const newScheduleItems = [];
      let scheduleCounter = 0; // Counter to ensure unique IDs even when created in same millisecond
      const scheduledChunksFallback = new Set();
      const scheduledTasksFallback = new Set();

      for (const taskOrChunk of sortedTasks) {
        const isChunk = taskOrChunk.originalTaskId !== undefined;
        const originalTaskId = isChunk ? taskOrChunk.originalTaskId : taskOrChunk.id;
        const originalTask = toSchedule.find(t => t.id === originalTaskId);
        
        if (!originalTask) continue;
        
        // Skip if already scheduled
        if (isChunk && scheduledChunksFallback.has(taskOrChunk.id)) continue;
        if (!isChunk && scheduledTasksFallback.has(originalTaskId)) continue;
        
        const task = originalTask;
        scheduleCounter++;
        let scheduled = false;
        
        // Get all occupied time slots (only within workday, merge overlapping ones)
        const occupiedSlots = [];
        
        // Add meetings for selected date (only if within workday)
        meetings
          .filter(m => (m.date || formatDateForStorage(new Date())) === selectedDateStr)
          .forEach(m => {
            const start = timeToHours(m.start);
            const end = start + m.duration;
            // Only add if it overlaps with workday
            if (end > workdayStart && start < workdayEnd) {
              occupiedSlots.push({
                start: Math.max(start, workdayStart), 
                end: Math.min(end, workdayEnd) 
              });
            }
          });
        
        // Add already scheduled tasks for selected date (only if within workday) - use updatedSchedule
        updatedSchedule
          .filter(s => (s.date || formatDateForStorage(new Date())) === selectedDateStr)
          .forEach(s => {
            const start = timeToHours(s.start);
            const end = start + s.duration;
            // Only add if it overlaps with workday
            if (end > workdayStart && start < workdayEnd) {
              occupiedSlots.push({ 
                start: Math.max(start, workdayStart), 
                end: Math.min(end, workdayEnd) 
              });
            }
          });
        
        // Add newly scheduled items from this batch (only if within workday)
        newScheduleItems.forEach(s => {
          const start = timeToHours(s.start);
          const end = start + s.duration;
          // Only add if it overlaps with workday
          if (end > workdayStart && start < workdayEnd) {
            occupiedSlots.push({ 
              start: Math.max(start, workdayStart), 
              end: Math.min(end, workdayEnd) 
            });
          }
        });
        
        // Merge overlapping slots
        occupiedSlots.sort((a, b) => a.start - b.start);
        const mergedSlots = [];
        for (const slot of occupiedSlots) {
          if (mergedSlots.length === 0) {
            mergedSlots.push({ ...slot });
          } else {
            const last = mergedSlots[mergedSlots.length - 1];
            if (slot.start <= last.end) {
              // Overlapping or adjacent, merge them
              last.end = Math.max(last.end, slot.end);
            } else {
              // New slot
              mergedSlots.push({ ...slot });
            }
          }
        }
        
        // Now find available gaps - try all possible gaps
        // Check before first occupied slot
        if (mergedSlots.length === 0) {
          // No occupied slots, use entire workday
          if (workdayEnd - workdayStart >= taskDuration) {
            const startTime = hoursToTime(workdayStart);
            const conflict = checkConflict(startTime, taskDuration, originalTaskId, selectedDateStr);
            if (!conflict.conflict) {
              newScheduleItems.push({
                id: generateUniqueId(`schedule-${originalTaskId}-${isChunk ? `chunk${taskOrChunk.chunkIndex}` : ''}-`),
                taskId: originalTaskId,
                taskTitle: taskTitle,
                start: startTime,
                duration: taskDuration,
                date: formatDateForStorage(selectedDate),
                isChunk: isChunk,
                chunkIndex: isChunk ? taskOrChunk.chunkIndex : undefined,
                totalChunks: isChunk ? taskOrChunk.totalChunks : undefined
              });
              scheduled = true;
              if (isChunk) scheduledChunksFallback.add(taskOrChunk.id);
              else scheduledTasksFallback.add(originalTaskId);
            }
          }
        } else {
          // Check gap before first slot
          const firstGapStart = workdayStart;
          const firstGapEnd = mergedSlots[0].start;
          const firstGapDuration = firstGapEnd - firstGapStart;
          
          if (firstGapDuration >= taskDuration && firstGapStart < firstGapEnd) {
            const startTime = hoursToTime(firstGapStart);
            const conflict = checkConflict(startTime, taskDuration, originalTaskId, selectedDateStr);
            if (!conflict.conflict) {
              newScheduleItems.push({
                id: generateUniqueId(`schedule-${originalTaskId}-${isChunk ? `chunk${taskOrChunk.chunkIndex}` : ''}-`),
                taskId: originalTaskId,
                taskTitle: taskTitle,
                start: startTime,
                duration: taskDuration,
                date: formatDateForStorage(selectedDate),
                isChunk: isChunk,
                chunkIndex: isChunk ? taskOrChunk.chunkIndex : undefined,
                totalChunks: isChunk ? taskOrChunk.totalChunks : undefined
              });
              scheduled = true;
              if (isChunk) scheduledChunksFallback.add(taskOrChunk.id);
              else scheduledTasksFallback.add(originalTaskId);
            }
          }
          
          // Check gaps between merged slots
          if (!scheduled) {
            for (let i = 1; i < mergedSlots.length && !scheduled; i++) {
              const gapStart = mergedSlots[i - 1].end;
              const gapEnd = mergedSlots[i].start;
              const gapDuration = gapEnd - gapStart;
              
              // Check if gap is valid and large enough
              if (gapStart < gapEnd && gapDuration >= taskDuration && gapStart >= workdayStart && gapEnd <= workdayEnd) {
                const startTime = hoursToTime(gapStart);
                const conflict = checkConflict(startTime, taskDuration, originalTaskId, selectedDateStr);
                if (!conflict.conflict) {
                  newScheduleItems.push({
                    id: generateUniqueId(`schedule-${originalTaskId}-${isChunk ? `chunk${taskOrChunk.chunkIndex}` : ''}-`),
                    taskId: originalTaskId,
                    taskTitle: taskTitle,
                    start: startTime,
                    duration: taskDuration,
                    date: formatDateForStorage(selectedDate),
                    isChunk: isChunk,
                    chunkIndex: isChunk ? taskOrChunk.chunkIndex : undefined,
                    totalChunks: isChunk ? taskOrChunk.totalChunks : undefined
                  });
                  scheduled = true;
                  if (isChunk) scheduledChunksFallback.add(taskOrChunk.id);
                  else scheduledTasksFallback.add(originalTaskId);
                  break;
                }
              }
            }
          }
          
          // Check after last occupied slot
          if (!scheduled) {
            const lastSlot = mergedSlots[mergedSlots.length - 1];
            const gapStart = lastSlot.end;
            const gapEnd = workdayEnd;
            const gapDuration = gapEnd - gapStart;
            
            // Check if gap is valid and large enough
            if (gapStart < gapEnd && gapDuration >= taskDuration && gapStart >= workdayStart && gapStart < workdayEnd) {
              const startTime = hoursToTime(gapStart);
              const conflict = checkConflict(startTime, taskDuration, originalTaskId, selectedDateStr);
              if (!conflict.conflict) {
                newScheduleItems.push({
                  id: generateUniqueId(`schedule-${originalTaskId}-${isChunk ? `chunk${taskOrChunk.chunkIndex}` : ''}-`),
                  taskId: originalTaskId,
                  taskTitle: taskTitle,
                  start: startTime,
                  duration: taskDuration,
                  date: formatDateForStorage(selectedDate),
                  isChunk: isChunk,
                  chunkIndex: isChunk ? taskOrChunk.chunkIndex : undefined,
                  totalChunks: isChunk ? taskOrChunk.totalChunks : undefined
                });
                scheduled = true;
                if (isChunk) scheduledChunksFallback.add(taskOrChunk.id);
                else scheduledTasksFallback.add(originalTaskId);
              }
            }
          }
        }

        if (!scheduled) {
          // For chunks, try to find a later slot (space them out)
          if (isChunk && taskOrChunk.chunkIndex > 1) {
            // Try to find a slot later in the day for subsequent chunks
            const minGapAfterPrevious = 1; // At least 1 hour gap between chunks
            const previousChunk = newScheduleItems.find(item => 
              item.taskId === originalTaskId && 
              item.isChunk && 
              item.chunkIndex === taskOrChunk.chunkIndex - 1
            );
            
            if (previousChunk) {
              const prevEnd = timeToHours(previousChunk.start) + previousChunk.duration;
              const minStart = prevEnd + minGapAfterPrevious;
              
              // Check gaps after minimum start time
              for (let i = 0; i < mergedSlots.length && !scheduled; i++) {
                const slot = mergedSlots[i];
                if (slot.end <= minStart) continue; // Too early
                
                const gapStart = Math.max(slot.end, minStart);
                const gapEnd = i < mergedSlots.length - 1 ? mergedSlots[i + 1].start : workdayEnd;
                const gapDuration = gapEnd - gapStart;
                
                if (gapDuration >= taskDuration && gapStart < workdayEnd) {
                  const startTime = hoursToTime(gapStart);
                  const conflict = checkConflict(startTime, taskDuration, originalTaskId, selectedDateStr);
                  if (!conflict.conflict) {
                    newScheduleItems.push({
                      id: generateUniqueId(`schedule-${originalTaskId}-chunk${taskOrChunk.chunkIndex}-`),
                      taskId: originalTaskId,
                      taskTitle: taskTitle,
                      start: startTime,
                      duration: taskDuration,
                      date: formatDateForStorage(selectedDate),
                      isChunk: true,
                      chunkIndex: taskOrChunk.chunkIndex,
                      totalChunks: taskOrChunk.totalChunks
                    });
                    scheduled = true;
                    scheduledChunksFallback.add(taskOrChunk.id);
                    break;
                  }
                }
              }
            }
          }
          
          // Calculate total free time more accurately - only count time within workday
          let totalOccupied = 0;
          mergedSlots.forEach(slot => {
            // Only count the portion of the slot that's within workday hours
            const slotStart = Math.max(slot.start, workdayStart);
            const slotEnd = Math.min(slot.end, workdayEnd);
            if (slotEnd > slotStart) {
              totalOccupied += (slotEnd - slotStart);
            }
          });
          const freeHours = Math.max(0, (workdayEnd - workdayStart) - totalOccupied);
          
          if (freeHours < task.duration) {
            showToast(`Could not schedule "${task.title}": Needs ${task.duration}h but only ${freeHours.toFixed(1)}h available`, 'error');
          } else {
            showToast(`Could not schedule "${task.title}": No ${task.duration}h consecutive slot available. Try scheduling manually.`, 'error');
          }
        }
      }

        setSchedule([...updatedSchedule, ...newScheduleItems]);
        if (newScheduleItems.length > 0) {
          showToast(`Fallback: Reorganized ${newScheduleItems.length} task(s)!`);
        }
        setIsLoading(false);
      }, 100);
    }
  };

  // HOUR_HEIGHT constant - must match CalendarPage.jsx
  const HOUR_HEIGHT = 70;
  const CALENDAR_TOP_OFFSET = 8; // Top padding offset - must match CalendarPage.jsx
  
  // Calculate hour from mouse/touch position
  const getHourFromPosition = (e, container) => {
    const rect = container.getBoundingClientRect();
    // Support both mouse and touch events
    const y = (e.clientY || (e.touches && e.touches[0]?.clientY) || e.changedTouches?.[0]?.clientY) - rect.top;
    // Account for top padding offset
    const yRelative = y - CALENDAR_TOP_OFFSET;
    // Only calculate if we're within the events layer bounds
    if (yRelative < 0) {
      return workdayStart;
    }
    const hourOffset = yRelative / HOUR_HEIGHT;
    const hour = workdayStart + hourOffset;
    return Math.max(workdayStart, Math.min(workdayEnd - 0.5, Math.floor(hour * 2) / 2)); // Round to nearest 0.5 hour
  };
  
  // Touch event handlers for mobile drag and drop
  const handleTouchStart = (e, type, id) => {
    const touch = e.touches[0];
    if (!touch) return;
    
    e.preventDefault();
    setTouchDragState({
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      element: e.currentTarget,
      type: type,
      id: id
    });
    
    // Set the dragged item based on type
    if (type === 'task') {
      setDraggedTaskId(id);
    } else if (type === 'meeting') {
      setDraggedMeetingId(id);
    } else if (type === 'schedule') {
      setDraggedScheduleItem(id);
    }
    
    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
    e.currentTarget.style.transform = 'scale(0.95)';
  };
  
  const handleTouchMove = useCallback((e) => {
    const state = touchDragStateRef.current;
    if (!state.isDragging) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    e.preventDefault();
    
    setTouchDragState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));
    
    // Update drag over column for kanban
    if (state.type === 'task') {
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elementBelow) {
        const columnElement = elementBelow.closest('[data-column-id]');
        if (columnElement) {
          const columnId = columnElement.getAttribute('data-column-id');
          setDragOverColumn(columnId);
        }
      }
    }
    
    // Update drag over time slot for calendar
    const container = document.querySelector('.calendar-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        const y = touch.clientY - rect.top;
        const yRelative = y - CALENDAR_TOP_OFFSET;
        if (yRelative >= 0) {
          const hourOffset = yRelative / HOUR_HEIGHT;
          const hour = workdayStart + hourOffset;
          const roundedHour = Math.max(workdayStart, Math.min(workdayEnd - 0.5, Math.floor(hour * 2) / 2));
          setDragOverTimeSlot(roundedHour);
        }
      }
    }
  }, [workdayStart, workdayEnd]);
  
  const handleTouchEnd = useCallback((e) => {
    const state = touchDragStateRef.current;
    if (!state.isDragging) return;
    
    const touch = e.changedTouches[0];
    if (!touch) {
      resetTouchDrag();
      return;
    }
    
    e.preventDefault();
    
    // Restore element appearance
    if (state.element) {
      state.element.style.opacity = '';
      state.element.style.transform = '';
    }
    
    // Handle drop for kanban columns
    if (state.type === 'task') {
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elementBelow) {
        const columnElement = elementBelow.closest('[data-column-id]');
        if (columnElement) {
          const columnId = columnElement.getAttribute('data-column-id');
          if (columnId && state.id) {
            moveTask(state.id, columnId);
            showToast('Task moved!');
          }
        }
      }
    }
    
    // Handle drop for calendar
    const container = document.querySelector('.calendar-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        // Create a synthetic event for the drop handler
        const syntheticEvent = {
          clientY: touch.clientY,
          clientX: touch.clientX,
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        handleCalendarDrop(syntheticEvent);
      }
    }
    
    resetTouchDrag();
  }, [moveTask, showToast]);
  
  const resetTouchDrag = () => {
    setTouchDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      element: null,
      type: null,
      id: null
    });
    resetDragState();
  };
  
  // Add global touch move listener when dragging
  useEffect(() => {
    if (touchDragState.isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      document.addEventListener('touchcancel', resetTouchDrag, { passive: false });
      
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', resetTouchDrag);
      };
    }
  }, [touchDragState.isDragging, handleTouchMove, handleTouchEnd]);

  // Drag task to calendar
  const handleCalendarDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedTaskId || draggedMeetingId || draggedScheduleItem) {
      const container = document.querySelector('.calendar-container');
      if (container) {
        const hour = getHourFromPosition(e, container);
        setDragOverTimeSlot(hour);
      }
    }
  };

  const handleCalendarDragLeave = () => {
    setDragOverTimeSlot(null);
  };

  const handleCalendarDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = document.querySelector('.calendar-container');
    if (!container) {
      resetDragState();
      return;
    }
    
    const hour = getHourFromPosition(e, container);
    
    // Handle dragging scheduled task within calendar
    if (draggedScheduleItem) {
      const scheduleItem = schedule.find(s => s.taskId === draggedScheduleItem);
      if (!scheduleItem) {
        resetDragState();
        return;
      }
      
      const task = tasks.find(t => t.id === scheduleItem.taskId);
      if (!task) {
        resetDragState();
        return;
      }

      const timeStr = hoursToTime(hour);
      const conflict = checkConflict(timeStr, task.duration, scheduleItem.taskId);
      
      if (conflict.conflict) {
        showToast(`Conflict detected! Cannot move here.`, 'error');
        resetDragState();
        return;
      }

      // Update schedule
      setSchedule(schedule.map(s => 
        s.taskId === scheduleItem.taskId 
          ? { ...s, start: timeStr }
          : s
      ));
      resetDragState();
      showToast('Task rescheduled!');
      return;
    }

    // Handle dragging meeting within calendar
    if (draggedMeetingId) {
      const meeting = meetings.find(m => m.id === draggedMeetingId);
      if (!meeting) {
        resetDragState();
        return;
      }

      const timeStr = hoursToTime(hour);
      const conflict = checkMeetingConflict(timeStr, meeting.duration, meeting.id);
      
      if (conflict.conflict) {
        showToast(`Conflict detected! Cannot move here.`, 'error');
        resetDragState();
        return;
      }

      // Update meeting
      setMeetings(meetings.map(m => 
        m.id === meeting.id 
          ? { ...m, start: timeStr }
          : m
      ));
      resetDragState();
      showToast('Meeting rescheduled!');
      return;
    }
    
    // Handle dragging task from Kanban board
    if (draggedTaskId) {
      const task = tasks.find(t => t.id === draggedTaskId);
      if (!task) {
        resetDragState();
        return;
      }

      const timeStr = hoursToTime(hour);
      const conflict = checkConflict(timeStr, task.duration);
      
      if (conflict.conflict) {
        showToast(`Conflict detected! Cannot schedule here.`, 'error');
        resetDragState();
        return;
      }

      // Remove existing schedule for this task if any
      const newSchedule = schedule.filter(s => s.taskId !== draggedTaskId);
      
      // Add new schedule
      newSchedule.push({
        id: generateUniqueId(`schedule-${task.id}-`),
        taskId: task.id,
        taskTitle: task.title,
        start: timeStr,
        duration: task.duration,
        date: formatDateForStorage(selectedDate)
      });

      setSchedule(newSchedule);
      resetDragState();
      showToast('Task scheduled!');
      return;
    }
  };

  const resetDragState = () => {
    setDraggedTaskId(null);
    setDraggedMeetingId(null);
    setDraggedScheduleItem(null);
    setDragOverColumn(null);
    setDragOverTimeSlot(null);
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  // Handle dragging scheduled items within calendar
  const handleScheduleItemDragStart = (e, taskId) => {
    setDraggedScheduleItem(taskId);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleMeetingDragStart = (e, meetingId) => {
    setDraggedMeetingId(meetingId);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  // --- Render ---

  const columns = [
    { id: 'backlog', title: 'Backlog', bg: 'bg-gray-50/50 dark:bg-slate-800/50' },
    { id: 'in-progress', title: 'In Progress', bg: 'bg-blue-50/50 dark:bg-blue-900/20' },
    { id: 'done', title: 'Done', bg: 'bg-green-50/50 dark:bg-green-900/20' },
  ];

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  // Calculate current time position - will be calculated in CalendarPage component
  const currentTop = 0; // Not used anymore, calculated in component

  // Filter meetings and schedule by selected date - memoized for performance
  const selectedDateStr = useMemo(() => formatDateForStorage(selectedDate), [selectedDate, formatDateForStorage]);
  const todayStr = useMemo(() => formatDateForStorage(new Date()), [formatDateForStorage]);
  
  // Helper to check if a meeting should appear on a given date (handles recurring meetings)
  const shouldShowMeetingOnDate = useCallback((meeting, targetDateStr) => {
    // If meeting has repeatDays configuration (recurring meeting), check if target date matches the pattern
    if (meeting.repeatDays) {
      const targetDate = new Date(targetDateStr + 'T00:00:00');
      const dayOfWeek = targetDate.getDay();
      const dayMap = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5
      };
      
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
      return dayName ? meeting.repeatDays[dayName] : false;
    }
    
    // For non-recurring meetings, check if the date matches
    const meetingDate = meeting.date || todayStr;
    return meetingDate === targetDateStr;
  }, [todayStr]);
  
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => shouldShowMeetingOnDate(m, selectedDateStr));
  }, [meetings, selectedDateStr, shouldShowMeetingOnDate]);

  const filteredSchedule = useMemo(() => {
    return schedule.filter(s => (s.date || todayStr) === selectedDateStr);
  }, [schedule, selectedDateStr, todayStr]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message="AI is organizing your schedule..." />}
      
      {/* Toast Container - Only for brief messages */}
      {toasts.length > 0 && (
        <div className="fixed top-20 sm:top-6 right-4 sm:right-6 left-4 sm:left-auto z-[60] pointer-events-none space-y-3 max-w-[calc(100vw-2rem)] sm:max-w-sm">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto scale-in"><Toast {...t} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} /></div>
          ))}
        </div>
      )}

      {/* Top Header Bar */}
      <AppHeader
        activePage={activePage}
        setActivePage={setActivePage}
        isAuthenticated={isAuthenticated}
        user={user}
        signOut={signOut}
        navigate={navigate}
        onOpenSettings={() => setShowSettings(true)}
        onOpenNotifications={() => setShowNotificationCenter(true)}
        unreadNotificationCount={notifications.filter(n => !n.read).length}
      />

        {/* Project Modal */}
        <ProjectModal
          isOpen={showProjectModal}
          onClose={closeProjectModal}
          projects={projects}
          editingProject={editingProject}
          editProjectName={editProjectName}
          editProjectColor={editProjectColor}
          newProjectName={newProjectName}
          newProjectColor={newProjectColor}
          onNameChange={(value) => editingProject ? setEditProjectName(value) : setNewProjectName(value)}
          onColorChange={(color) => editingProject ? setEditProjectColor(color) : setNewProjectColor(color)}
          onSave={editingProject ? saveEditProject : addProject}
          onCancel={closeProjectModal}
          onDelete={handleDeleteProject}
          tasks={tasks}
          onEditProject={(project) => {
            setEditingProject(project.id);
            setEditProjectName(project.name);
            setEditProjectColor(project.color);
            setNewProjectName(project.name);
            setNewProjectColor(project.color);
          }}
        />

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-5 lg:py-6">
        
        {/* Calendar Page */}
        {activePage === 'calendar' && (
          <CalendarPage
            activePage={activePage}
            setActivePage={setActivePage}
            selectedDate={selectedDate}
            navigateDate={navigateDate}
            goToToday={goToToday}
            isToday={isToday}
            formatDate={formatDate}
            projects={projects}
            setNewMeetingProject={setNewMeetingProject}
            setShowMeetingForm={setShowMeetingForm}
            generateSchedule={generateSchedule}
            isLoading={isLoading}
            workdayStart={workdayStart}
            workdayEnd={workdayEnd}
            currentHour={currentHour}
            currentTime={currentTime}
            currentTop={currentTop}
            handleCalendarDragOver={handleCalendarDragOver}
            handleCalendarDrop={handleCalendarDrop}
            handleCalendarDragLeave={handleCalendarDragLeave}
            dragOverTimeSlot={dragOverTimeSlot}
            filteredMeetings={filteredMeetings}
            checkMeetingConflict={checkMeetingConflict}
            draggedMeetingId={draggedMeetingId}
            getProject={getProject}
            colorToHex={colorToHex}
            handleMeetingDragStart={handleMeetingDragStart}
            handleDragEnd={handleDragEnd}
            handleTouchStart={handleTouchStart}
            startEditMeeting={startEditMeeting}
            setMeetings={setMeetings}
            meetings={meetings}
            filteredSchedule={filteredSchedule}
            tasks={tasks}
            checkConflict={checkConflict}
            draggedScheduleItem={draggedScheduleItem}
            handleScheduleItemDragStart={handleScheduleItemDragStart}
            setSchedule={setSchedule}
            schedule={schedule}
            selectedDateStr={selectedDateStr}
            todayStr={todayStr}
            getPriorityColor={getPriorityColor}
            openBreakTimePicker={openBreakTimePicker}
            showBreakTimePicker={showBreakTimePicker}
            setShowBreakTimePicker={setShowBreakTimePicker}
            selectedBreakType={selectedBreakType}
            breakStartTime={breakStartTime}
            setBreakStartTime={setBreakStartTime}
            breakDuration={breakDuration}
            setBreakDuration={setBreakDuration}
            addQuickBreak={addQuickBreak}
          />
        )}

        {/* Tasks Page */}
        {activePage === 'tasks' && (
          <TasksPage
            activePage={activePage}
            setActivePage={setActivePage}
            tasks={tasks}
            projects={projects}
            filteredTasks={filteredTasks}
            columns={columns}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterProject={filterProject}
            setFilterProject={setFilterProject}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            openProjectModal={openProjectModal}
            setNewTaskProject={setNewTaskProject}
            setShowTaskForm={setShowTaskForm}
            editingTask={editingTask}
            editTaskTitle={editTaskTitle}
            setEditTaskTitle={setEditTaskTitle}
            editTaskDuration={editTaskDuration}
            setEditTaskDuration={setEditTaskDuration}
            editTaskPriority={editTaskPriority}
            setEditTaskPriority={setEditTaskPriority}
            editTaskProject={editTaskProject}
            setEditTaskProject={setEditTaskProject}
            editTaskDueDate={editTaskDueDate}
            setEditTaskDueDate={setEditTaskDueDate}
            editTaskSticker={editTaskSticker}
            setEditTaskSticker={setEditTaskSticker}
            showEditStickerPicker={showEditStickerPicker}
            setShowEditStickerPicker={setShowEditStickerPicker}
            popularEmojis={popularEmojis}
            saveEditTask={saveEditTask}
            cancelEditTask={cancelEditTask}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleDragEnd={handleDragEnd}
            handleTouchStart={handleTouchStart}
            draggedTaskId={draggedTaskId}
            dragOverColumn={dragOverColumn}
            getProject={getProject}
            getPriorityColor={getPriorityColor}
            openTaskDetails={openTaskDetails}
            startEditTask={startEditTask}
            deleteTask={deleteTask}
          />
        )}
      </div>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={saveTaskDetails}
          taskTitle={taskTitle}
          setTaskTitle={setTaskTitle}
          taskDueDate={taskDueDate}
          setTaskDueDate={setTaskDueDate}
          taskNotes={taskNotes}
          setTaskNotes={setTaskNotes}
          getProject={getProject}
          getPriorityColor={getPriorityColor}
        />
      )}

      {/* Modal: Add Task */}
      {showTaskForm && (
        <TaskFormModal
          show={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          onSubmit={addTask}
          projects={projects}
          popularEmojis={popularEmojis}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          newTaskDuration={newTaskDuration}
          setNewTaskDuration={setNewTaskDuration}
          newTaskPriority={newTaskPriority}
          setNewTaskPriority={setNewTaskPriority}
          newTaskProject={newTaskProject}
          setNewTaskProject={setNewTaskProject}
          newTaskNotes={newTaskNotes}
          setNewTaskNotes={setNewTaskNotes}
          newTaskDueDate={newTaskDueDate}
          setNewTaskDueDate={setNewTaskDueDate}
          newTaskSticker={newTaskSticker}
          setNewTaskSticker={setNewTaskSticker}
          showStickerPicker={showStickerPicker}
          setShowStickerPicker={setShowStickerPicker}
          taskFormErrors={taskFormErrors}
          setTaskFormErrors={setTaskFormErrors}
        />
      )}

      {/* Modal: Add/Edit Meeting */}
      {showMeetingForm && (
        <MeetingFormModal
          show={showMeetingForm}
          onClose={() => {
            setShowMeetingForm(false);
            setEditingMeeting(null);
          }}
          onSubmit={editingMeeting ? saveEditMeeting : addMeeting}
          projects={projects}
          editingMeeting={editingMeeting}
          editingMeetingData={editingMeeting ? meetings.find(m => m.id === editingMeeting) : null}
          newMeetingTitle={newMeetingTitle}
          setNewMeetingTitle={setNewMeetingTitle}
          newMeetingStart={newMeetingStart}
          setNewMeetingStart={setNewMeetingStart}
          newMeetingEnd={newMeetingEnd}
          setNewMeetingEnd={setNewMeetingEnd}
          newMeetingProject={newMeetingProject}
          setNewMeetingProject={setNewMeetingProject}
          newMeetingRepeat={newMeetingRepeat}
          setNewMeetingRepeat={setNewMeetingRepeat}
          newMeetingRepeatDays={newMeetingRepeatDays}
          setNewMeetingRepeatDays={setNewMeetingRepeatDays}
          editMeetingTitle={editMeetingTitle}
          setEditMeetingTitle={setEditMeetingTitle}
          editMeetingStart={editMeetingStart}
          setEditMeetingStart={setEditMeetingStart}
          editMeetingEnd={editMeetingEnd}
          setEditMeetingEnd={setEditMeetingEnd}
          editMeetingProject={editMeetingProject}
          setEditMeetingProject={setEditMeetingProject}
        />
      )}


      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        workdayStart={workdayStart}
        workdayEnd={workdayEnd}
        onSave={handleSaveWorkingHours}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onDismiss={dismissNotification}
        onClearAll={clearAllNotifications}
      />

    </div>
  );
};

export default AIKanbanScheduler;
