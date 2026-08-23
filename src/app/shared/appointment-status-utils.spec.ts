import { appointmentStatusClass } from './appointment-status-utils';

describe('appointment-status-utils', () => {
  describe('appointmentStatusClass', () => {
    it('returns the cancelled class for CANCELLED', () => {
      expect(appointmentStatusClass('CANCELLED')).toBe('app-status-cancelled');
    });

    it('returns the completed class for COMPLETED', () => {
      expect(appointmentStatusClass('COMPLETED')).toBe('app-status-completed');
    });

    it('returns no class for SCHEDULED, leaving the normal text color', () => {
      expect(appointmentStatusClass('SCHEDULED')).toBe('');
    });
  });
});
