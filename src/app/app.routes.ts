import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./core/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'clinics',
    canMatch: [roleGuard('SYSTEM_ADMIN')],
    loadComponent: () =>
      import('./onboarding/clinic-onboarding/clinic-list.component').then((m) => m.ClinicListComponent),
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
    path: 'doctors',
    canMatch: [roleGuard('CLINIC_ADMIN')],
    loadComponent: () =>
      import('./onboarding/doctor-onboarding/doctor-list.component').then((m) => m.DoctorListComponent),
  },
  {
    path: 'doctors/new',
    canMatch: [roleGuard('CLINIC_ADMIN')],
    loadComponent: () =>
      import('./onboarding/doctor-onboarding/doctor-onboarding-form.component').then(
        (m) => m.DoctorOnboardingFormComponent
      ),
  },
  {
    path: 'patients',
    canMatch: [roleGuard('CLINIC_ADMIN')],
    loadComponent: () =>
      import('./onboarding/patient-onboarding/patient-list.component').then((m) => m.PatientListComponent),
  },
  {
    path: 'patients/new',
    canMatch: [roleGuard('CLINIC_ADMIN')],
    loadComponent: () =>
      import('./onboarding/patient-onboarding/patient-onboarding-form.component').then(
        (m) => m.PatientOnboardingFormComponent
      ),
  },
  {
    path: 'my-clinics',
    canMatch: [roleGuard('PATIENT')],
    loadComponent: () =>
      import('./onboarding/patient-onboarding/my-clinics.component').then((m) => m.MyClinicsComponent),
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
];
