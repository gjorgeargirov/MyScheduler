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
  Bot,
  Send,
  RotateCcw,
  Sparkles,
  RefreshCw
} from 'lucide-react';

// Import extracted components and utilities
import { useLocalStorage } from './hooks/useLocalStorage';
import { Toast } from './components/Common/Toast';
import { LoadingOverlay } from './components/Common/LoadingSpinner';
import { ExportImport } from './components/Common/ExportImport';
import { ProjectModal } from './components/Forms/ProjectModal';
import { CalendarIntegration } from './components/Calendar/CalendarIntegration';
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

// Module-level counter for unique ID generation
let globalIdCounter = 0;

const AIKanbanScheduler = () => {
  console.log('AIKanbanScheduler component rendering...');
  
  // --- State with localStorage persistence ---
  const [projects, setProjects] = useLocalStorage('focusboard_projects', [
    { id: 1, name: 'Website Redesign', color: 'bg-blue-500' },
    { id: 2, name: 'Mobile App', color: 'bg-indigo-500' },
    { id: 3, name: 'Marketing', color: 'bg-purple-500' },
    { id: 4, name: 'Internal Tools', color: 'bg-orange-500' },
  ]);

  const [tasks, setTasks] = useLocalStorage('focusboard_tasks', [
    { id: 1, title: 'Design landing page', status: 'backlog', duration: 2, priority: 'high', projectId: 1, notes: '', dueDate: null },
    { id: 2, title: 'Review code PR', status: 'in-progress', duration: 1, priority: 'medium', projectId: 2, notes: '', dueDate: null },
    { id: 3, title: 'Write documentation', status: 'in-progress', duration: 1.5, priority: 'low', projectId: 1, notes: '', dueDate: null },
    { id: 4, title: 'Team standup', status: 'done', duration: 0.5, priority: 'high', projectId: 3, notes: '', dueDate: null },
  ]);

  const [meetings, setMeetings] = useLocalStorage('focusboard_meetings', [
    { id: 1, title: 'Team Standup', start: '09:00', duration: 0.5, projectId: 3 },
    { id: 2, title: 'Client Call', start: '14:00', duration: 1, projectId: 1 },
  ]);

  const [schedule, setSchedule] = useLocalStorage('focusboard_schedule', []);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [toasts, setToasts] = useState([]);
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
  const [showCalendarIntegration, setShowCalendarIntegration] = useState(false);
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

  // Dark mode - using regular useState with manual localStorage sync
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = window.localStorage.getItem('focusboard_darkMode');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  // Sync dark mode to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('focusboard_darkMode', JSON.stringify(darkMode));
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  }, [darkMode]);

  // Task details modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // LLM Chat Bot
  const [showChatBot, setShowChatBot] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const stored = window.localStorage.getItem('focusboard_chatMessages');
      return stored ? JSON.parse(stored) : [
        { role: 'assistant', content: 'Hi! I\'m your AI calendar assistant. Tell me about your scheduling preferences and I\'ll help organize your day better. For example, you can say "I prefer to do deep work in the morning" or "Schedule meetings after 2 PM".' }
      ];
    } catch {
      return [
        { role: 'assistant', content: 'Hi! I\'m your AI calendar assistant. Tell me about your scheduling preferences and I\'ll help organize your day better. For example, you can say "I prefer to do deep work in the morning" or "Schedule meetings after 2 PM".' }
      ];
    }
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState(() => {
    try {
      const stored = window.localStorage.getItem('focusboard_preferences');
      return stored ? JSON.parse(stored) : '';
    } catch {
      return '';
    }
  });

  // Save chat messages to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('focusboard_chatMessages', JSON.stringify(chatMessages));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }, [chatMessages]);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('focusboard_preferences', JSON.stringify(userPreferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [userPreferences]);

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [draggedMeetingId, setDraggedMeetingId] = useState(null);
  const [draggedScheduleItem, setDraggedScheduleItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState(null);

  // Time & Config
  const [currentTime, setCurrentTime] = useState(new Date());
  const workdayStart = 8;
  const workdayEnd = 18;
  
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
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
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

  // Apply dark mode - runs on mount and when darkMode changes
  useEffect(() => {
    const html = document.documentElement;
    
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Also set on body as fallback
    const body = document.body;
    if (darkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
    
    console.log(`Dark mode: ${darkMode}, HTML classes: ${html.className}, Body classes: ${body.className}`);
  }, [darkMode]);

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
        const targetDateObj = new Date(targetDateStr + 'T00:00:00');
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
      };
      setTasks([...tasks, newTask]);
    }
    
    // Reset form
    setNewTaskTitle('');
    setNewTaskDuration('1');
    setNewTaskPriority('medium');
    setNewTaskNotes('');
    setNewTaskDueDate('');
    setTaskFormErrors({});
    setShowTaskForm(false);
    showToast('Task added to Backlog');
  };

  const startEditTask = (task) => {
    setEditingTask(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDuration(task.duration);
    setEditTaskPriority(task.priority);
    setEditTaskProject(task.projectId);
    setEditTaskDueDate(task.dueDate || '');
    setEditTaskNotes(task.notes || '');
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

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);
    setIsLoading(true);

    // Add user message
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);

    try {
      // Get current scheduled tasks for the selected date (NOT meetings - meetings cannot be moved)
      const selectedDateStr = formatDateForStorage(selectedDate);
      const currentScheduledTasks = schedule
        .filter(s => (s.date || formatDateForStorage(new Date())) === selectedDateStr)
        .map(s => {
          const task = tasks.find(t => t.id === s.taskId);
          return {
            scheduleId: s.id,
            taskId: s.taskId,
            title: task?.title || s.taskTitle || 'Unknown Task',
            start: s.start,
            duration: s.duration,
            project: task ? getProject(task.projectId).name : 'Unknown'
          };
        });

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
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful calendar scheduling assistant. You can help with preferences AND actually move SCHEDULED TASKS (NOT meetings - meetings cannot be moved).

IMPORTANT: 
- TASKS are work items that can be moved/rescheduled
- MEETINGS are fixed events that CANNOT be moved - ignore any requests to move meetings

Current workday: ${workdayStart}:00 to ${workdayEnd}:00
Current preferences: ${userPreferences || 'None set yet'}

CURRENT SCHEDULED TASKS FOR TODAY (these can be moved):
${currentScheduledTasks.length > 0 ? currentScheduledTasks.map(t => `  - "${t.title}" at ${t.start} (${t.duration}h), Project: ${t.project}, Task ID: ${t.taskId}, Schedule ID: ${t.scheduleId}`).join('\n') : 'No tasks scheduled.'}

CRITICAL: If the user asks to move or reschedule TASK(S) (not meetings), you MUST include a JSON array in your response. Use this EXACT format:

For a SINGLE task:
\`\`\`json
[{"action": "move_task", "taskId": TASK_ID, "newStart": "HH:MM"}]
\`\`\`

For MULTIPLE tasks (e.g., "move all tasks after 12:00"):
\`\`\`json
[
  {"action": "move_task", "taskId": TASK_ID_1, "newStart": "HH:MM"},
  {"action": "move_task", "taskId": TASK_ID_2, "newStart": "HH:MM"},
  {"action": "move_task", "taskId": TASK_ID_3, "newStart": "HH:MM"}
]
\`\`\`

Rules:
- ALWAYS return an ARRAY, even for a single task
- taskId must be the exact Task ID from the CURRENT SCHEDULED TASKS list above (NOT schedule ID)
- newStart must be in 24-hour format (HH:MM) like "14:30" or "17:00"
- If user says "move all tasks after X:XX", find ALL tasks currently scheduled after that time and move them
- If user says "end of day", calculate: workday ends at ${workdayEnd}:00, so use ${workdayEnd - 1}:00 or earlier depending on task duration
- If user says "move all tasks after 12:00", find all tasks with start time >= 12:00 and move them to a new time
- Space out multiple tasks - don't schedule them all at the same time (e.g., if moving 3 tasks, space them: 12:00, 13:00, 14:00)
- If no specific task mentioned and user says "all" or "every", move ALL scheduled tasks
- If user asks to move a "meeting", clarify that meetings cannot be moved, only tasks
- Always include the JSON array in a code block at the END of your response

Example for moving all tasks after 12:00:
"I'll move all your tasks scheduled after 12:00 to start after 12:00.

\`\`\`json
[
  {"action": "move_task", "taskId": 123, "newStart": "12:00"},
  {"action": "move_task", "taskId": 456, "newStart": "13:00"},
  {"action": "move_task", "taskId": 789, "newStart": "14:00"}
]
\`\`\`"

Be conversational but ALWAYS include the JSON array when moving tasks. NEVER try to move meetings.`
            },
            ...newMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      let aiResponse = data.choices[0]?.message?.content?.trim() || 'Sorry, I couldn\'t process that.';
      
      console.log('AI Response:', aiResponse);
      console.log('Current scheduled tasks:', currentScheduledTasks);

      // Check if AI wants to move TASK(S) (look for JSON array in response)
      let taskMoved = false;
      let movedTasks = [];
      
      // Try multiple patterns to find JSON array
      let actionArray = null;
      
      // Pattern 1: JSON array in markdown code block
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        try {
          const jsonString = codeBlockMatch[1].trim();
          if (jsonString && jsonString.startsWith('[') && jsonString.endsWith(']')) {
            actionArray = JSON.parse(jsonString);
          }
        } catch (e) {
          // Try single object format (backward compatibility)
          try {
            const singleObjMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (singleObjMatch && singleObjMatch[1]) {
              const objString = singleObjMatch[1].trim();
              if (objString && objString.startsWith('{') && objString.endsWith('}')) {
                const singleAction = JSON.parse(objString);
                if (singleAction.action === 'move_task') {
                  actionArray = [singleAction];
                }
              }
            }
          } catch (e2) {
            if (codeBlockMatch[1] && codeBlockMatch[1].trim().length > 0) {
              console.warn('Could not parse JSON from AI response (this is normal if AI is just chatting):', e.message);
            }
          }
        }
      }
      
      // Pattern 2: JSON array anywhere in text
      if (!actionArray) {
        const arrayMatch = aiResponse.match(/\[[\s\S]*?"action"[\s\S]*?"move_task"[\s\S]*?\]/);
        if (arrayMatch) {
          try {
            actionArray = JSON.parse(arrayMatch[0]);
          } catch (e) {
            // Try single object format
            const jsonMatch = aiResponse.match(/\{[^{}]*"action"[^{}]*"move_task"[^{}]*\}/);
            if (jsonMatch) {
              try {
                const singleAction = JSON.parse(jsonMatch[0]);
                if (singleAction.action === 'move_task') {
                  actionArray = [singleAction];
                }
              } catch (e2) {
                console.error('Error parsing JSON:', e2);
              }
            }
          }
        }
      }
      
      // Pattern 3: Detect "move all tasks after X:XX" pattern
      if (!actionArray && (userMessage.toLowerCase().includes('move') || userMessage.toLowerCase().includes('reschedule'))) {
        const wantsAllTasks = userMessage.toLowerCase().includes('all') || userMessage.toLowerCase().includes('every');
        const timeThresholdMatch = userMessage.match(/(\d{1,2}):?(\d{2})?/);
        
        if (wantsAllTasks && timeThresholdMatch) {
          // User wants to move all tasks after a certain time
          const thresholdTime = timeThresholdMatch[0].includes(':') ? timeThresholdMatch[0] : `${timeThresholdMatch[1]}:00`;
          const thresholdHours = timeToHours(thresholdTime);
          const tasksToMove = currentScheduledTasks.filter(t => {
            const taskStart = timeToHours(t.start);
            return taskStart >= thresholdHours;
          });
          
          if (tasksToMove.length > 0) {
            // Extract target time from response or use threshold
            const timeMatch = aiResponse.match(/(\d{1,2}):(\d{2})/);
            const targetTime = timeMatch ? timeMatch[0] : thresholdTime;
            const targetHours = timeToHours(targetTime);
            
            // Create actions for all tasks, spacing them out
            actionArray = [];
            let currentStart = targetHours;
            for (const task of tasksToMove) {
              if (currentStart + task.duration <= workdayEnd) {
                actionArray.push({
                  action: 'move_task',
                  taskId: task.taskId,
                  newStart: hoursToTime(currentStart)
                });
                currentStart += Math.max(task.duration, 0.5); // Space tasks out
              }
            }
          }
        } else {
          // Single task fallback
          const timeMatch = aiResponse.match(/(\d{1,2}):(\d{2})/);
          const endOfDayMatch = aiResponse.toLowerCase().match(/end of (?:the )?day|end of day|last|latest/);
          
          if (timeMatch || endOfDayMatch) {
            const taskToMove = currentScheduledTasks[0];
            if (taskToMove) {
              let newStartTime = null;
              
              if (timeMatch) {
                newStartTime = timeMatch[0];
              } else if (endOfDayMatch) {
                const endHour = workdayEnd - taskToMove.duration;
                newStartTime = hoursToTime(Math.max(workdayStart, endHour));
              }
              
              if (newStartTime) {
                actionArray = [{
                  action: 'move_task',
                  taskId: taskToMove.taskId,
                  newStart: newStartTime
                }];
              }
            }
          }
        }
      }
      
      // Process all move actions
      if (actionArray && Array.isArray(actionArray) && actionArray.length > 0) {
        console.log('Found action array:', actionArray);
        const selectedDateStr = formatDateForStorage(selectedDate);
        const updatedSchedule = [...schedule];
        let successCount = 0;
        let conflictCount = 0;
        
        for (const action of actionArray) {
          if (action.action === 'move_task' && action.taskId && action.newStart) {
            try {
              const taskId = typeof action.taskId === 'string' ? parseInt(action.taskId) : action.taskId;
              
              // Find the scheduled task for the selected date
              const scheduleItem = updatedSchedule.find(s => {
                const itemDate = s.date || formatDateForStorage(new Date());
                return itemDate === selectedDateStr && (s.taskId === taskId || String(s.taskId) === String(taskId));
              });
              
              if (scheduleItem) {
                const task = tasks.find(t => t.id === taskId);
                const conflict = checkConflict(action.newStart, scheduleItem.duration, taskId, selectedDateStr);
                if (!conflict.conflict) {
                  const itemIndex = updatedSchedule.indexOf(scheduleItem);
                  updatedSchedule[itemIndex] = { ...scheduleItem, start: action.newStart };
                  successCount++;
                  movedTasks.push({ title: task?.title || 'Task', newStart: action.newStart });
                } else {
                  conflictCount++;
                }
              }
            } catch (e) {
              console.error('Error moving task:', e, 'Action:', action);
            }
          }
        }
        
        if (successCount > 0) {
          setSchedule(updatedSchedule);
          taskMoved = true;
          
          // Update response message
          aiResponse = aiResponse.replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/g, '').replace(/\[[\s\S]*?"action"[\s\S]*?"move_task"[\s\S]*?\]/g, '').trim();
          aiResponse = aiResponse.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '').replace(/\{[\s\S]*"action"[\s\S]*"move_task"[\s\S]*\}/g, '').trim();
          
          if (successCount === 1) {
            showToast(`Task "${movedTasks[0].title}" moved to ${movedTasks[0].newStart}`);
            if (!aiResponse.includes('✅')) {
              aiResponse += `\n\n✅ Done! I've moved "${movedTasks[0].title}" to ${movedTasks[0].newStart}.`;
            }
          } else {
            const taskList = movedTasks.map(t => `"${t.title}" to ${t.newStart}`).join(', ');
            showToast(`Moved ${successCount} task(s)!`);
            if (!aiResponse.includes('✅')) {
              aiResponse += `\n\n✅ Done! I've moved ${successCount} task(s): ${taskList}.`;
            }
          }
          
          if (conflictCount > 0) {
            aiResponse += `\n\n⚠️ ${conflictCount} task(s) could not be moved due to conflicts.`;
          }
        } else if (conflictCount > 0) {
          aiResponse = aiResponse.replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/g, '').replace(/\[[\s\S]*?"action"[\s\S]*?"move_task"[\s\S]*?\]/g, '').trim();
          aiResponse += `\n\n❌ Sorry, I couldn't move the task(s) because of conflicts.`;
        }
      }

      // Add AI response
      setChatMessages([...newMessages, { role: 'assistant', content: aiResponse }]);

      // Extract and save preferences if mentioned
      const preferenceKeywords = ['prefer', 'like', 'want', 'schedule', 'morning', 'afternoon', 'evening', 'deep work', 'focus', 'meeting'];
      const hasPreference = preferenceKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
      
      if (hasPreference && !taskMoved) {
        setUserPreferences(prev => prev ? `${prev}\n${userMessage}` : userMessage);
        // Offer to schedule tasks with new preferences
        setTimeout(() => {
          const hasUnscheduledTasks = tasks.some(t => t.status === 'in-progress' && !schedule.find(s => s.taskId === t.id && (s.date || formatDateForStorage(new Date())) === selectedDateStr));
          if (hasUnscheduledTasks) {
            setChatMessages(prev => [...prev, { 
              role: 'assistant', 
              content: 'Perfect! I\'ve saved your preferences. When you click "Auto Schedule", I\'ll use these preferences to organize your tasks. Try it now!' 
            }]);
          }
        }, 500);
      }

    } catch (error) {
      console.error('Chat error:', error);
      // Only add error message if chat bot is still open
      if (showChatBot) {
        setChatMessages([...newMessages, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }]);
      }
      showToast(error.message || 'Failed to send message', 'error');
    } finally {
      setChatLoading(false);
      setIsLoading(false);
    }
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
            notes: editTaskNotes || ''
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
    setEditMeetingProject(meeting.projectId || 1);
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
            projectId: editMeetingProject
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
      
      // Prepare tasks to schedule
      const tasksToSchedule = toSchedule.map(t => {
        const project = getProject(t.projectId);
        return {
          id: t.id,
          title: t.title,
          duration: t.duration,
          priority: t.priority,
          project: project.name,
          dueDate: t.dueDate,
          notes: t.notes
        };
      });
      
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

${userPreferences ? `USER PREFERENCES:
${userPreferences}

IMPORTANT: Follow these preferences when scheduling tasks. For example:
- If user prefers "deep work in the morning", schedule important/focused tasks in morning slots
- If user prefers "meetings after 2 PM", avoid scheduling tasks that might conflict with that preference
- If user mentions specific times, prioritize those times for appropriate tasks
- Consider the user's stated preferences as high priority constraints

` : ''}CURRENT SCHEDULE (OCCUPIED TIME):
${mergedOccupied.length > 0 ? mergedOccupied.map(s => `  - ${hoursToTime(s.start)} to ${hoursToTime(s.end)}: ${s.title} (${s.type})`).join('\n') : 'No occupied time slots.'}

AVAILABLE FREE TIME SLOTS:
${freeSlots.length > 0 ? freeSlots.map((slot, i) => `  ${i + 1}. ${hoursToTime(slot.start)} to ${hoursToTime(slot.end)} (${(slot.end - slot.start).toFixed(1)} hours available)`).join('\n') : 'NO FREE TIME AVAILABLE'}

TASKS TO SCHEDULE (SORTED BY PRIORITY - HIGH PRIORITY FIRST):
${sortedTasks.map((t, i) => {
  const priorityEmoji = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
  return `${i + 1}. ${priorityEmoji} Task ID ${t.id}: "${t.title}" - ${t.duration}h, PRIORITY: ${t.priority.toUpperCase()}, Project: ${t.project}${t.dueDate ? `, Due: ${t.dueDate}` : ''}${t.notes ? `, Notes: ${t.notes}` : ''}`;
}).join('\n')}

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
   ${userPreferences ? '- Apply user preferences when choosing specific time slots (e.g., morning for deep work)' : ''}

4. **TECHNICAL REQUIREMENTS**:
   - Use ONLY the available free time slots listed above
   - Each task must fit completely within a free time slot
   - Do NOT schedule tasks in occupied time slots
   - **CRITICAL: NEVER schedule multiple tasks at the same start time** - each task must have a unique start time
   - If scheduling multiple tasks, ensure their time slots do NOT overlap (e.g., Task 1: 09:00-10:00, Task 2: 10:00-11:00, NOT both at 09:00)
   - Use 24-hour format (HH:MM) for start times
   - ${userPreferences ? 'STRICTLY FOLLOW user preferences when they don\'t conflict with priority rules' : ''}

Return ONLY a JSON array with this exact format:
[
  {"taskId": 123, "start": "09:00"},
  {"taskId": 456, "start": "11:00"}
]

CRITICAL RULES:
- DO NOT include "duration" in your response - it will be taken from the original task
- ONLY provide "taskId" and "start" time
- The duration is already specified in the task list above - DO NOT change it
- You are ONLY choosing WHEN to schedule each task, NOT how long it takes
- **NEVER schedule multiple tasks at the same start time** - each task must have a unique start time
- Ensure tasks do NOT overlap - if Task A is 09:00-10:00 (duration 1h), Task B must start at 10:00 or later, NOT at 09:00
- Calculate end times: Task duration is shown in the task list (e.g., "2h" means task ends 2 hours after start)

IMPORTANT: The tasks are already sorted by priority in the list above. Schedule them in that order - HIGH priority tasks FIRST. Use the exact taskId numbers from the "TASKS TO SCHEDULE" list above. Only include tasks that can fit in the available free slots. If a task cannot be scheduled, omit it from the response, but NEVER omit a HIGH priority task if there's any way to fit it.`;

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
      const usedTimeSlots = new Map(); // Track used time slots to prevent duplicates

      for (const suggestion of scheduleData) {
        const task = toSchedule.find(t => t.id === suggestion.taskId);
        if (!task) continue;
        
        // ALWAYS use the original task duration - AI should NOT change durations
        const taskDuration = task.duration;
        
        // Validate the time slot using original task duration
        const startHours = timeToHours(suggestion.start);
        const endHours = startHours + taskDuration;
        
        if (startHours < workdayStart || endHours > workdayEnd) {
          continue; // Skip if outside workday
        }
        
        // Check if this time slot is already used by another task in this batch
        const timeSlotKey = `${suggestion.start}-${endHours.toFixed(2)}`;
        if (usedTimeSlots.has(timeSlotKey)) {
          const conflictingTask = usedTimeSlots.get(timeSlotKey);
          showToast(`Skipped "${task.title}": Time slot conflict with "${conflictingTask}"`, 'info');
          continue;
        }
        
        // Check for conflicts with existing schedule/meetings using original task duration
        const conflict = checkConflict(suggestion.start, taskDuration, task.id);
        if (conflict.conflict) {
          showToast(`Skipped "${task.title}": Conflict detected`, 'info');
          continue;
        }
        
        // Check if this task is already scheduled in this batch
        if (scheduledTaskIds.has(task.id)) {
          continue;
        }
        
        // Generate truly unique ID - include task ID, start time, and a unique counter
        const uniqueId = generateUniqueId(`schedule-${task.id}-${suggestion.start}-`);
        
        newScheduleItems.push({
          id: uniqueId,
          taskId: task.id,
          taskTitle: task.title,
          start: suggestion.start,
          duration: taskDuration, // Always use original task duration
          date: formatDateForStorage(selectedDate)
        });
        
        scheduledTaskIds.add(task.id);
        usedTimeSlots.set(timeSlotKey, task.title); // Track this time slot
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
      
      // Report unscheduled tasks
      const unscheduled = toSchedule.filter(t => !scheduledTaskIds.has(t.id));
      if (unscheduled.length > 0) {
        unscheduled.forEach(task => {
          showToast(`Could not schedule "${task.title}"`, 'error');
        });
      }
      
    } catch (error) {
      console.error('AI Scheduling error:', error);
      showToast(`AI scheduling failed: ${error.message}. Using fallback algorithm...`, 'error');
      
      // Fallback to original algorithm
      setTimeout(() => {
      // Sort by priority (high first) and duration (shorter first for flexibility)
      const sortedTasks = [...toSchedule].sort((a, b) => {
        const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return a.duration - b.duration;
      });

      const newScheduleItems = [];
      let scheduleCounter = 0; // Counter to ensure unique IDs even when created in same millisecond

      for (const task of sortedTasks) {
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
          if (workdayEnd - workdayStart >= task.duration) {
            newScheduleItems.push({
              id: generateUniqueId(`schedule-${task.id}-`),
              taskId: task.id,
              taskTitle: task.title,
              start: hoursToTime(workdayStart),
              duration: task.duration,
              date: formatDateForStorage(selectedDate)
            });
            scheduled = true;
          }
        } else {
          // Check gap before first slot
          const firstGapStart = workdayStart;
          const firstGapEnd = mergedSlots[0].start;
          const firstGapDuration = firstGapEnd - firstGapStart;
          
          if (firstGapDuration >= task.duration && firstGapStart < firstGapEnd) {
            newScheduleItems.push({
              id: generateUniqueId(`schedule-${task.id}-`),
              taskId: task.id,
              taskTitle: task.title,
              start: hoursToTime(firstGapStart),
              duration: task.duration,
              date: formatDateForStorage(selectedDate)
            });
            scheduled = true;
          }
          
          // Check gaps between merged slots
          if (!scheduled) {
            for (let i = 1; i < mergedSlots.length && !scheduled; i++) {
              const gapStart = mergedSlots[i - 1].end;
              const gapEnd = mergedSlots[i].start;
              const gapDuration = gapEnd - gapStart;
              
              // Check if gap is valid and large enough
              if (gapStart < gapEnd && gapDuration >= task.duration && gapStart >= workdayStart && gapEnd <= workdayEnd) {
                newScheduleItems.push({
                  id: generateUniqueId(`schedule-${task.id}-`),
                  taskId: task.id,
                  taskTitle: task.title,
                  start: hoursToTime(gapStart),
                  duration: task.duration,
                  date: formatDateForStorage(selectedDate)
                });
                scheduled = true;
                break;
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
            if (gapStart < gapEnd && gapDuration >= task.duration && gapStart >= workdayStart && gapStart < workdayEnd) {
              newScheduleItems.push({
                id: generateUniqueId(`schedule-${task.id}-`),
                taskId: task.id,
                taskTitle: task.title,
                start: hoursToTime(gapStart),
                duration: task.duration,
                date: formatDateForStorage(selectedDate)
              });
              scheduled = true;
            }
          }
        }

        if (!scheduled) {
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

  // Calculate hour from mouse position
  const getHourFromPosition = (e, container) => {
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hourOffset = y / 80; // Each hour is 80px
    const hour = workdayStart + hourOffset;
    return Math.max(workdayStart, Math.min(workdayEnd - 0.5, Math.floor(hour * 2) / 2)); // Round to nearest 0.5 hour
  };

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
  const currentTop = 16 + (currentHour - workdayStart) * 80; // 16px for top padding

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

  console.log('AIKanbanScheduler about to render JSX');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-slate-200 dark:selection:bg-slate-700">
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message="AI is organizing your schedule..." />}
      
      {/* Toast Container */}
      <div className="fixed top-16 sm:top-4 right-2 sm:right-4 left-2 sm:left-auto z-[60] pointer-events-none space-y-2 max-w-[calc(100vw-1rem)] sm:max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto"><Toast {...t} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} /></div>
        ))}
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center">
                  <Sparkles size={16} className="sm:w-[18px] sm:h-[18px] text-white dark:text-slate-900" />
                </div>
          <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                    FocusBoard
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">Daily planner & project tracker</p>
          </div>
          </div>
              
              {/* Navigation Tabs */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 sm:p-1 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setActivePage('calendar')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all ${
                    activePage === 'calendar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <CalendarIcon size={14} className="sm:w-[15px] sm:h-[15px]" />
                    <span className="hidden xs:inline sm:inline">Calendar</span>
                  </div>
            </button>
                <button
                  onClick={() => setActivePage('tasks')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all ${
                    activePage === 'tasks'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Folder size={14} className="sm:w-[15px] sm:h-[15px]" />
                    <span className="hidden xs:inline sm:inline">Tasks</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => {
                  const newValue = !darkMode;
                  console.log('Dark mode toggle: changing from', darkMode, 'to', newValue);
                  setDarkMode(newValue);
                }}
                className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
                title={darkMode ? 'Light mode' : 'Dark mode'}
                type="button"
              >
                {darkMode ? <Sun size={18} className="sm:w-4 sm:h-4" /> : <Moon size={18} className="sm:w-4 sm:h-4" />}
              </button>
              {activePage === 'calendar' && (
                <>
                  <button
                    onClick={() => setShowCalendarIntegration(true)}
                    className="flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors min-w-[44px] sm:min-w-0"
                    title="Import from Outlook/Google Calendar"
                  >
                    <CalendarIcon size={16} className="sm:w-[15px] sm:h-[15px]" />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                  <button 
                    onClick={() => {
                      setNewMeetingProject(projects.length > 0 ? projects[0].id : 1);
                      setShowMeetingForm(true);
                    }} 
                    className="flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 rounded-md bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium transition-colors min-w-[44px] sm:min-w-0"
                  >
                    <Plus size={16} className="sm:w-[15px] sm:h-[15px]" />
                    <span className="hidden sm:inline">Meeting</span>
                  </button>
                </>
              )}
            </div>
          </div>
          </div>
        </header>

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

        <CalendarIntegration
          isOpen={showCalendarIntegration}
          onClose={() => setShowCalendarIntegration(false)}
          onImportMeetings={importMeetingsFromCalendar}
          showToast={showToast}
        />

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Calendar Page */}
        {activePage === 'calendar' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                <CalendarIcon className="text-slate-700 dark:text-slate-300 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    {isToday(selectedDate) ? "Today's Schedule" : "Schedule"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(selectedDate)}</p>
                </div>
                {/* Date Navigation */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                <button 
                    onClick={() => navigateDate(-1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                    title="Previous day"
                  >
                    <ChevronLeft size={18} className="sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <button
                    onClick={goToToday}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                      isToday(selectedDate)
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateDate(1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                    title="Next day"
                  >
                    <ChevronRight size={18} className="sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <ExportImport
                projects={projects}
                tasks={tasks}
                meetings={meetings}
                schedule={schedule}
                chatMessages={chatMessages}
                userPreferences={userPreferences}
                onImport={(data) => {
                  if (window.confirm('Import will replace all current data. Continue?')) {
                    setProjects(data.projects || []);
                    setTasks(data.tasks || []);
                    setMeetings(data.meetings || []);
                    setSchedule(data.schedule || []);
                    setChatMessages(data.chatMessages || []);
                    setUserPreferences(data.userPreferences || '');
                  }
                }}
                showToast={showToast}
              />
              <button 
                onClick={() => setShowChatBot(true)}
                className="flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors text-sm font-medium min-w-[44px] sm:min-w-0 min-h-[44px] sm:min-h-0"
                title="Chat with AI about calendar preferences"
              >
                <Bot size={16} className="sm:w-[15px] sm:h-[15px]" />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>
              <button 
                onClick={generateSchedule}
                disabled={isLoading}
                className="flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] sm:min-w-0 min-h-[44px] sm:min-h-0"
                title="AI Generate Schedule"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="sm:w-[15px] sm:h-[15px]" />
                    <span className="hidden sm:inline">Auto Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)] min-h-[400px] sm:min-h-[500px] overflow-y-auto relative bg-white dark:bg-slate-800 calendar-container pt-4">
            {/* Time Indicators */}
            <div className="absolute top-4 left-0 bottom-0 w-12 sm:w-16 border-r border-slate-100 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm z-10">
              {Array.from({ length: workdayEnd - workdayStart }).map((_, i) => {
                const hour = workdayStart + i;
                const isLastHour = hour === workdayEnd - 1;
                return (
                  <div key={i} className={`h-[80px] border-b relative group ${isLastHour ? 'border-slate-300 dark:border-slate-600' : 'border-transparent'}`}>
                    <span className="absolute top-0 right-1 sm:right-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">
                      {hour}:00
                    </span>
                    <div className="absolute right-0 top-0 w-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                    {isLastHour && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-500 to-transparent"></div>
                    )}
                  </div>
                );
              })}
              {/* Workday End Indicator */}
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-slate-400 dark:border-slate-500 bg-slate-50/50 dark:bg-slate-700/30" style={{ top: `${(workdayEnd - workdayStart) * 80}px` }}>
                <div className="flex items-center gap-2 px-2 py-1">
                  <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">End of Workday</span>
                  <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
                </div>
          </div>
        </div>

            {/* Current Time Line */}
            {currentHour >= workdayStart && currentHour <= workdayEnd && (
              <div 
                className="absolute left-12 sm:left-16 right-0 z-30 pointer-events-none"
                style={{ top: `${currentTop}px` }}
              >
                {/* Red line across the calendar */}
                <div className="absolute left-0 right-0 border-t-2 border-red-500 shadow-lg"></div>
                {/* Red circle indicator on the left */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg ring-2 ring-white dark:ring-slate-800"></div>
                {/* Time label */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-red-500 dark:bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded shadow-lg">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            {/* Events Layer */}
            <div 
              className="absolute top-4 left-12 sm:left-16 right-0 bottom-0"
              onDragOver={handleCalendarDragOver}
              onDrop={handleCalendarDrop}
              onDragLeave={handleCalendarDragLeave}
            >
              {/* Horizontal Grid Lines */}
              {Array.from({ length: workdayEnd - workdayStart }).map((_, i) => {
                const hour = workdayStart + i;
                const isDragOver = dragOverTimeSlot !== null && Math.floor(dragOverTimeSlot) === hour;
                const isLastHour = hour === workdayEnd - 1;
                return (
                  <div 
                    key={i} 
                    className={`h-[80px] border-b w-full relative ${
                      isLastHour 
                        ? 'border-slate-300 dark:border-slate-600 bg-slate-50/30 dark:bg-slate-700/20' 
                        : isDragOver 
                        ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isDragOver && (
                      <div className="absolute inset-0 border-2 border-dashed border-slate-400 dark:border-slate-500 rounded bg-slate-50/50 dark:bg-slate-700/30 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Drop here</span>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Workday End Line */}
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-slate-400 dark:border-slate-500 bg-slate-50/50 dark:bg-slate-700/30 z-20"
                style={{ top: `${(workdayEnd - workdayStart) * 80}px` }}
              >
                <div className="absolute left-0 right-0 top-0 h-full bg-gradient-to-b from-transparent via-slate-100/50 dark:via-slate-700/30 to-transparent"></div>
              </div>

                {/* Scheduled Items */}
                {/* 1. Meetings */}
                {filteredMeetings.map(m => {
                  const conflict = checkMeetingConflict(m.start, m.duration, m.id);
                  const isDragging = draggedMeetingId === m.id;
                  const project = getProject(m.projectId || 1);
                  
                  // Check if meeting time has passed or starts within 30 minutes (only for today's date)
                  const isToday = selectedDateStr === todayStr;
                  const startHours = timeToHours(m.start);
                  const endHours = startHours + m.duration;
                  const meetingEndTime = endHours;
                  const timeUntilStart = startHours - currentHour;
                  const isTimePassed = isToday && meetingEndTime < currentHour;
                  const isOngoing = isToday && currentHour >= startHours && currentHour < endHours;
                  const isStartingSoon = isToday && timeUntilStart > 0 && timeUntilStart <= 0.5; // 30 minutes = 0.5 hours
                  // Allow dragging if ongoing, otherwise disable if time passed or starting soon (but not started yet)
                  const cannotDrag = isTimePassed || (isStartingSoon && currentHour < startHours);
                  
                  return (
                    <div 
                      key={m.id}
                      draggable={!cannotDrag}
                      onDragStart={e => !cannotDrag && handleMeetingDragStart(e, m.id)}
                      onDragEnd={handleDragEnd}
                      className={`absolute left-4 right-6 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white shadow-lg transition-all group overflow-hidden ${
                        cannotDrag 
                          ? 'opacity-50 grayscale cursor-not-allowed' 
                          : 'hover:z-30 cursor-move hover:shadow-xl hover:shadow-slate-900/20 hover:scale-[1.02]'
                      } ${
                        conflict.conflict ? 'ring-2 ring-red-400/50' : ''
                      } ${isDragging ? 'opacity-50 scale-95' : ''} ${
                        m.duration < 1 ? 'p-1.5' : 'p-3'
                      }`}
                      title={isTimePassed ? "Meeting time has passed" : isOngoing ? "Meeting in progress - Drag to reschedule" : isStartingSoon ? "Meeting starts within 30 minutes - cannot reschedule" : "Meeting - Drag to reschedule"}
                      style={{
                        top: `${(timeToHours(m.start) - workdayStart) * 80}px`,
                        height: `${Math.max(m.duration * 80, 40)}px`,
                        minHeight: '40px',
                        borderLeft: `4px solid ${cannotDrag ? '#9ca3af' : (conflict.conflict ? '#f87171' : colorToHex(project.color))}`,
                        boxShadow: conflict.conflict ? '0 4px 6px -1px rgba(239, 68, 68, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      {/* Subtle background pattern */}
                      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]"></div>
                      
                      <div className="relative flex justify-between items-center h-full gap-2">
                        <div className="overflow-hidden flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className={`p-1 rounded-md ${isTimePassed ? 'bg-slate-700/30 dark:bg-slate-600/30' : 'bg-slate-700/50 dark:bg-slate-600/50'}`}>
                              <Users size={m.duration < 1 ? 11 : 13} className={isTimePassed ? 'text-slate-400' : 'text-slate-200'} />
                            </div>
                            <span className={`font-semibold ${isTimePassed ? 'text-slate-400 bg-slate-700/30 dark:bg-slate-600/30' : 'text-slate-100 bg-slate-700/60 dark:bg-slate-600/60'} px-1.5 py-0.5 rounded-md uppercase tracking-wide flex-shrink-0 ${m.duration < 1 ? 'text-[8px]' : 'text-[9px]'}`}>Meeting</span>
                          </div>
                          <p className={`font-semibold ${isTimePassed ? 'text-slate-400' : 'text-white'} truncate flex-1 min-w-0 ${m.duration < 1 ? 'text-xs' : 'text-xs md:text-sm'}`}>{m.title}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock size={m.duration < 1 ? 9 : 10} className={isTimePassed ? 'text-slate-400 opacity-50' : 'text-slate-300 opacity-70'} />
                            {(() => {
                              const startHours = timeToHours(m.start);
                              const endHours = startHours + m.duration;
                              const endTime = hoursToTime(endHours);
                              return (
                                <p className={`${isTimePassed ? 'text-slate-400 opacity-60' : 'text-slate-300 opacity-90'} font-medium ${m.duration < 1 ? 'text-[9px]' : 'text-[10px]'}`}>{m.start} - {endTime}</p>
                              );
                            })()}
                          </div>
                          {m.duration >= 1 && (
                            <div className={`w-px h-4 ${isTimePassed ? 'bg-slate-600/30' : 'bg-slate-600/50'} mx-0.5`}></div>
                          )}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${isTimePassed ? 'bg-slate-400' : project.color} ring-1 ring-slate-600/50`}></div>
                            <span className={`${isTimePassed ? 'text-slate-400 bg-slate-700/30 dark:bg-slate-600/30' : 'text-slate-200 bg-slate-700/60 dark:bg-slate-600/60'} px-1.5 py-0.5 rounded-md font-medium ${m.duration < 1 ? 'text-[9px]' : 'text-[9px]'}`}>
                              {project.name}
                            </span>
                          </div>
                          {conflict.conflict && !isTimePassed && (
                            <div className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 bg-red-500/20 rounded-md">
                              <AlertTriangle size={m.duration < 1 ? 9 : 10} className="text-red-300" />
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 transition-opacity ${isTimePassed ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isTimePassed) startEditMeeting(m);
                            }} 
                            className="p-1 rounded-md hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors flex-shrink-0"
                            title="Edit meeting"
                            disabled={isTimePassed}
                          >
                            <Edit2 size={m.duration < 1 ? 12 : 14}/>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isTimePassed) setMeetings(meetings.filter(x => x.id !== m.id));
                            }} 
                            className="p-1 rounded-md hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition-colors flex-shrink-0"
                            title="Delete meeting"
                            disabled={isTimePassed}
                          >
                            <X size={m.duration < 1 ? 12 : 14}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Tasks */}
                {filteredSchedule.map((item, index) => {
                  const task = tasks.find(t => t.id === item.taskId);
                  if (!task) return null;
                  const project = getProject(task.projectId);
                  const conflict = checkConflict(item.start, item.duration, item.taskId);
                  const isDragging = draggedScheduleItem === item.taskId;
                  
                  // Check if task time has passed or starts within 30 minutes (only for today's date)
                  const isToday = selectedDateStr === todayStr;
                  const startHours = timeToHours(item.start);
                  const endHours = startHours + item.duration;
                  const taskEndTime = endHours;
                  const timeUntilStart = startHours - currentHour;
                  const isTimePassed = isToday && taskEndTime < currentHour;
                  const isOngoing = isToday && currentHour >= startHours && currentHour < endHours;
                  const isStartingSoon = isToday && timeUntilStart > 0 && timeUntilStart <= 0.5; // 30 minutes = 0.5 hours
                  // Allow dragging if ongoing, otherwise disable if time passed or starting soon (but not started yet)
                  const cannotDrag = isTimePassed || (isStartingSoon && currentHour < startHours);
                  
                  // Ensure truly unique key - combine multiple identifiers
                  const uniqueKey = item.id || `schedule-${item.taskId}-${item.start}-${item.date || formatDateForStorage(selectedDate)}-${index}`;
                  
                  return (
                    <div 
                      key={uniqueKey}
                      draggable={!cannotDrag}
                      onDragStart={e => !cannotDrag && handleScheduleItemDragStart(e, item.taskId)}
                      onDragEnd={handleDragEnd}
                      className={`absolute left-4 right-6 rounded-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 shadow-md border transition-all group ${
                        cannotDrag 
                          ? 'opacity-50 grayscale cursor-not-allowed' 
                          : 'hover:shadow-lg hover:z-30 cursor-move hover:scale-[1.01]'
                      } ${
                        conflict.conflict ? 'border-red-300 dark:border-red-500 ring-2 ring-red-200/50 dark:ring-red-900/50' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      } ${isDragging ? 'opacity-50 scale-95' : ''} ${
                        item.duration < 1 ? 'p-1.5' : 'p-3'
                      }`}
                      title={isTimePassed ? "Task time has passed" : isOngoing ? "Task in progress - Drag to reschedule" : isStartingSoon ? "Task starts within 30 minutes - cannot reschedule" : "Task - Drag to reschedule"}
                      style={{
                        top: `${(timeToHours(item.start) - workdayStart) * 80}px`,
                        height: `${Math.max(item.duration * 80, 40)}px`,
                        minHeight: '40px',
                        borderLeft: `4px solid ${cannotDrag ? '#9ca3af' : colorToHex(project.color)}`,
                        boxShadow: conflict.conflict 
                          ? '0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1)' 
                          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {/* Subtle background pattern */}
                      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,slate-900_1px,transparent_0)] [background-size:16px_16px]"></div>
                      
                      <div className="relative flex justify-between items-center h-full gap-2">
                        <div className="overflow-hidden flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className={`p-1 rounded-md ${isTimePassed ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-600/50'}`}>
                              <CheckSquare size={item.duration < 1 ? 11 : 13} className={isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'} />
                            </div>
                            <span className={`font-semibold ${isTimePassed ? 'text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600/50'} px-1.5 py-0.5 rounded-md uppercase tracking-wide flex-shrink-0 ${item.duration < 1 ? 'text-[8px]' : 'text-[9px]'}`}>Task</span>
                          </div>
                          <p className={`font-semibold ${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'} truncate flex-1 min-w-0 ${item.duration < 1 ? 'text-xs' : 'text-xs md:text-sm'}`}>{task.title}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock size={item.duration < 1 ? 9 : 10} className={isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} />
                            {(() => {
                              const startHours = timeToHours(item.start);
                              const endHours = startHours + item.duration;
                              const endTime = hoursToTime(endHours);
                              return (
                                <p className={`${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'} font-medium ${item.duration < 1 ? 'text-[9px]' : 'text-[10px]'}`}>{item.start} - {endTime}</p>
                              );
                            })()}
                          </div>
                          {item.duration >= 1 && (
                            <div className={`w-px h-4 ${isTimePassed ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-300 dark:bg-slate-600'} mx-0.5`}></div>
                          )}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${isTimePassed ? 'bg-slate-400 dark:bg-slate-500' : project.color} ring-1 ring-slate-300/50 dark:ring-slate-600/50`}></div>
                            <span className={`${isTimePassed ? 'text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600/50'} px-1.5 py-0.5 rounded-md font-medium ${item.duration < 1 ? 'text-[9px]' : 'text-[9px]'}`}>
                              {project.name}
                            </span>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border flex-shrink-0 ${isTimePassed ? 'text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600' : getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {conflict.conflict && !isTimePassed && (
                            <div className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded-md">
                              <AlertTriangle size={item.duration < 1 ? 9 : 10} className="text-red-500 dark:text-red-400" />
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => setSchedule(schedule.filter(s => s.taskId !== item.taskId))} 
                          className={`p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all flex-shrink-0 ${isTimePassed ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'}`}
                          title="Remove from schedule"
                          disabled={isTimePassed}
                        >
                          <X size={item.duration < 1 ? 12 : 14}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Page */}
        {activePage === 'tasks' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden dark:text-slate-100">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Tasks</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                  {tasks.length} total
                </span>
              </div>
              <button
                onClick={() => openProjectModal()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium transition-colors"
                title="Manage Projects"
              >
                <Folder size={15} />
                <span className="hidden sm:inline">Projects</span>
              </button>
            </div>
            
            {/* Projects Quick Filter */}
            {projects.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Filter by project:</span>
                  <button
                    onClick={() => setFilterProject('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterProject === 'all'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    All
                  </button>
                  {projects.map(project => {
                    const taskCount = tasks.filter(t => t.projectId === project.id).length;
                    return (
                      <div
                        key={project.id}
                        className="group relative flex items-center"
                      >
                        <button
                          onClick={() => setFilterProject(project.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            filterProject === project.id
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${project.color}`}></div>
                          <span>{project.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            filterProject === project.id
                              ? 'bg-white/20 dark:bg-slate-900/20'
                              : 'bg-white dark:bg-slate-800'
                          }`}>
                            {taskCount}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openProjectModal(project);
                          }}
                          className="ml-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit project"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search, Filters, and Add Task Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Left side: Search and Filters */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white dark:bg-slate-700 rounded-md px-3 py-2 border border-slate-200 dark:border-slate-600 focus-within:ring-1 focus-within:ring-slate-400 focus-within:border-slate-400 transition-all">
                  <Search size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-md transition-all whitespace-nowrap ${
                    showFilters 
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-slate-900 dark:border-slate-100' 
                      : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Filter size={14} />
                  <span>Filters</span>
                </button>
              </div>
              
              {/* Right side: Add Task Button */}
              <button 
                onClick={() => {
                  setNewTaskProject(projects.length > 0 ? projects[0].id : 1);
                  setShowTaskForm(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-md transition-all text-sm font-medium whitespace-nowrap"
              >
                <Plus size={18} />
                <span>Add Task</span>
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex flex-wrap items-center gap-3">
              <select 
                    value={filterProject} 
                    onChange={e => setFilterProject(e.target.value)}
                    className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-md outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-1 focus:ring-slate-400 transition-colors text-slate-900 dark:text-slate-100"
              >
                    <option value="all">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
                  <select 
                    value={filterPriority} 
                    onChange={e => setFilterPriority(e.target.value)}
                    className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-md outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-1 focus:ring-slate-400 transition-colors text-slate-900 dark:text-slate-100"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-md outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-1 focus:ring-slate-400 transition-colors text-slate-900 dark:text-slate-100"
                  >
                    <option value="all">All Status</option>
                    <option value="backlog">Backlog</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  {(filterProject !== 'all' || filterPriority !== 'all' || filterStatus !== 'all' || searchQuery) && (
                    <button 
                      onClick={() => {
                        setFilterProject('all');
                        setFilterPriority('all');
                        setFilterStatus('all');
                        setSearchQuery('');
                      }}
                      className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                    >
                      Clear Filters
              </button>
                  )}
                </div>
              </div>
            )}
            </div>

          {/* Kanban Columns */}
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {columns.map(col => {
                const taskCount = filteredTasks.filter(t => t.status === col.id).length;
                const columnIcons = {
                  'backlog': Folder,
                  'in-progress': AlertCircle,
                  'done': CheckCircle2
                };
                const Icon = columnIcons[col.id] || Folder;
                
                return (
                <div 
                  key={col.id} 
                  onDragOver={e => handleDragOver(e, col.id)}
                  onDrop={e => handleDrop(e, col.id)}
                  className={`rounded-xl p-4 min-h-[400px] transition-all border-2 ${
                    dragOverColumn === col.id 
                      ? 'ring-2 ring-slate-400 dark:ring-slate-500 ring-inset bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600' 
                      : 'border-transparent'
                  } ${col.bg}`}
                >
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        col.id === 'backlog' ? 'bg-slate-100 dark:bg-slate-700' :
                        col.id === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <Icon size={14} className={
                          col.id === 'backlog' ? 'text-slate-600 dark:text-slate-300' :
                          col.id === 'in-progress' ? 'text-blue-600 dark:text-blue-400' :
                          'text-green-600 dark:text-green-400'
                        } />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{col.title}</h3>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      taskCount > 0 
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {taskCount}
                    </span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {taskCount === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700/50 mb-3">
                          <Icon size={20} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">No tasks</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Drag tasks here</p>
                      </div>
                    )}
                    {filteredTasks.filter(t => t.status === col.id).map(task => {
                      const project = getProject(task.projectId);
                      const isEditing = editingTask === task.id;
                      
                      if (isEditing) {
                        return (
                          <div key={task.id} className="bg-white dark:bg-slate-700 p-3 rounded-md shadow-sm border-2 border-slate-300 dark:border-slate-500">
                            <input
                              value={editTaskTitle}
                              onChange={e => setEditTaskTitle(e.target.value)}
                              className="w-full px-2 py-1 mb-2 text-sm border border-slate-200 dark:border-slate-600 rounded outline-none focus:ring-1 focus:ring-slate-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              autoFocus
                            />
                            <div className="flex gap-2 mb-2">
                              <input
                                type="number"
                                value={editTaskDuration}
                                onChange={e => setEditTaskDuration(Number(e.target.value))}
                                className="w-16 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded outline-none focus:ring-1 focus:ring-slate-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                min="0.5"
                                step="0.5"
                              />
                              <select
                                value={editTaskPriority}
                                onChange={e => setEditTaskPriority(e.target.value)}
                                className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                              <select
                                value={editTaskProject}
                                onChange={e => setEditTaskProject(Number(e.target.value))}
                                className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              >
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <input
                              type="date"
                              value={editTaskDueDate}
                              onChange={e => setEditTaskDueDate(e.target.value)}
                              className="w-full px-2 py-1 mb-2 text-xs border border-slate-200 dark:border-slate-600 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              placeholder="Due date (optional)"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditTask}
                                className="flex-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs py-1.5 rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditTask}
                                className="flex-1 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs py-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div 
                          key={task.id}
                          draggable
                          onDragStart={e => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={`
                            group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-3.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-600
                            hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-grab active:cursor-grabbing
                            ${draggedTaskId === task.id ? 'opacity-50 rotate-2 scale-95' : 'hover:scale-[1.02]'}
                          `}
                        >
                          {/* Subtle background pattern */}
                          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,slate-900_1px,transparent_0)] [background-size:16px_16px] rounded-xl"></div>
                          
                          {/* Project color indicator - thicker and more prominent */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full ${project.color} shadow-sm`}></div>
                          
                          <div className="relative pl-4 flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug flex-1">{task.title}</p>
                              {task.notes && (
                                <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-600/50">
                                  <FileText size={11} className="text-slate-500 dark:text-slate-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-600/50">
                                <div className={`w-2 h-2 rounded-full ${project.color} ring-1 ring-slate-300/50 dark:ring-slate-600/50`}></div>
                                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                {project.name}
                              </span>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300">
                                <Clock size={10} />
                                <span className="text-[10px] font-semibold">{task.duration}h</span>
                              </div>
                              {task.dueDate && (
                                <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-semibold ${
                                  isOverdue(task.dueDate) 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' 
                                    : isDueSoon(task.dueDate)
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                }`}>
                                  <Calendar size={9} />
                                  <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                              )}
                          </div>
                          </div>
                          
                          <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => openTaskDetails(task)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              title="Task details"
                            >
                              <FileText size={13} />
                            </button>
                            <button 
                              onClick={() => startEditTask(task)}
                              className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Edit task"
                            >
                              <Edit2 size={13} />
                            </button>
                          <button 
                            onClick={() => deleteTask(task.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title="Delete task"
                          >
                              <X size={13} />
                          </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
          </div>
        )}
          </div>

      {/* Modal: Task Details */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Task Details</h2>
              <button 
                onClick={() => setSelectedTask(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Title</label>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-md">{selectedTask.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-md">{selectedTask.duration}h</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                  <span className={`inline-block text-xs px-2 py-1.5 rounded-md border ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
              </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Project</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-md">
                  <div className={`w-3 h-3 rounded-full ${getProject(selectedTask.projectId).color}`}></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{getProject(selectedTask.projectId).name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                  </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                <textarea
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Add notes, description, or additional details..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTaskDetails}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
                </div>
              )}

      {/* Modal: Add Task */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Task</h2>
              <button 
                onClick={() => {
                  setShowTaskForm(false);
                  setNewTaskTitle('');
                  setNewTaskDuration('1');
                  setNewTaskPriority('medium');
                  setNewTaskNotes('');
                  setNewTaskDueDate('');
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Form */}
            <div className="p-4 space-y-4">
                      <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input 
                  value={newTaskTitle}
                  onChange={e => {
                    setNewTaskTitle(e.target.value);
                    if (taskFormErrors.title) {
                      setTaskFormErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  className={`w-full h-10 px-3 border rounded-md text-sm focus:ring-2 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    taskFormErrors.title 
                      ? 'border-red-500 focus:ring-red-400 focus:border-red-500' 
                      : 'border-slate-200 dark:border-slate-600 focus:ring-slate-400 focus:border-slate-400'
                  }`}
                  placeholder="e.g. Design landing page"
                  autoFocus
                />
                {taskFormErrors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{taskFormErrors.title}</p>
                )}
                      </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Duration (hours) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    value={newTaskDuration}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                        setNewTaskDuration(value);
                        if (taskFormErrors.duration) {
                          setTaskFormErrors(prev => ({ ...prev, duration: '' }));
                        }
                      }
                    }}
                    onBlur={e => {
                      const value = parseFloat(e.target.value);
                      if (!value || value < 0.5) {
                        setNewTaskDuration('0.5');
                      } else {
                        setNewTaskDuration(value.toString());
                      }
                    }}
                    className={`w-full h-10 px-3 border rounded-md text-sm focus:ring-2 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                      taskFormErrors.duration 
                        ? 'border-red-500 focus:ring-red-400 focus:border-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-slate-400 focus:border-slate-400'
                    }`}
                    min="0.5" 
                    step="0.5"
                    placeholder="1"
                  />
                  {taskFormErrors.duration && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{taskFormErrors.duration}</p>
                  )}
                    </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={newTaskPriority} 
                    onChange={e => setNewTaskPriority(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <select 
                  value={newTaskProject} 
                  onChange={e => {
                    setNewTaskProject(Number(e.target.value));
                    if (taskFormErrors.project) {
                      setTaskFormErrors(prev => ({ ...prev, project: '' }));
                    }
                  }}
                  className={`w-full h-10 px-3 border rounded-md text-sm focus:ring-2 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer ${
                    taskFormErrors.project 
                      ? 'border-red-500 focus:ring-red-400 focus:border-red-500' 
                      : 'border-slate-200 dark:border-slate-600 focus:ring-slate-400 focus:border-slate-400'
                  }`}
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {taskFormErrors.project && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{taskFormErrors.project}</p>
                )}
                        </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                      </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newTaskNotes}
                  onChange={e => setNewTaskNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Add notes, description, or additional details..."
                />
                    </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowTaskForm(false);
                    setNewTaskTitle('');
                    setNewTaskDuration('1');
                    setNewTaskPriority('medium');
                    setNewTaskNotes('');
                    setNewTaskDueDate('');
                    setTaskFormErrors({});
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Meeting */}
      {showMeetingForm && (
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-6 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingMeeting ? 'Edit Meeting' : 'Add Event'}</h3>
              <button onClick={() => {
                setShowMeetingForm(false);
                setEditingMeeting(null);
                setNewMeetingTitle('');
                setNewMeetingStart('08:00');
                setNewMeetingEnd('09:00');
                setNewMeetingProject(1);
                setNewMeetingRepeat(false);
                setNewMeetingRepeatDays({
                  monday: false,
                  tuesday: false,
                  wednesday: false,
                  thursday: false,
                  friday: false
                });
                setEditMeetingTitle('');
                setEditMeetingStart('08:00');
                setEditMeetingEnd('09:00');
                setEditMeetingProject(1);
              }} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-700 p-1 rounded-full"><X size={18} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input 
                  value={editingMeeting ? editMeetingTitle : newMeetingTitle}
                  onChange={e => editingMeeting ? setEditMeetingTitle(e.target.value) : setNewMeetingTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="e.g. Client Sync"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project
                </label>
                <select 
                  value={editingMeeting ? editMeetingProject : newMeetingProject} 
                  onChange={e => editingMeeting ? setEditMeetingProject(Number(e.target.value)) : setNewMeetingProject(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Start <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="time" 
                    value={editingMeeting ? editMeetingStart : newMeetingStart} 
                    onChange={e => editingMeeting ? setEditMeetingStart(e.target.value) : setNewMeetingStart(e.target.value)} 
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    End <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="time" 
                    value={editingMeeting ? editMeetingEnd : newMeetingEnd} 
                    onChange={e => editingMeeting ? setEditMeetingEnd(e.target.value) : setNewMeetingEnd(e.target.value)} 
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" 
                  />
                </div>
              </div>

              {!editingMeeting && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="repeat-meeting"
                      checked={newMeetingRepeat}
                      onChange={e => setNewMeetingRepeat(e.target.checked)}
                      className="w-4 h-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                    <label htmlFor="repeat-meeting" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Repeat weekly
                    </label>
                  </div>
                  
                  {newMeetingRepeat && (
                    <div className="pl-6 space-y-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select days:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'monday', label: 'Monday' },
                          { key: 'tuesday', label: 'Tuesday' },
                          { key: 'wednesday', label: 'Wednesday' },
                          { key: 'thursday', label: 'Thursday' },
                          { key: 'friday', label: 'Friday' }
                        ].map(day => (
                          <label key={day.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newMeetingRepeatDays[day.key]}
                              onChange={e => setNewMeetingRepeatDays({
                                ...newMeetingRepeatDays,
                                [day.key]: e.target.checked
                              })}
                              className="w-4 h-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowMeetingForm(false);
                    setEditingMeeting(null);
                    setNewMeetingTitle('');
                    setNewMeetingStart('08:00');
                    setNewMeetingEnd('09:00');
                    setNewMeetingProject(1);
                    setNewMeetingRepeat(false);
                    setNewMeetingRepeatDays({
                      monday: false,
                      tuesday: false,
                      wednesday: false,
                      thursday: false,
                      friday: false
                    });
                    setEditMeetingTitle('');
                    setEditMeetingStart('08:00');
                    setEditMeetingEnd('09:00');
                    setEditMeetingProject(1);
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingMeeting ? saveEditMeeting : addMeeting}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  {editingMeeting ? 'Update Meeting' : 'Save Meeting'}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Bot Modal */}
      {showChatBot && (
        <div 
          className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking outside (on backdrop)
            if (e.target === e.currentTarget) {
              setShowChatBot(false);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl h-[600px] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Calendar Assistant</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tell me your scheduling preferences</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (window.confirm('Clear all chat messages?')) {
                      setChatMessages([
                        { role: 'assistant', content: 'Hi! I\'m your AI calendar assistant. Tell me about your scheduling preferences and I\'ll help organize your day better. For example, you can say "I prefer to do deep work in the morning" or "Schedule meetings after 2 PM".' }
                      ]);
                      showToast('Chat cleared');
                    }
                  }}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-700 p-1.5 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw size={16} />
                </button>
                <button 
                  onClick={() => {
                    // Cancel any ongoing chat operations
                    setChatLoading(false);
                    setIsLoading(false);
                    setShowChatBot(false);
                  }}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-700 p-1 rounded-full"
                  title="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Thinking...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder="Tell me your scheduling preferences..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={chatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIKanbanScheduler;
