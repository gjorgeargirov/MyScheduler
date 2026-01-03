import React, { useRef } from 'react';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { exportData, importData } from '../../utils/exportImport';

export const ExportImport = ({ 
  projects, 
  tasks, 
  meetings, 
  schedule, 
  chatMessages, 
  userPreferences,
  onImport,
  showToast 
}) => {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    try {
      exportData(projects, tasks, meetings, schedule, chatMessages, userPreferences);
      showToast('Data exported successfully!', 'success');
    } catch (error) {
      showToast('Export failed: ' + error.message, 'error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Please select a JSON file', 'error');
      return;
    }

    try {
      const importedData = await importData(file);
      onImport(importedData);
      showToast('Data imported successfully!', 'success');
    } catch (error) {
      showToast('Import failed: ' + error.message, 'error');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-sm font-medium"
        title="Export all data"
      >
        <Download size={15} />
        <span className="hidden sm:inline">Export</span>
      </button>
      <label className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-sm font-medium cursor-pointer">
        <Upload size={15} />
        <span className="hidden sm:inline">Import</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  );
};
