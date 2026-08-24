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
import { PatientOnboardingRequest, UserResponse } from '../../../shared/models';

/**
 * Email-first "Add a new patient" pop-up (Feature 016 FR-001–FR-006), replacing Feature 006's
 * single all-fields-then-confirm flow. Four steps sharing one dialog instance:
 * `email` (only field required to start) → either `match` (an existing Patient was found by
 * email — Confirm just links them, no re-entry, FR-002/FR-003) or `fields` (no match — First
 * Name/Last Name/Date of Birth/Address only; Biological Sex/Personal Phone are never collected
 * here, FR-005/FR-007) → `confirm` (review before creating). A 409 (email belongs to a
 * non-Patient account, FR-006) is shown inline on the `email` step without advancing.
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
  private readonly dialogRef = inject(MatDialogRef<AddPatientDialogComponent, UserResponse>);

  readonly step = signal<'email' | 'match' | 'fields' | 'confirm'>('email');
  readonly matchedPatient = signal<UserResponse | null>(null);
  readonly lookupErrorMessage = signal<string | null>(null);

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly detailsForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
  });

  /** Read-only, typed view of the fields form's current values for the confirm step's summary. */
  get summary() {
    const value = this.detailsForm.getRawValue();
    return { ...value, address: value.address as AddressFormValue };
  }

  lookupEmail(): void {
    if (this.emailForm.invalid) {
      return;
    }
    this.lookupErrorMessage.set(null);
    const email = this.emailForm.getRawValue().email!;

    this.patientOnboardingService.lookupPatient(email).subscribe({
      next: (found) => {
        if (found) {
          this.matchedPatient.set(found);
          this.step.set('match');
        } else {
          this.step.set('fields');
        }
      },
      error: (err) => this.lookupErrorMessage.set(err?.error?.message ?? 'Failed to look up this email.'),
    });
  }

  next(): void {
    if (this.detailsForm.invalid) {
      return;
    }
    this.step.set('confirm');
  }

  back(): void {
    if (this.step() === 'confirm') {
      this.step.set('fields');
    } else {
      this.step.set('email');
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  /** FR-003: the matched Patient is linked with no re-entry of their information — only email is sent. */
  confirmLink(): void {
    const email = this.emailForm.getRawValue().email!;
    this.patientOnboardingService.onboardOrLinkPatient({ email }).subscribe({
      next: (patient) => {
        this.notification.success(`${patient.firstName} ${patient.lastName} added to this clinic.`);
        this.dialogRef.close(patient);
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to add this patient to the clinic.'),
    });
  }

  confirm(): void {
    if (this.detailsForm.invalid) {
      return;
    }
    const value = this.detailsForm.getRawValue();
    const request: PatientOnboardingRequest = {
      email: this.emailForm.getRawValue().email!,
      firstName: value.firstName!,
      lastName: value.lastName!,
      dateOfBirth: value.dateOfBirth!,
      address: value.address as AddressFormValue,
    };

    this.patientOnboardingService.onboardOrLinkPatient(request).subscribe({
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
