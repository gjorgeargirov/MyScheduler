import React from 'react';
import {
  Folder,
  Plus,
  Search,
  Filter,
  X,
  Clock,
  Calendar,
  FileText,
  Edit2,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { isOverdue, isDueSoon } from '../../utils/dateHelpers';

const TasksPage = ({
  activePage,
  setActivePage,
  tasks,
  projects,
  filteredTasks,
  columns,
  searchQuery,
  setSearchQuery,
  filterProject,
  setFilterProject,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  showFilters,
  setShowFilters,
  openProjectModal,
  setNewTaskProject,
  setShowTaskForm,
  editingTask,
  editTaskTitle,
  setEditTaskTitle,
  editTaskDuration,
  setEditTaskDuration,
  editTaskPriority,
  setEditTaskPriority,
  editTaskProject,
  setEditTaskProject,
  editTaskDueDate,
  setEditTaskDueDate,
  editTaskSticker,
  setEditTaskSticker,
  showEditStickerPicker,
  setShowEditStickerPicker,
  popularEmojis,
  saveEditTask,
  cancelEditTask,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  handleTouchStart,
  draggedTaskId,
  dragOverColumn,
  getProject,
  getPriorityColor,
  openTaskDetails,
  startEditTask,
  deleteTask
}) => {
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
          <Calendar size={16} />
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
            setNewTaskProject(projects.length > 0 ? projects[0].id : 1);
            setShowTaskForm(true);
          }}
          className="flex-shrink-0 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add Task</span>
        </button>
        <button
          onClick={() => openProjectModal()}
          className="flex-shrink-0 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
        >
          <Folder size={14} />
          <span>Projects</span>
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
              <Calendar size={17} className={activePage === 'calendar' ? 'drop-shadow-sm' : ''} />
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
              onClick={() => {
                setNewTaskProject(projects.length > 0 ? projects[0].id : 1);
                setShowTaskForm(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={14} />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => openProjectModal()}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <Folder size={14} />
              <span>Projects</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="space-y-4 sm:space-y-6">
      {/* Tasks Header - Compact Single Row */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 p-3 sm:p-4 lg:p-5 ring-1 ring-slate-200/40 dark:ring-slate-700/40">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Title Section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20">
              <Folder className="text-white w-5 h-5 drop-shadow-sm" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-400 bg-clip-text text-transparent leading-tight">Tasks</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                {tasks.length} total
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-700 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-slate-200 dark:border-slate-600 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-700 transition-all min-w-0 w-full sm:w-auto">
            <Search size={16} className="sm:w-[18px] sm:h-[18px] text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Projects Quick Filter */}
          {projects.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:inline">Projects:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFilterProject('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterProject === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  All
                </button>
                {projects.map(project => {
                  const taskCount = tasks.filter(t => t.projectId === project.id).length;
                  return (
                    <button
                      key={project.id}
                      onClick={() => setFilterProject(project.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        filterProject === project.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${project.color}`}></div>
                      <span className="hidden sm:inline">{project.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        filterProject === project.id
                          ? 'bg-white/20'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {taskCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 min-w-[44px] min-h-[44px] ${
              showFilters 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-md hover:shadow-lg'
            }`}
          >
            <Filter size={16} className="sm:w-[14px] sm:h-[14px]" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-full sm:w-auto">Filter by:</label>
                <select
                  value={filterProject} 
                  onChange={e => setFilterProject(e.target.value)}
                  className="flex-1 min-w-[140px] text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-lg outline-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-500 dark:focus:border-slate-400 transition-all text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  value={filterPriority} 
                  onChange={e => setFilterPriority(e.target.value)}
                  className="flex-1 min-w-[140px] text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-lg outline-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-500 dark:focus:border-slate-400 transition-all text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  className="flex-1 min-w-[140px] text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-lg outline-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-500 dark:focus:border-slate-400 transition-all text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="backlog">Backlog</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              {(filterProject !== 'all' || filterPriority !== 'all' || filterStatus !== 'all' || searchQuery) && (
                <button 
                  onClick={() => {
                    setFilterProject('all');
                    setFilterPriority('all');
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 px-5 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-all border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

        {/* Kanban Columns */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 ring-1 ring-slate-200/40 dark:ring-slate-700/40">
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {columns.map(col => {
                const taskCount = filteredTasks.filter(t => t.status === col.id).length;
                const columnIcons = {
                  'backlog': Folder,
                  'in-progress': PlayCircle,
                  'done': CheckCircle2
                };
                const Icon = columnIcons[col.id] || Folder;
                
                return (
                  <div 
                    key={col.id}
                    data-column-id={col.id}
                    onDragOver={e => handleDragOver(e, col.id)}
                    onDrop={e => handleDrop(e, col.id)}
                    className={`rounded-2xl p-5 min-h-[400px] transition-all duration-300 border-2 ${
                      dragOverColumn === col.id 
                        ? 'ring-4 ring-blue-400 dark:ring-blue-500 ring-inset bg-blue-50/50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-2xl' 
                        : 'border-slate-200/40 dark:border-slate-700/40'
                    } ${col.bg} backdrop-blur-sm`}
                  >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          col.id === 'backlog' ? 'bg-slate-100 dark:bg-slate-700' :
                          col.id === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <Icon size={18} className={
                            col.id === 'backlog' ? 'text-slate-600 dark:text-slate-300' :
                            col.id === 'in-progress' ? 'text-blue-600 dark:text-blue-400' :
                            'text-green-600 dark:text-green-400'
                          } />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{col.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Drag tasks here</p>
                        </div>
                      </div>
                      <span className={`text-sm px-3 py-1.5 rounded-full font-bold min-w-[2rem] text-center ${
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
                              className="w-full px-2 py-1 mb-2 text-xs border border-slate-200 dark:border-slate-600 rounded outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            placeholder="Due date (optional)"
                          />
                          <div className="mb-2">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sticker</label>
                            <div className="relative">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowEditStickerPicker(!showEditStickerPicker)}
                                  className="flex items-center justify-center w-10 h-8 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-lg"
                                  title="Pick a sticker"
                                >
                                  {editTaskSticker || '😊'}
                                </button>
                                {editTaskSticker && (
                                  <button
                                    type="button"
                                    onClick={() => setEditTaskSticker('')}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    title="Remove sticker"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                              {showEditStickerPicker && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowEditStickerPicker(false)}
                                  ></div>
                                  <div className="absolute z-50 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto grid grid-cols-8 gap-1">
                                    {popularEmojis.map((emoji, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          setEditTaskSticker(emoji);
                                          setShowEditStickerPicker(false);
                                        }}
                                        className="p-1.5 text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                        title={`Select ${emoji}`}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
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
                        onTouchStart={e => handleTouchStart(e, 'task', task.id)}
                        className={`
                          group relative bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700
                          hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing
                          ${draggedTaskId === task.id ? 'opacity-50 scale-95' : ''}
                        `}
                      >
                        {/* Colored left border with gradient */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${project.color} opacity-80`}></div>
                        
                        <div className="relative pl-4">
                          {/* Title Row */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {task.sticker && (
                                <span className="text-lg flex-shrink-0" title="Task sticker">{task.sticker}</span>
                              )}
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug flex-1 line-clamp-2">{task.title}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => startEditTask(task)}
                                className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Edit task"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                title="Delete task"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Tags Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                              <div className={`w-2 h-2 rounded-full ${project.color}`}></div>
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                {project.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400">
                              <Clock size={11} />
                              <span className="text-[11px] font-medium">{task.duration}h</span>
                            </div>
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border ${
                                isOverdue(task.dueDate) 
                                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' 
                                  : isDueSoon(task.dueDate)
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              }`}>
                                <Calendar size={11} />
                                <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
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
      </div>
    </div>
  );
};

export default TasksPage;
