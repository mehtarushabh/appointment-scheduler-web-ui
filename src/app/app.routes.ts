import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard, rootRedirectGuard } from './core/role.guard';

export const routes: Routes = [
  {
    // Wraps every route — including login — in the persistent title bar shell (FR-001, FR-014,
    // research.md #4/#8). The shell itself no longer gates access; each child below enforces its
    // own guard, so an unauthenticated visitor still sees the (reduced) title bar on /login.
    path: '',
    loadComponent: () => import('./core/shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      // rootRedirectGuard always returns a UrlTree (never `true`), so `children` here is never
      // actually rendered — it's only present because Angular's route validator requires one of
      // component/loadComponent/redirectTo/children/loadChildren on every route.
      { path: '', pathMatch: 'full', canMatch: [rootRedirectGuard], children: [] },
      {
        path: 'login',
        canMatch: [guestGuard],
        loadComponent: () => import('./core/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'home',
        canMatch: [roleGuard('SYSTEM_ADMIN')],
        loadComponent: () => import('./home/system-admin-home/system-admin-home.component').then((m) => m.SystemAdminHomeComponent),
      },
      {
        path: 'home',
        canMatch: [roleGuard('CLINIC_ADMIN')],
        loadComponent: () => import('./home/clinic-admin-home/clinic-admin-home.component').then((m) => m.ClinicAdminHomeComponent),
      },
      {
        path: 'home',
        canMatch: [roleGuard('DOCTOR')],
        loadComponent: () => import('./home/doctor-home/doctor-home.component').then((m) => m.DoctorHomeComponent),
      },
      {
        path: 'home',
        canMatch: [roleGuard('PATIENT')],
        loadComponent: () => import('./home/patient-home/patient-home.component').then((m) => m.PatientHomeComponent),
      },
      {
        path: 'doctors',
        canMatch: [roleGuard('CLINIC_ADMIN')],
        loadComponent: () => import('./onboarding/doctor-onboarding/doctor-list.component').then((m) => m.DoctorListComponent),
      },
      {
        path: 'patients',
        canMatch: [roleGuard('CLINIC_ADMIN')],
        loadComponent: () => import('./onboarding/patient-onboarding/patient-list.component').then((m) => m.PatientListComponent),
      },
      {
        path: 'my-clinics',
        canMatch: [roleGuard('PATIENT')],
        loadComponent: () => import('./onboarding/patient-onboarding/my-clinics.component').then((m) => m.MyClinicsComponent),
      },
      {
        path: 'clinics/new',
        canMatch: [roleGuard('SYSTEM_ADMIN')],
        loadComponent: () =>
          import('./onboarding/clinic-onboarding/clinic-onboarding-form.component').then(
            (m) => m.ClinicOnboardingFormComponent
          ),
      },
      {
        path: 'clinic-settings',
        canMatch: [roleGuard('CLINIC_ADMIN')],
        loadComponent: () =>
          import('./onboarding/clinic-onboarding/clinic-settings/clinic-settings.component').then(
            (m) => m.ClinicSettingsComponent
          ),
      },
      {
        path: 'my-schedule',
        canMatch: [roleGuard('DOCTOR')],
        loadComponent: () =>
          import('./scheduling/doctor-schedule/doctor-schedule.component').then((m) => m.DoctorScheduleComponent),
      },
      {
        path: 'clinic-admins/new',
        canMatch: [roleGuard('CLINIC_ADMIN')],
        loadComponent: () =>
          import('./onboarding/clinic-admin-onboarding/clinic-admin-onboarding-form.component').then(
            (m) => m.ClinicAdminOnboardingFormComponent
          ),
      },
      {
        path: 'change-password',
        canMatch: [authGuard],
        loadComponent: () =>
          import('./core/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
      },
      {
        path: 'appointments',
        canMatch: [roleGuard('CLINIC_ADMIN')],
        loadComponent: () =>
          import('./scheduling/appointments/appointments-list.component').then((m) => m.AppointmentsListComponent),
      },
      {
        path: 'appointments',
        canMatch: [roleGuard('DOCTOR')],
        loadComponent: () =>
          import('./scheduling/appointments/appointments-list.component').then((m) => m.AppointmentsListComponent),
      },
      {
        // A Patient never manages appointments directly here — cancellation isn't available to
        // Patients at all (FR-025, spec Assumptions); this placeholder stays as-is.
        path: 'appointments',
        canMatch: [roleGuard('PATIENT')],
        loadComponent: () => import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
        data: { featureName: 'Appointments' },
      },
      {
        path: 'schedule-appointment',
        canMatch: [roleGuard('PATIENT')],
        loadComponent: () =>
          import('./scheduling/book-appointment/book-appointment.component').then((m) => m.BookAppointmentComponent),
      },
      {
        // A Doctor's own placeholder, kept distinct from the real Clinic-Admin-only `patients`
        // route above (research.md #6).
        path: 'doctor/patients',
        canMatch: [roleGuard('DOCTOR')],
        loadComponent: () => import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
        data: { featureName: 'Patients' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
