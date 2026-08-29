import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../shared/address-form/address-form.component';
import { NotificationService } from '../../shared/notification/notification.service';
import { ProfileService } from '../../shared/profile/profile.service';
import { ProfileCompletionStatusService } from '../../shared/profile/profile-completion-status.service';
import { PatientProfileService } from '../../patient-profile/patient-profile.service';
import { DoctorProfileService } from '../../doctor-profile/doctor-profile.service';
import { AuthService } from '../auth.service';
import { BiologicalSex, DoctorDetailsResponse, MyProfileResponse, PatientDetailsResponse, UpdateMyProfileRequest, UserPreferencesResponse } from '../../shared/models';
import { InsuranceSectionComponent } from '../../patient-profile/insurance-section/insurance-section.component';
import { EmergencyContactSectionComponent } from '../../patient-profile/emergency-contact-section/emergency-contact-section.component';
import { ClinicalHistorySectionComponent } from '../../patient-profile/clinical-history-section/clinical-history-section.component';
import { ConsentsSectionComponent } from '../../patient-profile/consents-section/consents-section.component';
import { PersonalPhoneSectionComponent } from '../../patient-profile/personal-phone-section/personal-phone-section.component';
import { ProfessionalDetailsSectionComponent } from '../../doctor-profile/professional-details-section/professional-details-section.component';
import { ProfilePhotoSectionComponent } from '../../shared/profile/profile-photo-section/profile-photo-section.component';
import { PreferencesSectionComponent } from '../../shared/preferences/preferences-section/preferences-section.component';
import { UserPreferencesService } from '../../shared/preferences/user-preferences.service';

/** 017-edit-profile-redesign: one entry per section a Patient's profile can have; order matches spec.md FR-002. */
type ProfileSectionId = 'basicInformation' | 'emergencyContact' | 'insurance' | 'clinicalHistory' | 'consents';

interface ProfileSectionListItem {
  id: ProfileSectionId;
  label: string;
  complete: boolean;
}

const PROFILE_SECTIONS: ReadonlyArray<{ id: ProfileSectionId; label: string }> = [
  { id: 'basicInformation', label: 'Basic Information' },
  { id: 'emergencyContact', label: 'Emergency Contact' },
  { id: 'insurance', label: 'Insurance & Financial Responsibility' },
  { id: 'clinicalHistory', label: 'Clinical History & Health Intake' },
  { id: 'consents', label: 'Legal Consents & Policy Acknowledgments' },
];

/**
 * Every logged-in role's own Edit Profile page (Feature 011 FR-001 through FR-003), reached from
 * the account menu. Every role also edits Biological Sex here now (022-role-details-endpoints,
 * FR-013 — no longer Patient-only). A Doctor also edits their professional details (specialty,
 * professional bio, NPI number, state license number — 023-doctor-professional-details), its own
 * independently-saved panel below Basic Information (022-role-details-endpoints research.md #8;
 * 023-doctor-professional-details research.md #6) rather than part of this page's own form. A
 * Patient also edits Personal Phone (its own panel alongside Basic
 * Information — personalPhone shares Basic Information's single completion checkmark, so it's not
 * its own section-list entry) plus Sections 2-5 (Emergency Contact, Insurance, Clinical History,
 * Legal Consents) — these were briefly a separate "Patient Profile" page/nav tab, but that split
 * confused patients looking for "complete your profile," so everything patient-editable lives on
 * this one page instead. 017-edit-profile-redesign: for a Patient, those five sections are
 * presented as a section list with a completion checkmark each, showing exactly one section's
 * fields at a time in a detail area, rather than always expanded in an accordion.
 */
@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FaIconComponent,
    AddressFormComponent,
    InsuranceSectionComponent,
    EmergencyContactSectionComponent,
    ClinicalHistorySectionComponent,
    ConsentsSectionComponent,
    PersonalPhoneSectionComponent,
    ProfessionalDetailsSectionComponent,
    ProfilePhotoSectionComponent,
    PreferencesSectionComponent,
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss',
})
export class EditProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly patientProfileService = inject(PatientProfileService);
  private readonly doctorProfileService = inject(DoctorProfileService);
  private readonly userPreferencesService = inject(UserPreferencesService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly profileCompletionStatus = inject(ProfileCompletionStatusService);

  protected readonly faCircleCheck = faCircleCheck;

  readonly isDoctor = computed(() => this.auth.currentUser()?.role === 'DOCTOR');
  readonly isPatient = computed(() => this.auth.currentUser()?.role === 'PATIENT');

  readonly email = signal('');
  readonly biologicalSexOptions: BiologicalSex[] = ['MALE', 'FEMALE', 'INTERSEX', 'PREFER_NOT_TO_SAY'];

  /**
   * Sections 1-5 merged (Patient only): Section 1 comes from GET /me/profile, Sections 2-5 from
   * GET /me/patient-details — 021-user-data-restructuring split these into two calls on the
   * backend, merged back into this one signal so the template/section-detail inputs need no
   * change (research.md, data-model.md). personalPhone now arrives via the Sections 2-5 fetch too
   * (022-role-details-endpoints).
   */
  readonly profile = signal<(MyProfileResponse & PatientDetailsResponse) | null>(null);

  /** A Doctor's own professional details (022-role-details-endpoints; 023-doctor-professional-details) — fetched separately, its own panel, not merged into `profile`. */
  readonly doctorDetails = signal<DoctorDetailsResponse | null>(null);

  /** Every role's own profile photo (024-profile-photo-upload) — set from the same GET /me/profile fetch every role already makes, not merged into the Patient-only `profile` signal. */
  readonly profilePhotoUrl = signal<string | null>(null);

  /** Every role's own preferences (026-user-preferences) — its own fetch, not merged into `profile`, matching `doctorDetails` below. */
  readonly preferences = signal<UserPreferencesResponse | null>(null);

  /** Which of the five sections' fields the detail area currently shows (Patient only) — FR-003/FR-004. */
  readonly selectedSection = signal<ProfileSectionId>('basicInformation');

  /** The section list's entries and their live completion checkmarks (Patient only) — FR-002/FR-005/FR-006. */
  readonly sections = computed<ProfileSectionListItem[]>(() => {
    const status = this.profile()?.sectionStatus;
    return PROFILE_SECTIONS.map(({ id, label }) => ({ id, label, complete: status?.[id] ?? false }));
  });

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
    biologicalSex: [null as BiologicalSex | null],
  });

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe((profile) => {
      this.email.set(profile.email);
      this.profilePhotoUrl.set(profile.profilePhotoUrl);
      this.form.patchValue({
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        biologicalSex: profile.biologicalSex,
      });
      if (this.isPatient()) {
        this.patientProfileService.getPatientDetails().subscribe((details) => {
          this.profile.set({ ...profile, ...details });
          this.profileCompletionStatus.set(details.profileComplete);
        });
      }
    });

    if (this.isDoctor()) {
      this.doctorProfileService.getDoctorDetails().subscribe((details) => this.doctorDetails.set(details));
    }

    this.userPreferencesService.getPreferences().subscribe((preferences) => this.preferences.set(preferences));
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    const request: UpdateMyProfileRequest = {
      firstName: value.firstName!,
      lastName: value.lastName!,
      dateOfBirth: value.dateOfBirth!,
      address: value.address as AddressFormValue,
      biologicalSex: value.biologicalSex,
    };

    this.profileService.updateMyProfile(request).subscribe({
      next: (profile) => {
        this.auth.updateDisplayName(profile.firstName, profile.lastName);
        this.notification.success('Profile updated.');
        if (this.isPatient()) {
          this.profile.update((current) => (current ? { ...current, ...profile } : current));
          // Basic Information can flip sectionStatus.basicInformation, which now lives only in the
          // GET /me/patient-details response — re-fetch to keep the section list's checkmarks/
          // banner accurate immediately, matching pre-Feature-021 behavior.
          this.patientProfileService.getPatientDetails().subscribe((details) => {
            this.profile.update((current) => (current ? { ...current, ...details } : current));
            this.profileCompletionStatus.set(details.profileComplete);
          });
        }
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to update profile.'),
    });
  }

  onSectionSaved(updated: PatientDetailsResponse): void {
    this.profile.update((current) => (current ? { ...current, ...updated } : current));
    this.profileCompletionStatus.set(updated.profileComplete);
  }

  onDoctorDetailsSaved(updated: DoctorDetailsResponse): void {
    this.doctorDetails.set(updated);
  }

  onProfilePhotoSaved(profilePhotoUrl: string): void {
    this.profilePhotoUrl.set(profilePhotoUrl);
  }

  onPreferencesSaved(preferences: UserPreferencesResponse): void {
    this.preferences.set(preferences);
  }

  selectSection(id: ProfileSectionId): void {
    this.selectedSection.set(id);
  }
}
