/**
 * Export all app data to JSON
 */
export const exportData = (projects, tasks, meetings, schedule, chatMessages, userPreferences) => {
  const data = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    projects,
    tasks,
    meetings,
    schedule,
    chatMessages,
    userPreferences
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `focusboard-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import data from JSON file
 */
export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!data || typeof data !== 'object') {
          reject(new Error('Invalid file format'));
          return;
        }

        // Return imported data with defaults for missing fields
        resolve({
          projects: data.projects || [],
          tasks: data.tasks || [],
          meetings: data.meetings || [],
          schedule: data.schedule || [],
          chatMessages: data.chatMessages || [],
          userPreferences: data.userPreferences || ''
        });
      } catch (error) {
        reject(new Error('Failed to parse JSON file: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};
