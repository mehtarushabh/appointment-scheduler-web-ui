import { AppointmentState } from './models';

/** CSS class for an appointment's status word (feature 014) — red for CANCELLED, green for COMPLETED, unchanged for SCHEDULED. */
export function appointmentStatusClass(state: AppointmentState): string {
  switch (state) {
    case 'CANCELLED':
      return 'app-status-cancelled';
    case 'COMPLETED':
      return 'app-status-completed';
    default:
      return '';
  }
}
