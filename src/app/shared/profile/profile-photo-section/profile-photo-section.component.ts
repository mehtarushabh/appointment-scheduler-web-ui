import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ProfileService } from '../profile.service';
import { NotificationService } from '../../notification/notification.service';

const MAX_SIZE_BYTES = 40 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

/**
 * Any logged-in role's own profile photo (024-profile-photo-upload, FR-001) — a self-contained,
 * independently-saved panel, the same pattern every other Edit Profile section already uses, used
 * from both role branches of `edit-profile.component.html` since it applies to every role
 * identically (unlike the Doctor-only or Patient-only sections nearby it).
 *
 * The client-side size/type pre-check here is a UX convenience only — fast feedback before even
 * attempting an upload — never the real enforcement, which happens server-side against the actual
 * file bytes (research.md #2 of 024-profile-photo-upload).
 */
@Component({
  selector: 'app-profile-photo-section',
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './profile-photo-section.component.html',
})
export class ProfilePhotoSectionComponent {
  private readonly profileService = inject(ProfileService);
  private readonly notification = inject(NotificationService);

  @Input() profilePhotoUrl: string | null = null;
  @Output() readonly sectionSaved = new EventEmitter<string>();

  readonly uploading = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.notification.error('Photo must be 40MB or smaller.');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.notification.error('Photo must be a JPEG or PNG image.');
      return;
    }

    this.uploading.set(true);
    this.profileService.uploadProfilePhoto(file).subscribe({
      next: ({ profilePhotoUrl }) => {
        this.uploading.set(false);
        this.notification.success('Profile photo saved.');
        this.sectionSaved.emit(profilePhotoUrl);
      },
      error: (err) => {
        this.uploading.set(false);
        this.notification.error(err?.error?.message ?? 'Failed to save profile photo.');
      },
    });
  }
}
