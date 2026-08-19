import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../shared/address-form/address-form.component';
import { ClinicOnboardingService } from './clinic-onboarding.service';
import { ClinicOnboardingRequest } from '../../shared/models';

/** System Admin onboards a Clinic + its first Clinic Admin in one submission (User Story 1). */
@Component({
  selector: 'app-clinic-onboarding-form',
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
  templateUrl: './clinic-onboarding-form.component.html',
})
export class ClinicOnboardingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clinicOnboardingService = inject(ClinicOnboardingService);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    registeredId: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
    adminFirstName: ['', Validators.required],
    adminLastName: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminDateOfBirth: ['', Validators.required],
    adminAddress: createAddressFormGroup(this.fb),
  });

  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const request: ClinicOnboardingRequest = {
      name: value.name!,
      registeredId: value.registeredId!,
      address: value.address as AddressFormValue,
      firstClinicAdmin: {
        firstName: value.adminFirstName!,
        lastName: value.adminLastName!,
        email: value.adminEmail!,
        dateOfBirth: value.adminDateOfBirth!,
        address: value.adminAddress as AddressFormValue,
      },
    };

    this.clinicOnboardingService.onboardClinic(request).subscribe({
      next: () => {
        this.submitted.set(true);
        this.form.reset();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to onboard clinic.');
      },
    });
  }
}
