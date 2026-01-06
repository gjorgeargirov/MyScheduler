import React, { useState, useEffect } from 'react';
import { X, Clock, Save } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, workdayStart, workdayEnd, onSave }) => {
  const [startHour, setStartHour] = useState(workdayStart);
  const [endHour, setEndHour] = useState(workdayEnd);

  useEffect(() => {
    if (isOpen) {
      setStartHour(workdayStart);
      setEndHour(workdayEnd);
    }
  }, [isOpen, workdayStart, workdayEnd]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (startHour >= endHour) {
      alert('Start hour must be before end hour');
      return;
    }
    if (startHour < 0 || startHour > 23 || endHour < 1 || endHour > 24) {
      alert('Please enter valid hours (0-24)');
      return;
    }
    onSave(startHour, endHour);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/40 dark:shadow-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 w-full max-w-md scale-in ring-2 ring-blue-500/20 dark:ring-blue-400/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 lg:p-7 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-blue-50/50 via-cyan-50/50 to-teal-50/50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20 rounded-t-2xl sm:rounded-t-3xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20">
              <Clock className="text-white w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-400 bg-clip-text text-transparent">
              Working Hours
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Set your preferred working hours. The calendar will display time slots within this range.
          </p>

          <div className="space-y-4">
            {/* Start Hour */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                Start Hour
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="w-24 h-12 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-semibold text-center focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all"
                />
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">:00</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                  ({startHour.toString().padStart(2, '0')}:00 - {startHour === 23 ? '00:00' : (startHour + 1).toString().padStart(2, '0') + ':00'})
                </span>
              </div>
            </div>

            {/* End Hour */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                End Hour
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-24 h-12 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-semibold text-center focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all"
                />
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">:00</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                  ({endHour === 24 ? '00:00' : endHour.toString().padStart(2, '0')}:00)
                </span>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Preview</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Your calendar will show time slots from <span className="font-bold text-blue-600 dark:text-blue-400">{startHour.toString().padStart(2, '0')}:00</span> to <span className="font-bold text-blue-600 dark:text-blue-400">{endHour === 24 ? '00:00' : endHour.toString().padStart(2, '0') + ':00'}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total working hours: {endHour > startHour ? endHour - startHour : (24 - startHour + endHour)} hours
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 lg:p-7 border-t border-slate-200/60 dark:border-slate-700/60 sticky bottom-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg sm:rounded-xl text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors min-w-[80px] min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white rounded-lg sm:rounded-xl text-sm font-bold transition-all duration-300 shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 flex items-center gap-2 min-h-[44px]"
          >
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
