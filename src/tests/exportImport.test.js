import { describe, it, expect, vi } from 'vitest';
import { exportData, importData } from '../utils/exportImport';

describe('exportImport', () => {
  const mockData = {
    projects: [{ id: 1, name: 'Test Project', color: 'bg-blue-500' }],
    tasks: [{ id: 1, title: 'Test Task', status: 'backlog' }],
    meetings: [{ id: 1, title: 'Test Meeting', start: '09:00' }],
    schedule: [{ id: 1, taskId: 1, start: '10:00' }],
    chatMessages: [{ role: 'user', content: 'test' }],
    userPreferences: 'test preferences'
  };

  describe('exportData', () => {
    it('should create a downloadable file', () => {
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const mockBlob = { type: '' };
      const mockURL = { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() };

      global.URL.createObjectURL = mockURL.createObjectURL;
      global.URL.revokeObjectURL = mockURL.revokeObjectURL;
      global.Blob = vi.fn(() => mockBlob);
      document.createElement = vi.fn(() => mockLink);
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      exportData(
        mockData.projects,
        mockData.tasks,
        mockData.meetings,
        mockData.schedule,
        mockData.chatMessages,
        mockData.userPreferences
      );

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockURL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('importData', () => {
    it('should parse valid JSON file', async () => {
      const file = new File(
        [JSON.stringify(mockData)],
        'test.json',
        { type: 'application/json' }
      );

      const result = await importData(file);
      expect(result.projects).toEqual(mockData.projects);
      expect(result.tasks).toEqual(mockData.tasks);
    });

    it('should reject invalid JSON', async () => {
      const file = new File(['invalid json'], 'test.json', { type: 'application/json' });

      await expect(importData(file)).rejects.toThrow();
    });

    it('should handle missing fields with defaults', async () => {
      const incompleteData = { projects: [] };
      const file = new File(
        [JSON.stringify(incompleteData)],
        'test.json',
        { type: 'application/json' }
      );

      const result = await importData(file);
      expect(result.tasks).toEqual([]);
      expect(result.meetings).toEqual([]);
      expect(result.schedule).toEqual([]);
    });
  });
});
