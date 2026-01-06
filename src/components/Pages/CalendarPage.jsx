import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckSquare,
  AlertTriangle,
  Edit2,
  Folder,
  Coffee,
  UtensilsCrossed,
  Pause
} from 'lucide-react';
import { timeToHours, hoursToTime, formatDateForStorage } from '../../utils/dateHelpers';
import TimePicker from '../TimePicker';

// Constants for calendar layout
const HOUR_HEIGHT = 70; // Height of each hour slot in pixels
const TIME_COLUMN_WIDTH = 'w-16 sm:w-20 lg:w-24'; // Width of time indicator column

const CalendarPage = ({
  activePage,
  setActivePage,
  selectedDate,
  navigateDate,
  goToToday,
  isToday,
  formatDate,
  projects,
  setNewMeetingProject,
  setShowMeetingForm,
  generateSchedule,
  isLoading,
  workdayStart,
  workdayEnd,
  currentHour,
  currentTime,
  currentTop,
  handleCalendarDragOver,
  handleCalendarDrop,
  handleCalendarDragLeave,
  dragOverTimeSlot,
  filteredMeetings,
  checkMeetingConflict,
  draggedMeetingId,
  getProject,
  colorToHex,
  handleMeetingDragStart,
  handleDragEnd,
  handleTouchStart,
  startEditMeeting,
  setMeetings,
  meetings,
  filteredSchedule,
  tasks,
  checkConflict,
  draggedScheduleItem,
  handleScheduleItemDragStart,
  setSchedule,
  schedule,
  selectedDateStr,
  todayStr,
  getPriorityColor,
  openBreakTimePicker,
  showBreakTimePicker,
  setShowBreakTimePicker,
  selectedBreakType,
  breakStartTime,
  setBreakStartTime,
  breakDuration,
  setBreakDuration,
  addQuickBreak
}) => {
  // Calculate total calendar height
  const totalHours = workdayEnd - workdayStart;
  const calendarHeight = totalHours * HOUR_HEIGHT;

  // Calculate current time position
  const getCurrentTimePosition = () => {
    // currentHour is already in decimal format (e.g., 13.833 for 13:50)
    if (currentHour < workdayStart || currentHour > workdayEnd) return null;
    // Calculate position directly from currentHour (which already includes minutes)
    // Add 8px for top padding offset
    return 8 + (currentHour - workdayStart) * HOUR_HEIGHT;
  };

  const currentTimePosition = getCurrentTimePosition();

  // Calculate position for an event based on its start time
  const getEventTop = (startTime) => {
    const startHours = timeToHours(startTime);
    return 8 + (startHours - workdayStart) * HOUR_HEIGHT; // 8px top padding offset
  };

  // Calculate height for an event based on its duration
  const getEventHeight = (duration) => {
    // For very short events (30 min or less), use a minimum height that can display content
    return Math.max(duration * HOUR_HEIGHT, 60);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6">
      {/* Mobile Quick Actions Bar */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          onClick={() => setActivePage('calendar')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            activePage === 'calendar'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          <CalendarIcon size={16} />
          <span>Calendar</span>
        </button>
        <button
          onClick={() => setActivePage('tasks')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            activePage === 'tasks'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          <Folder size={16} />
          <span>Tasks</span>
        </button>
        <button 
          onClick={() => {
            setNewMeetingProject(projects.length > 0 ? projects[0].id : 1);
            setShowMeetingForm(true);
          }} 
          className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-500/40 flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Meeting</span>
        </button>
      </div>

      {/* Left Sidebar - Navigation + Quick Actions */}
      <aside className="hidden lg:block space-y-4">
        {/* Navigation Buttons */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-4 ring-1 ring-slate-200/40 dark:ring-slate-700/40">
          <nav className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActivePage('calendar')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative ${
                activePage === 'calendar'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/70 hover:scale-105'
              }`}
            >
              <CalendarIcon size={17} className={activePage === 'calendar' ? 'drop-shadow-sm' : ''} />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActivePage('tasks')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative ${
                activePage === 'tasks'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/70 hover:scale-105'
              }`}
            >
              <Folder size={17} className={activePage === 'tasks' ? 'drop-shadow-sm' : ''} />
              <span>Tasks</span>
            </button>
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-6 ring-1 ring-slate-200/40 dark:ring-slate-700/40">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-5 uppercase tracking-widest text-blue-600 dark:text-blue-400">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={generateSchedule}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="Auto schedule tasks"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-cyan-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Wand2 size={14} />
                  <span>Auto Schedule</span>
                </>
              )}
            </button>
            
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <button 
                onClick={() => {
                  setNewMeetingProject(projects.length > 0 ? projects[0].id : 1);
                  setShowMeetingForm(true);
                }} 
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                title="Add new meeting"
              >
              <Users size={14} />
              <span>New Meeting</span>
              </button>
            </div>
            
            {/* Quick Breaks */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Quick Breaks</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openBreakTimePicker('lunch')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  title="Add lunch break"
                >
                  <UtensilsCrossed size={14} />
                  <span>Lunch</span>
                </button>
                <button
                  onClick={() => openBreakTimePicker('coffee')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  title="Add coffee break"
                >
                  <Coffee size={14} />
                  <span>Coffee</span>
                </button>
                <button
                  onClick={() => openBreakTimePicker('pause')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  title="Add pause"
                >
                  <Pause size={14} />
                  <span>Pause</span>
                </button>
                <button
                  onClick={() => openBreakTimePicker('exercise')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  title="Add exercise"
                >
                  <span className="text-sm">💪</span>
                  <span>Exercise</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Calendar Content */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden ring-1 ring-slate-200/40 dark:ring-slate-700/40">
        {/* Calendar Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 dark:from-slate-800 dark:via-blue-900/10 dark:to-cyan-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20">
                <CalendarIcon className="text-white w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg sm:text-xl lg:text-2xl bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-400 bg-clip-text text-transparent">
                  {isToday(selectedDate) ? "Today's Schedule" : "Schedule"}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">{formatDate(selectedDate)}</p>
              </div>
            </div>
            
            {/* Date Navigation */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
              <button 
                onClick={() => navigateDate(-1)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 min-w-[36px] min-h-[36px]"
                title="Previous day"
              >
                <ChevronLeft size={16} className="sm:w-[17px] sm:h-[17px]" />
              </button>
              <button
                onClick={goToToday}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all duration-300 min-h-[36px] ${
                  isToday(selectedDate)
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 text-white shadow-lg shadow-blue-500/40 scale-105'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => navigateDate(1)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 min-w-[36px] min-h-[36px]"
                title="Next day"
              >
                <ChevronRight size={16} className="sm:w-[17px] sm:h-[17px]" />
              </button>
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="lg:hidden flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <button 
              onClick={() => {
                setNewMeetingProject(projects.length > 0 ? projects[0].id : 1);
                setShowMeetingForm(true);
              }} 
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/30"
            >
              <Plus size={16} />
              <span>Meeting</span>
            </button>
            <button 
              onClick={generateSchedule}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Auto</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div 
          className="overflow-y-auto relative bg-gradient-to-br from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/50 calendar-container"
          style={{
            height: `${Math.max(calendarHeight + HOUR_HEIGHT + 32, 300)}px`,
            maxHeight: 'calc(100vh - 200px)',
            paddingTop: '8px'
          }}
        >
          
          {/* Time Indicator Column */}
          <div className={`absolute top-0 left-0 ${TIME_COLUMN_WIDTH} border-r border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-md z-10 shadow-sm`} style={{ height: `${calendarHeight + HOUR_HEIGHT}px`, top: '8px' }}>
            {Array.from({ length: totalHours }).map((_, i) => {
              const hour = workdayStart + i;
              return (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-b border-slate-200/60 dark:border-slate-700/60"
                  style={{
                    top: `${8 + i * HOUR_HEIGHT}px`,
                    height: `${HOUR_HEIGHT}px`
                  }}
                >
                  <span className="absolute top-2 right-2 sm:right-3 lg:right-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              );
            })}
            {/* End hour indicator */}
            <div
              className="absolute left-0 right-0"
              style={{
                top: `${8 + totalHours * HOUR_HEIGHT}px`,
                height: `${HOUR_HEIGHT}px`
              }}
            >
              <span className="absolute top-2 right-2 sm:right-3 lg:right-4 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                {workdayEnd.toString().padStart(2, '0')}:00
              </span>
            </div>
          </div>

          {/* Current Time Indicator Line */}
          {currentTimePosition !== null && (
            <div 
              className="absolute left-16 sm:left-20 lg:left-24 right-0 z-30 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="absolute left-0 right-0 border-t-2 border-red-500/90 shadow-lg shadow-red-500/20"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50 ring-2 ring-white dark:ring-slate-800 z-40"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 ml-3 bg-red-500 dark:bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            </div>
          )}

          {/* Events Layer - Grid and Items */}
          <div 
            className="absolute left-16 sm:left-20 lg:left-24 right-2 sm:right-4"
            style={{ 
              top: '8px',
              height: `${calendarHeight}px`,
              paddingBottom: '16px'
            }}
            onDragOver={handleCalendarDragOver}
            onDrop={handleCalendarDrop}
            onDragLeave={handleCalendarDragLeave}
          >
            {/* Grid Lines - Hour boundaries */}
            {Array.from({ length: totalHours + 1 }).map((_, i) => {
              const hour = workdayStart + i;
              const isDragOver = dragOverTimeSlot !== null && Math.floor(dragOverTimeSlot) === hour;
              const isLastLine = i === totalHours;
              
              return (
                <div
                  key={`grid-hour-${i}`}
                  className={`absolute left-0 right-0 border-t transition-colors pointer-events-none ${
                    isLastLine
                      ? 'border-slate-300/60 dark:border-slate-600/60'
                      : isDragOver
                      ? 'border-blue-400/60 dark:border-blue-500/60 border-t-2'
                      : 'border-slate-200/40 dark:border-slate-700/40'
                  }`}
                  style={{ top: `${8 + i * HOUR_HEIGHT}px` }}
                />
              );
            })}

            {/* Grid Lines - Half-hour marks (30 minutes) */}
            {Array.from({ length: totalHours }).map((_, i) => {
              return (
                <div
                  key={`grid-half-${i}`}
                  className="absolute left-0 right-0 border-t border-slate-200/20 dark:border-slate-700/20 pointer-events-none border-dashed"
                  style={{ top: `${8 + (i * HOUR_HEIGHT) + (HOUR_HEIGHT / 2)}px` }}
                />
              );
            })}

            {/* Hour Slot Backgrounds for Drag Over */}
            {Array.from({ length: totalHours }).map((_, i) => {
              const hour = workdayStart + i;
              const isDragOver = dragOverTimeSlot !== null && Math.floor(dragOverTimeSlot) === hour;
              
              return (
                <div
                  key={`slot-${i}`}
                  className={`absolute left-0 right-0 transition-colors ${
                    isDragOver ? 'bg-blue-50/60 dark:bg-blue-900/30' : ''
                  }`}
                  style={{
                    top: `${8 + i * HOUR_HEIGHT}px`,
                    height: `${HOUR_HEIGHT}px`
                  }}
                >
                  {isDragOver && (
                    <div className="absolute inset-0 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-lg bg-blue-50/70 dark:bg-blue-900/40 flex items-center justify-center pointer-events-none animate-pulse">
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Drop here</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Meetings */}
            {filteredMeetings.map(m => {
              const conflict = checkMeetingConflict(m.start, m.duration, m.id);
              const isDragging = draggedMeetingId === m.id;
              const project = getProject(m.projectId || 1);
              const isBreak = m.isBreak || false;
              const breakColor = m.breakColor || '#6b7280';
              
              const isTodayCheck = selectedDateStr === todayStr;
              const startHours = timeToHours(m.start);
              const endHours = startHours + m.duration;
              const isTimePassed = isTodayCheck && endHours < currentHour;
              const isOngoing = isTodayCheck && currentHour >= startHours && currentHour < endHours;
              
              // Determine styling based on break type
              const breakStyles = {
                lunch: 'bg-gradient-to-r from-amber-100/90 to-amber-50/90 dark:from-amber-900/40 dark:to-amber-800/40 border-2 border-amber-300/50 dark:border-amber-700/50 text-amber-900 dark:text-amber-100',
                coffee: 'bg-gradient-to-r from-purple-100/90 to-purple-50/90 dark:from-purple-900/40 dark:to-purple-800/40 border-2 border-purple-300/50 dark:border-purple-700/50 text-purple-900 dark:text-purple-100',
                pause: 'bg-gradient-to-r from-slate-100/90 to-slate-50/90 dark:from-slate-700/40 dark:to-slate-600/40 border-2 border-slate-300/50 dark:border-slate-600/50 text-slate-900 dark:text-slate-100',
                exercise: 'bg-gradient-to-r from-green-100/90 to-green-50/90 dark:from-green-900/40 dark:to-green-800/40 border-2 border-green-300/50 dark:border-green-700/50 text-green-900 dark:text-green-100'
              };
              
              return (
                <div
                  key={m.id}
                  draggable={true}
                  onDragStart={e => handleMeetingDragStart(e, m.id)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={e => handleTouchStart(e, 'meeting', m.id)}
                  className={`absolute left-0 right-0 rounded-lg shadow-lg transition-all group overflow-hidden hover:z-30 cursor-move hover:shadow-xl ${
                    isBreak 
                      ? breakStyles[m.breakType] || breakStyles.pause
                      : 'bg-slate-800 dark:bg-slate-700 text-white'
                  } ${
                    conflict.conflict ? 'ring-2 ring-red-500' : ''
                  } ${isDragging ? 'opacity-50 scale-95' : ''} ${
                    m.duration <= 0.5 ? 'p-1.5 sm:p-2' : m.duration < 1 ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4'
                  }`}
                  title={isTimePassed ? "Meeting time has passed - Drag to reschedule" : isOngoing ? "Meeting in progress - Drag to reschedule" : "Meeting - Drag to reschedule"}
                  style={{
                    top: `${getEventTop(m.start)}px`,
                    height: `${getEventHeight(m.duration)}px`,
                    minHeight: '60px',
                    borderLeft: `4px solid ${conflict.conflict ? '#ef4444' : (isBreak ? breakColor : colorToHex(project.color))}`,
                  }}
                >
                  {m.duration <= 0.5 ? (
                    // Compact layout for 30-minute meetings
                    <div className="relative flex items-center gap-2 h-full">
                      {!isBreak && <Users size={12} className={`${isBreak ? 'text-amber-700 dark:text-amber-300' : 'text-slate-300'} flex-shrink-0`} />}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate text-xs leading-tight ${isBreak ? 'text-amber-900 dark:text-amber-100' : 'text-white'}`}>{m.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} className={isBreak ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400'} />
                          <span className={`font-medium text-[10px] tabular-nums ${isBreak ? 'text-amber-800 dark:text-amber-200' : 'text-slate-300'}`}>
                            {m.start} - {hoursToTime(timeToHours(m.start) + m.duration)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditMeeting(m);
                          }}
                          className={`p-1 rounded transition-colors ${isBreak ? 'hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-300' : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'}`}
                          title="Edit meeting"
                        >
                          <Edit2 size={12}/>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMeetings(meetings.filter(x => x.id !== m.id));
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                          title="Delete meeting"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Full layout for longer meetings
                    <div className="relative flex flex-col justify-between h-full gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {!isBreak && <Users size={14} className={`${isBreak ? 'text-amber-700 dark:text-amber-300' : 'text-slate-300'} flex-shrink-0`} />}
                          <p className={`font-semibold truncate flex-1 min-w-0 leading-tight ${m.duration < 1 ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} ${isBreak ? 'text-amber-900 dark:text-amber-100' : 'text-white'}`}>{m.title}</p>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditMeeting(m);
                            }}
                            className={`p-1.5 rounded transition-colors ${isBreak ? 'hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-300' : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'}`}
                            title="Edit meeting"
                          >
                            <Edit2 size={14}/>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMeetings(meetings.filter(x => x.id !== m.id));
                            }}
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                            title="Delete meeting"
                          >
                            <X size={14}/>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className={isBreak ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400'} />
                          <span className={`font-medium tabular-nums ${isBreak ? 'text-amber-800 dark:text-amber-200' : 'text-slate-300'}`}>
                            {m.start} - {hoursToTime(timeToHours(m.start) + m.duration)}
                          </span>
                        </div>
                        {!isBreak && (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${project.color}`}></div>
                            <span className="text-slate-300 font-medium truncate max-w-[100px]">
                              {project.name}
                            </span>
                          </div>
                        )}
                        {conflict.conflict && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 rounded">
                            <AlertTriangle size={12} className="text-red-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Scheduled Tasks */}
            {filteredSchedule.map((item, index) => {
              const task = tasks.find(t => t.id === item.taskId);
              if (!task) return null;
              
              const project = getProject(task.projectId);
              const conflict = checkConflict(item.start, item.duration, item.taskId);
              const isDragging = draggedScheduleItem === item.taskId;
              
              const isTodayCheck = selectedDateStr === todayStr;
              const startHours = timeToHours(item.start);
              const endHours = startHours + item.duration;
              const isTimePassed = isTodayCheck && endHours < currentHour;
              const isOngoing = isTodayCheck && currentHour >= startHours && currentHour < endHours;
              
              const uniqueKey = item.id || `schedule-${item.taskId}-${item.start}-${item.date || formatDateForStorage(selectedDate)}-${index}`;
              
              return (
                <div
                  key={uniqueKey}
                  draggable={true}
                  onDragStart={e => handleScheduleItemDragStart(e, item.taskId)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={e => handleTouchStart(e, 'schedule', item.taskId)}
                  className={`absolute left-0 right-0 rounded-lg bg-white dark:bg-slate-700 shadow-md border transition-all group hover:shadow-lg hover:z-30 cursor-move ${
                    conflict.conflict ? 'border-red-300 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-900/50' : 'border-slate-200 dark:border-slate-600'
                  } ${isDragging ? 'opacity-50 scale-95' : ''} ${
                    item.duration <= 0.5 ? 'p-1.5 sm:p-2' : item.duration < 1 ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4'
                  }`}
                  title={isTimePassed ? "Task time has passed - Drag to reschedule" : isOngoing ? "Task in progress - Drag to reschedule" : "Task - Drag to reschedule"}
                  style={{
                    top: `${getEventTop(item.start)}px`,
                    height: `${getEventHeight(item.duration)}px`,
                    minHeight: '60px',
                    borderLeft: `4px solid ${colorToHex(project.color)}`,
                  }}
                >
                  {item.duration <= 0.5 ? (
                    // Compact layout for 30-minute tasks
                    <div className="relative flex items-center gap-2 h-full">
                      {task.sticker ? (
                        <span className="text-sm flex-shrink-0" title="Task sticker">{task.sticker}</span>
                      ) : (
                        <CheckSquare size={12} className={`flex-shrink-0 ${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'} truncate text-xs leading-tight`}>{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} className={isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} />
                          <span className={`font-medium text-[10px] tabular-nums ${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                            {item.start} - {hoursToTime(timeToHours(item.start) + item.duration)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSchedule(schedule.filter(s => s.taskId !== item.taskId))}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove from schedule"
                      >
                        <X size={12}/>
                      </button>
                    </div>
                  ) : (
                    // Full layout for longer tasks
                    <div className="relative flex flex-col justify-between h-full gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {task.sticker ? (
                            <span className="text-base sm:text-lg flex-shrink-0" title="Task sticker">{task.sticker}</span>
                          ) : (
                            <CheckSquare size={12} className={`sm:w-[14px] sm:h-[14px] flex-shrink-0 ${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`} />
                          )}
                          <p className={`font-semibold ${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'} truncate flex-1 min-w-0 leading-tight ${item.duration < 1 ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>{task.title}</p>
                        </div>
                        <button
                          onClick={() => setSchedule(schedule.filter(s => s.taskId !== item.taskId))}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                          title="Remove from schedule"
                        >
                          <X size={14}/>
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className={isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} />
                          <span className={`font-medium tabular-nums ${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                            {item.start} - {hoursToTime(timeToHours(item.start) + item.duration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${project.color}`}></div>
                          <span className={`font-medium truncate max-w-[100px] ${isTimePassed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                            {project.name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${isTimePassed ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' : getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        {conflict.conflict && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">
                            <AlertTriangle size={12} className="text-red-500 dark:text-red-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Break Time Picker Modal */}
      {showBreakTimePicker && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-3 sm:p-4 animate-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 animate-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedBreakType === 'lunch' && '🍽️ Lunch Break'}
                {selectedBreakType === 'coffee' && '☕ Coffee Break'}
                {selectedBreakType === 'pause' && '⏸️ Pause'}
                {selectedBreakType === 'exercise' && '💪 Exercise'}
              </h2>
              <button
                onClick={() => setShowBreakTimePicker(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <TimePicker
                  value={breakStartTime}
                  onChange={setBreakStartTime}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Duration (hours) <span className="text-red-500">*</span>
                </label>
                <select
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseFloat(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value={0.5}>30 minutes</option>
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1.5 hours</option>
                  <option value={2}>2 hours</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBreakTimePicker(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addQuickBreak(selectedBreakType, breakStartTime, breakDuration)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/30"
                >
                  Add Break
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
