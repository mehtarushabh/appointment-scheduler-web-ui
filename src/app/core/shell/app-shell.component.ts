import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService, UserRole } from '../auth.service';

interface NavLink {
  label: string;
  path: string;
}

/** FR-005: nav links after the title, scoped to the logged-in user's role. */
const ROLE_NAV_LINKS: Record<UserRole, NavLink[]> = {
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
    { label: 'Schedule appointment', path: '/schedule-appointment' },
    { label: 'Appointments', path: '/appointments' },
  ],
};

/**
 * Persistent title bar + nav shell for every page, authenticated or not (FR-001, FR-014,
 * research.md #4/#8). Wraps every route via app.routes.ts; renders the full bar (nav + user menu)
 * once logged in, or a reduced "guest" bar (title only) on the login screen, purely from the
 * current session, so it needs no per-page configuration.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatToolbarModule, MatButtonModule, MatMenuModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** FR-014: nobody is logged in yet (e.g. the login screen) — just the title, nothing else. */
  readonly loggedIn = this.auth.isAuthenticated;

  /** FR-002/FR-014: "Appointment scheduler" for System Admin/Patient/guests, the clinic name otherwise. */
  readonly title = computed(() => {
    const user = this.auth.currentUser();
    if (!user) {
      return 'Appointment scheduler';
    }
    return user.role === 'SYSTEM_ADMIN' || user.role === 'PATIENT'
      ? 'Appointment scheduler'
      : (user.clinicName ?? 'Appointment scheduler');
  });

  /** FR-003: the logged-in user's name, shown at the right end of the title bar. */
  readonly userName = computed(() => {
    const user = this.auth.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  readonly navLinks = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role ? ROLE_NAV_LINKS[role] : [];
  });

  /** FR-004: ends the session and returns to the login screen. */
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
