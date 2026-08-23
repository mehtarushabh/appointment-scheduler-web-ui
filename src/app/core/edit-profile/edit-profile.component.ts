import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../shared/address-form/address-form.component';
import { NotificationService } from '../../shared/notification/notification.service';
import { ProfileService } from '../../shared/profile/profile.service';
import { AuthService } from '../auth.service';
import { UpdateMyProfileRequest } from '../../shared/models';

/**
 * Every logged-in role's own Edit Profile page (FR-001 through FR-003), reached from the account
 * menu. A Doctor also edits specialty (FR-004); a Patient also edits three optional insurance
 * fields (FR-013) — both are this feature's two concrete, independently-stored role-specific
 * extensions (research.md #2), rendered here purely from the current role, the same way
 * `add-doctor-dialog`/`AuthService.currentUser()` already gate role-specific UI elsewhere.
 */
@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AddressFormComponent,
  ],
  templateUrl: './edit-profile.component.html',
})
export class EditProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly isDoctor = computed(() => this.auth.currentUser()?.role === 'DOCTOR');
  readonly isPatient = computed(() => this.auth.currentUser()?.role === 'PATIENT');

  readonly email = signal('');

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
    specialty: [''],
    insuranceName: [''],
    groupId: [''],
    memberId: [''],
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
        insuranceName: profile.patientDetails?.insuranceName ?? '',
        groupId: profile.patientDetails?.groupId ?? '',
        memberId: profile.patientDetails?.memberId ?? '',
      });
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
      doctorDetails: this.isDoctor() ? { specialty: value.specialty! } : null,
      patientDetails: this.isPatient()
        ? { insuranceName: value.insuranceName || null, groupId: value.groupId || null, memberId: value.memberId || null }
        : null,
    };

    this.profileService.updateMyProfile(request).subscribe({
      next: (profile) => {
        this.auth.updateDisplayName(profile.firstName, profile.lastName);
        this.notification.success('Profile updated.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to update profile.'),
    });
  }
}
