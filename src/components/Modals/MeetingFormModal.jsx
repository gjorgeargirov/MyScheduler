import React from 'react';
import { X } from 'lucide-react';
import TimePicker from '../TimePicker';

const MeetingFormModal = ({
  show,
  onClose,
  onSubmit,
  projects,
  editingMeeting,
  editingMeetingData,
  // Form state
  newMeetingTitle,
  setNewMeetingTitle,
  newMeetingStart,
  setNewMeetingStart,
  newMeetingEnd,
  setNewMeetingEnd,
  newMeetingProject,
  setNewMeetingProject,
  newMeetingRepeat,
  setNewMeetingRepeat,
  newMeetingRepeatDays,
  setNewMeetingRepeatDays,
  editMeetingTitle,
  setEditMeetingTitle,
  editMeetingStart,
  setEditMeetingStart,
  editMeetingEnd,
  setEditMeetingEnd,
  editMeetingProject,
  setEditMeetingProject
}) => {
  const isBreak = editingMeetingData?.isBreak || false;
  if (!show) return null;

  const handleClose = () => {
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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-3 sm:p-4 animate-in">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/40 dark:shadow-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 p-4 sm:p-6 lg:p-7 scale-in ring-2 ring-blue-500/20 dark:ring-blue-400/20 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-blue-50/50 via-cyan-50/50 to-teal-50/50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20 -m-7 mb-0 p-7 rounded-t-3xl">
          <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-400 bg-clip-text text-transparent">
            {editingMeeting ? (isBreak ? 'Edit Break' : 'Edit Meeting') : 'Add Event'}
          </h3>
          <button onClick={handleClose} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110 active:scale-95">
            <X size={22} />
          </button>
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

          {!isBreak && (
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
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Start <span className="text-red-500">*</span>
              </label>
              <TimePicker
                value={editingMeeting ? editMeetingStart : newMeetingStart}
                onChange={editingMeeting ? setEditMeetingStart : setNewMeetingStart}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                End <span className="text-red-500">*</span>
              </label>
              <TimePicker
                value={editingMeeting ? editMeetingEnd : newMeetingEnd}
                onChange={editingMeeting ? setEditMeetingEnd : setNewMeetingEnd}
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
              {editingMeeting ? (isBreak ? 'Update Break' : 'Update Meeting') : 'Save Meeting'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingFormModal;
