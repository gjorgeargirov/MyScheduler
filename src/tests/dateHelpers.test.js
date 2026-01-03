import { describe, it, expect } from 'vitest';
import {
  formatDateForStorage,
  formatDate,
  isSameDay,
  isToday,
  timeToHours,
  hoursToTime,
  isOverdue,
  isDueSoon
} from '../utils/dateHelpers';

describe('dateHelpers', () => {
  describe('formatDateForStorage', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15');
      expect(formatDateForStorage(date)).toBe('2024-01-15');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2024-01-05');
      expect(formatDateForStorage(date)).toBe('2024-01-05');
    });
  });

  describe('timeToHours', () => {
    it('should convert time string to hours', () => {
      expect(timeToHours('09:00')).toBe(9);
      expect(timeToHours('09:30')).toBe(9.5);
      expect(timeToHours('14:15')).toBe(14.25);
    });
  });

  describe('hoursToTime', () => {
    it('should convert hours to time string', () => {
      expect(hoursToTime(9)).toBe('09:00');
      expect(hoursToTime(9.5)).toBe('09:30');
      expect(hoursToTime(14.25)).toBe('14:15');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-15');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isOverdue(yesterday.toISOString())).toBe(true);
    });

    it('should return false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isOverdue(tomorrow.toISOString())).toBe(false);
    });

    it('should return false for null', () => {
      expect(isOverdue(null)).toBe(false);
    });
  });

  describe('isDueSoon', () => {
    it('should return true for dates within 3 days', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isDueSoon(tomorrow.toISOString())).toBe(true);
    });

    it('should return false for dates more than 3 days away', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);
      expect(isDueSoon(nextWeek.toISOString())).toBe(false);
    });
  });
});
