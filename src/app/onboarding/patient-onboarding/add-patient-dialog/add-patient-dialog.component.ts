import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../../shared/address-form/address-form.component';
import { NotificationService } from '../../../shared/notification/notification.service';
import { PatientOnboardingService } from '../patient-onboarding.service';
import { UserOnboardingRequest, UserResponse } from '../../../shared/models';
import { AuthService } from '../../../core/auth.service';

/**
 * Two-step "Add a new patient" pop-up (Feature 006 US2), structurally mirroring
 * `AddDoctorDialogComponent` (Feature 005): a fields step, then a read-only confirm step the
 * Clinic Admin must explicitly confirm before the patient is actually created or linked (FR-007,
 * FR-007a). Both steps share one form instance, so "back" never loses entered values, and a
 * failure after "Confirm" returns to the fields step with those same values intact (FR-009).
 * `onboardOrLinkPatient` resolves identically whether the server created a new Patient or linked
 * an existing one from another clinic (research.md #4) — no special-casing needed here.
 */
@Component({
  selector: 'app-add-patient-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    AddressFormComponent,
  ],
  templateUrl: './add-patient-dialog.component.html',
  // provideNativeDateAdapter() directly, not a MatNativeDateModule import — Feature 005's NG0201
  // fix (MatDialog-created components don't reliably resolve DateAdapter from a plain module
  // import in a standalone component's `imports` array).
  providers: [provideNativeDateAdapter()],
})
export class AddPatientDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientOnboardingService = inject(PatientOnboardingService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<AddPatientDialogComponent, UserResponse>);

  readonly step = signal<'fields' | 'confirm'>('fields');

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    dateOfBirth: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
  });

  /** Read-only, typed view of the form's current values for the confirm step's summary. */
  get summary() {
    const value = this.form.getRawValue();
    return { ...value, address: value.address as AddressFormValue };
  }

  next(): void {
    if (this.form.invalid) {
      return;
    }
    this.step.set('confirm');
  }

  back(): void {
    this.step.set('fields');
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    const clinicId = this.auth.currentUser()?.clinicId;
    if (this.form.invalid || !clinicId) {
      return;
    }
    const value = this.form.getRawValue();
    const request: UserOnboardingRequest = {
      firstName: value.firstName!,
      lastName: value.lastName!,
      email: value.email!,
      dateOfBirth: value.dateOfBirth!,
      address: value.address as AddressFormValue,
    };

    this.patientOnboardingService.onboardOrLinkPatient(clinicId, request).subscribe({
      next: (patient) => {
        this.notification.success(`Patient ${value.firstName} ${value.lastName} onboarded successfully.`);
        this.dialogRef.close(patient);
      },
      error: (err) => {
        this.notification.error(err?.error?.message ?? 'Failed to onboard patient.');
        this.step.set('fields');
      },
    });
  }
}
