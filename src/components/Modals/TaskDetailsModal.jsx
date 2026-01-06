import React from 'react';
import { X } from 'lucide-react';

const TaskDetailsModal = ({ task, onClose, onSave, taskNotes, setTaskNotes, taskDueDate, setTaskDueDate, getProject, getPriorityColor }) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/30 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 w-full max-w-lg scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Task Details</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Title</label>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-md">{task.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration</label>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-md">{task.duration}h</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
              <span className={`inline-block text-xs px-2 py-1.5 rounded-md border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Project</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-md">
              <div className={`w-3 h-3 rounded-full ${getProject(task.projectId).color}`}></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">{getProject(task.projectId).name}</span>
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
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 hover:from-blue-700 hover:to-cyan-600 dark:hover:from-blue-600 dark:hover:to-cyan-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 hover:shadow-xl hover:scale-105"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
