import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../notification/notification.service';
import { ROLE_NAV_LINKS } from '../../nav-links';
import { UserPreferencesResponse } from '../../models';
import { UserPreferencesService } from '../user-preferences.service';

const HOME_OPTION = { label: 'Home page', path: '/home' };

/**
 * Every logged-in role's own "Preferences" section in Edit Profile (026-user-preferences, FR-001)
 * — a self-contained, independently-saved panel, the same pattern every other Edit Profile section
 * already uses (e.g. app-profile-photo-section). First (and currently only) setting: "Default
 * landing page," a dropdown of Home page plus the caller's own role's nav pages (shared/nav-links.ts).
 */
@Component({
  selector: 'app-preferences-section',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatCardModule],
  templateUrl: './preferences-section.component.html',
})
export class PreferencesSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly userPreferencesService = inject(UserPreferencesService);
  private readonly notification = inject(NotificationService);

  @Input() set preferences(value: UserPreferencesResponse | null) {
    if (value) {
      this.form.patchValue({ defaultLandingPage: value.defaultLandingPage });
    }
  }
  @Output() readonly sectionSaved = new EventEmitter<UserPreferencesResponse>();

  readonly saving = signal(false);

  readonly landingPageOptions = computed(() => {
    const role = this.auth.currentUser()?.role;
    const roleLinks = role ? ROLE_NAV_LINKS[role] : [];
    return [HOME_OPTION, ...roleLinks];
  });

  readonly form = this.fb.group({
    defaultLandingPage: [HOME_OPTION.path],
  });

  save(): void {
    const defaultLandingPage = this.form.getRawValue().defaultLandingPage!;
    this.saving.set(true);
    this.userPreferencesService.updatePreferences({ defaultLandingPage }).subscribe({
      next: (preferences) => {
        this.saving.set(false);
        this.notification.success('Preferences saved.');
        this.sectionSaved.emit(preferences);
      },
      error: (err) => {
        this.saving.set(false);
        this.notification.error(err?.error?.message ?? 'Failed to save preferences.');
      },
    });
  }
}
