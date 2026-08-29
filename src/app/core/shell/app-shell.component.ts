import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../auth.service';
import { ProfileService } from '../../shared/profile/profile.service';
import { ProfileCompletionStatusService } from '../../shared/profile/profile-completion-status.service';
import { ROLE_NAV_LINKS, SCHEDULE_APPOINTMENT_PATH } from '../../shared/nav-links';

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
  private readonly profileService = inject(ProfileService);
  private readonly profileCompletionStatus = inject(ProfileCompletionStatusService);

  /** Special-cased in the template so it can render disabled instead of navigable (Feature 016 FR-019/FR-020). */
  readonly scheduleAppointmentPath = SCHEDULE_APPOINTMENT_PATH;

  /** FR-014: nobody is logged in yet (e.g. the login screen) — just the title, nothing else. */
  readonly loggedIn = this.auth.isAuthenticated;

  /**
   * Feature 016 FR-019/FR-020: a Patient whose profile is positively known to be incomplete can't
   * start the scheduling flow at all, not just get rejected at the final confirm step. `=== false`
   * specifically — `null` (not yet fetched) never disables, so the link doesn't flash disabled for
   * a complete Patient while the fetch is still in flight; the server remains the real gate either way.
   */
  readonly scheduleAppointmentDisabled = computed(
    () => this.auth.currentUser()?.role === 'PATIENT' && this.profileCompletionStatus.profileComplete() === false
  );

  /** The logged-in user's own profile photo (024-profile-photo-upload) — shown next to userName() below; null shows a placeholder. */
  readonly profilePhotoUrl = signal<string | null>(null);

  /**
   * Keeps profileCompletionStatus (and, 024-profile-photo-upload, profilePhotoUrl) in sync with
   * the logged-in user, and clears both on logout/role change. 022-role-details-endpoints
   * (research.md #7): reads profileComplete off the lean, cached GET /me/profile for every
   * authenticated role, not just Patient — every role now needs this one cached fetch to have
   * happened once (so Edit Profile's own read resolves instantly), even though only Patient's
   * nav-gating below actually reads the completion flag (it's unconditionally true for every
   * other role, research.md #4). The same cached fetch already carries profilePhotoUrl for every
   * role, so the title bar's photo needs no separate network call either.
   */
  private readonly syncProfileCompletion = effect(() => {
    const user = this.auth.currentUser();
    if (user) {
      this.profileService.getMyProfile().subscribe((profile) => {
        this.profileCompletionStatus.set(profile.profileComplete);
        this.profilePhotoUrl.set(profile.profilePhotoUrl);
      });
    } else {
      this.profileCompletionStatus.reset();
      this.profilePhotoUrl.set(null);
    }
  });

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
