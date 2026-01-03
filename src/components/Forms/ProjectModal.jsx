import React from 'react';
import { X, Edit2 } from 'lucide-react';

export const ProjectModal = ({
  isOpen,
  onClose,
  projects,
  editingProject,
  editProjectName,
  editProjectColor,
  newProjectName,
  newProjectColor,
  onNameChange,
  onColorChange,
  onSave,
  onCancel,
  onDelete,
  tasks,
  onEditProject
}) => {
  if (!isOpen) return null;

  const isEditing = editingProject !== null;
  const currentName = isEditing ? editProjectName : newProjectName;
  const currentColor = isEditing ? editProjectColor : newProjectColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Project Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Name
            </label>
            <input
              value={currentName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter project name"
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-yellow-500', 'bg-cyan-500'].map(color => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`w-10 h-10 rounded-full transition-all hover:scale-110 ${color} ${
                    currentColor === color
                      ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110'
                      : ''
                  }`}
                  title={color.replace('bg-', '').replace('-500', '')}
                />
              ))}
            </div>
          </div>

          {/* Existing Projects List */}
          {!isEditing && projects.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Existing Projects
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projects.map(project => {
                  const projectTaskCount = tasks.filter(t => t.projectId === project.id).length;
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{project.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {projectTaskCount} task{projectTaskCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (onEditProject) {
                            onEditProject(project);
                          }
                        }}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Edit project"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Task count when editing */}
          {isEditing && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                This project is used by {tasks.filter(t => t.projectId === editingProject).length} task(s)
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {isEditing && (
              <button
                onClick={() => {
                  const taskCount = tasks.filter(t => t.projectId === editingProject).length;
                  if (taskCount > 0) {
                    if (!window.confirm(`This project has ${taskCount} task(s). Delete anyway? Tasks will be moved to "No Project".`)) {
                      return;
                    }
                  }
                  onDelete(editingProject);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Delete
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
