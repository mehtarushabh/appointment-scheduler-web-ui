import { isPastDue, isToday, isWithinNextDays } from './date-utils';

describe('date-utils', () => {
  beforeEach(() => {
    // Fixed local "now" so isToday()/isWithinNextDays() are deterministic (feature 010).
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 22, 15, 30, 0)); // 2026-08-22, mid-afternoon
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isToday', () => {
    it('is true for today', () => {
      expect(isToday('2026-08-22')).toBe(true);
    });

    it('is false for yesterday', () => {
      expect(isToday('2026-08-21')).toBe(false);
    });

    it('is false for tomorrow', () => {
      expect(isToday('2026-08-23')).toBe(false);
    });
  });

  describe('isWithinNextDays', () => {
    it('includes today', () => {
      expect(isWithinNextDays('2026-08-22', 7)).toBe(true);
    });

    it('includes the inclusive boundary (days - 1 days from today)', () => {
      expect(isWithinNextDays('2026-08-28', 7)).toBe(true); // 6 days after 08-22
    });

    it('excludes the first day past the window', () => {
      expect(isWithinNextDays('2026-08-29', 7)).toBe(false); // 7 days after 08-22
    });

    it('excludes a past date', () => {
      expect(isWithinNextDays('2026-08-21', 7)).toBe(false);
    });

    it('supports a 1-day window equivalent to isToday', () => {
      expect(isWithinNextDays('2026-08-22', 1)).toBe(true);
      expect(isWithinNextDays('2026-08-23', 1)).toBe(false);
    });
  });

  describe('isPastDue', () => {
    it('is true for a date before today', () => {
      expect(isPastDue('2026-08-21')).toBe(true);
    });

    it('is false for today', () => {
      expect(isPastDue('2026-08-22')).toBe(false);
    });

    it('is false for a future date', () => {
      expect(isPastDue('2026-08-23')).toBe(false);
    });
  });
});
