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
import { AuthService } from '../auth.service';
import { BiologicalSex, MyProfileResponse, UpdateMyProfileRequest } from '../../shared/models';
import { InsuranceSectionComponent } from '../../patient-profile/insurance-section/insurance-section.component';
import { EmergencyContactSectionComponent } from '../../patient-profile/emergency-contact-section/emergency-contact-section.component';
import { ClinicalHistorySectionComponent } from '../../patient-profile/clinical-history-section/clinical-history-section.component';
import { ConsentsSectionComponent } from '../../patient-profile/consents-section/consents-section.component';

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
 * the account menu. A Doctor also edits specialty (FR-004). A Patient also edits Biological Sex
 * and Personal Phone (Feature 016 FR-007), plus Sections 2-5 (Emergency Contact, Insurance,
 * Clinical History, Legal Consents) — these were briefly a separate "Patient Profile" page/nav
 * tab, but that split confused patients looking for "complete your profile," so everything
 * patient-editable lives on this one page instead. 017-edit-profile-redesign: for a Patient, those
 * five sections (Basic Information plus the four above) are presented as a section list with a
 * completion checkmark each, showing exactly one section's fields at a time in a detail area,
 * rather than Section 1's form followed by all four others always expanded in an accordion.
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
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss',
})
export class EditProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly profileCompletionStatus = inject(ProfileCompletionStatusService);

  protected readonly faCircleCheck = faCircleCheck;

  readonly isDoctor = computed(() => this.auth.currentUser()?.role === 'DOCTOR');
  readonly isPatient = computed(() => this.auth.currentUser()?.role === 'PATIENT');

  readonly email = signal('');
  readonly biologicalSexOptions: BiologicalSex[] = ['MALE', 'FEMALE', 'INTERSEX', 'PREFER_NOT_TO_SAY'];

  /** Sections 2-5 (Patient only) — fetched alongside Section 1's pre-fill, and re-adopted whenever a section reports it saved. */
  readonly profile = signal<MyProfileResponse | null>(null);

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
    specialty: [''],
    biologicalSex: [null as BiologicalSex | null],
    personalPhone: [''],
  });

  ngOnInit(): void {
    if (this.isDoctor()) {
      this.form.controls.specialty.addValidators(Validators.required);
      this.form.controls.specialty.updateValueAndValidity();
    }

    this.profileService.getMyProfile().subscribe((profile) => {
      this.email.set(profile.email);
      this.form.patchValue({
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        specialty: profile.doctorDetails?.specialty ?? '',
        biologicalSex: profile.biologicalSex,
        personalPhone: profile.personalPhone ?? '',
      });
      if (this.isPatient()) {
        this.profile.set(profile);
        this.profileCompletionStatus.set(profile.profileComplete);
      }
    });
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
      biologicalSex: this.isPatient() ? value.biologicalSex : null,
      personalPhone: this.isPatient() ? value.personalPhone || null : null,
      doctorDetails: this.isDoctor() ? { specialty: value.specialty! } : null,
    };

    this.profileService.updateMyProfile(request).subscribe({
      next: (profile) => {
        this.auth.updateDisplayName(profile.firstName, profile.lastName);
        this.notification.success('Profile updated.');
        if (this.isPatient()) {
          this.onSectionSaved(profile);
        }
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to update profile.'),
    });
  }

  onSectionSaved(updated: MyProfileResponse): void {
    this.profile.set(updated);
    this.profileCompletionStatus.set(updated.profileComplete);
  }

  selectSection(id: ProfileSectionId): void {
    this.selectedSection.set(id);
  }
}
