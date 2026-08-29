import { UserRole } from '../core/auth.service';

export interface NavLink {
  label: string;
  path: string;
}

export const SCHEDULE_APPOINTMENT_PATH = '/schedule-appointment';

/**
 * FR-005: nav links after the title, scoped to the logged-in user's role. Moved here from
 * app-shell.component.ts (026-user-preferences, research.md #4) so it has a second real consumer —
 * the Preferences section's "Default landing page" dropdown (shared/preferences/preferences-section)
 * — without either place declaring its own copy.
 */
export const ROLE_NAV_LINKS: Record<UserRole, NavLink[]> = {
  SYSTEM_ADMIN: [{ label: 'Register new clinic', path: '/clinics/new' }],
  CLINIC_ADMIN: [
    { label: 'Clinic settings', path: '/clinic-settings' },
    { label: 'Doctors', path: '/doctors' },
    { label: 'Patients', path: '/patients' },
    { label: 'Appointments', path: '/appointments' },
  ],
  DOCTOR: [
    { label: 'My schedule', path: '/my-schedule' },
    { label: 'Patients', path: '/doctor/patients' },
    { label: 'Appointments', path: '/appointments' },
  ],
  PATIENT: [
    { label: 'Schedule appointment', path: SCHEDULE_APPOINTMENT_PATH },
    { label: 'Appointments', path: '/appointments' },
  ],
};
