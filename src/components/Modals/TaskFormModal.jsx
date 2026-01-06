import React from 'react';
import { X } from 'lucide-react';

const TaskFormModal = ({
  show,
  onClose,
  onSubmit,
  projects,
  popularEmojis,
  // Form state
  newTaskTitle,
  setNewTaskTitle,
  newTaskDuration,
  setNewTaskDuration,
  newTaskPriority,
  setNewTaskPriority,
  newTaskProject,
  setNewTaskProject,
  newTaskNotes,
  setNewTaskNotes,
  newTaskDueDate,
  setNewTaskDueDate,
  newTaskSticker,
  setNewTaskSticker,
  showStickerPicker,
  setShowStickerPicker,
  taskFormErrors,
  setTaskFormErrors
}) => {
  if (!show) return null;

  const handleClose = () => {
    setNewTaskTitle('');
    setNewTaskDuration('1');
    setNewTaskPriority('medium');
    setNewTaskNotes('');
    setNewTaskDueDate('');
    setNewTaskSticker('');
    setShowStickerPicker(false);
    setTaskFormErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/90 backdrop-blur-lg p-3 sm:p-4 animate-in">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/40 dark:shadow-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 w-full max-w-lg scale-in ring-2 ring-blue-500/20 dark:ring-blue-400/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 lg:p-7 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-blue-50/50 via-cyan-50/50 to-teal-50/50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20 rounded-t-2xl sm:rounded-t-3xl sticky top-0 z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-400 bg-clip-text text-transparent">Create New Task</h2>
          <button 
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <X size={22} />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Task Title <span className="text-red-500 font-bold">*</span>
            </label>
            <input 
              value={newTaskTitle}
              onChange={e => {
                setNewTaskTitle(e.target.value);
                if (taskFormErrors.title) {
                  setTaskFormErrors(prev => ({ ...prev, title: '' }));
                }
              }}
              className={`w-full h-12 px-5 border-2 rounded-xl text-base focus:ring-4 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 font-medium ${
                taskFormErrors.title 
                  ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30 focus:border-red-500' 
                  : 'border-slate-300 dark:border-slate-600 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-400 dark:focus:border-slate-500'
              }`}
              placeholder="Enter a descriptive task title..."
              autoFocus
            />
            {taskFormErrors.title && (
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{taskFormErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Duration (hours) <span className="text-red-500 font-bold">*</span>
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
                className={`w-full h-12 px-4 border-2 rounded-xl text-base focus:ring-4 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium ${
                  taskFormErrors.duration 
                    ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30 focus:border-red-500' 
                    : 'border-slate-300 dark:border-slate-600 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-400 dark:focus:border-slate-500'
                }`}
                min="0.5" 
                step="0.5"
                placeholder="1.0"
              />
              {taskFormErrors.duration && (
                <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{taskFormErrors.duration}</p>
              )}
            </div>
            <div>
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Priority <span className="text-red-500 font-bold">*</span>
              </label>
              <select 
                value={newTaskPriority} 
                onChange={e => setNewTaskPriority(e.target.value)}
                className="w-full h-12 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-400 dark:focus:border-slate-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer font-medium"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Project <span className="text-red-500 font-bold">*</span>
            </label>
            <select 
              value={newTaskProject} 
              onChange={e => {
                setNewTaskProject(Number(e.target.value));
                if (taskFormErrors.project) {
                  setTaskFormErrors(prev => ({ ...prev, project: '' }));
                }
              }}
              className={`w-full h-12 px-4 border-2 rounded-xl text-base focus:ring-4 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer font-medium ${
                taskFormErrors.project 
                  ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30 focus:border-red-500' 
                  : 'border-slate-300 dark:border-slate-600 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-400 dark:focus:border-slate-500'
              }`}
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {taskFormErrors.project && (
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{taskFormErrors.project}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Due Date <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Optional)</span>
            </label>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={e => setNewTaskDueDate(e.target.value)}
              className="w-full h-12 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-400 dark:focus:border-slate-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sticker (Optional)
            </label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStickerPicker(!showStickerPicker)}
                  className="flex items-center justify-center w-12 h-10 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-2xl"
                  title="Pick a sticker"
                >
                  {newTaskSticker || '😊'}
                </button>
                {newTaskSticker && (
                  <button
                    type="button"
                    onClick={() => setNewTaskSticker('')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title="Remove sticker"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {showStickerPicker && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowStickerPicker(false)}
                  ></div>
                  <div className="absolute z-50 mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto grid grid-cols-10 gap-1">
                    {popularEmojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewTaskSticker(emoji);
                          setShowStickerPicker(false);
                        }}
                        className="p-2 text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
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

          <div>
            <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Notes <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Optional)</span>
            </label>
            <textarea
              value={newTaskNotes}
              onChange={e => setNewTaskNotes(e.target.value)}
              rows={5}
              className="w-full px-5 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-400 dark:focus:border-slate-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium leading-relaxed"
              placeholder="Add any additional details, context, or notes about this task..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;
