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
import { DoctorOnboardingService } from '../doctor-onboarding.service';
import { DoctorOnboardingRequest, UserResponse } from '../../../shared/models';

/**
 * Two-step "Add a new doctor" pop-up (Feature 005 US2): a fields step, then a read-only confirm
 * step the Clinic Admin must explicitly confirm before the doctor is actually created (FR-007,
 * FR-007a). Both steps share one form instance, so "back" never loses entered values, and a
 * failure after "Confirm" returns to the fields step with those same values intact (FR-009).
 */
@Component({
  selector: 'app-add-doctor-dialog',
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
  templateUrl: './add-doctor-dialog.component.html',
  // MatDialog-created components don't reliably inherit DateAdapter from a plain
  // MatNativeDateModule import the way routed components do (the datepicker's calendar overlay is
  // portal-attached outside the normal component tree) — providing it explicitly here guarantees
  // it's resolvable regardless of how MatDialog builds this component's injector (NG0201 fix).
  providers: [provideNativeDateAdapter()],
})
export class AddDoctorDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly doctorOnboardingService = inject(DoctorOnboardingService);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<AddDoctorDialogComponent, UserResponse>);

  readonly step = signal<'fields' | 'confirm'>('fields');

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    dateOfBirth: ['', Validators.required],
    specialty: ['', Validators.required],
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
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    const request: DoctorOnboardingRequest = {
      firstName: value.firstName!,
      lastName: value.lastName!,
      email: value.email!,
      dateOfBirth: value.dateOfBirth!,
      specialty: value.specialty!,
      address: value.address as AddressFormValue,
    };

    this.doctorOnboardingService.onboardDoctor(request).subscribe({
      next: (doctor) => {
        this.notification.success(`Doctor ${value.firstName} ${value.lastName} onboarded successfully.`);
        this.dialogRef.close(doctor);
      },
      error: (err) => {
        this.notification.error(err?.error?.message ?? 'Failed to onboard doctor.');
        this.step.set('fields');
      },
    });
  }
}
