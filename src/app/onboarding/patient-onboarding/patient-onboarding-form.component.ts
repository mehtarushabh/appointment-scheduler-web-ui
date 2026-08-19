import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../shared/address-form/address-form.component';
import { PatientOnboardingService } from './patient-onboarding.service';
import { UserOnboardingRequest } from '../../shared/models';
import { AuthService } from '../../core/auth.service';

/**
 * Clinic Admin onboards a Patient into their own clinic. If the email already belongs to a
 * Patient elsewhere, the backend links the existing Patient instead of duplicating them (US3).
 */
@Component({
  selector: 'app-patient-onboarding-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AddressFormComponent,
  ],
  templateUrl: './patient-onboarding-form.component.html',
})
export class PatientOnboardingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientOnboardingService = inject(PatientOnboardingService);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    dateOfBirth: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
  });

  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    const clinicId = this.auth.currentUser()?.clinicId;
    if (this.form.invalid || !clinicId) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const request: UserOnboardingRequest = {
      firstName: value.firstName!,
      lastName: value.lastName!,
      email: value.email!,
      dateOfBirth: value.dateOfBirth!,
      address: value.address as AddressFormValue,
    };

    this.patientOnboardingService.onboardOrLinkPatient(clinicId, request).subscribe({
      next: () => {
        this.submitted.set(true);
        this.form.reset();
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Failed to onboard patient.'),
    });
  }
}
