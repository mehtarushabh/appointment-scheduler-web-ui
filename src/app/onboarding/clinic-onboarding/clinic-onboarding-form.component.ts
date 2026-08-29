import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../shared/address-form/address-form.component';
import { NotificationService } from '../../shared/notification/notification.service';
import { ClinicOnboardingService } from './clinic-onboarding.service';
import { BiologicalSex, ClinicOnboardingRequest } from '../../shared/models';

/** System Admin onboards a Clinic + its first Clinic Admin in one submission (User Story 1). */
@Component({
  selector: 'app-clinic-onboarding-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    AddressFormComponent,
  ],
  templateUrl: './clinic-onboarding-form.component.html',
})
export class ClinicOnboardingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clinicOnboardingService = inject(ClinicOnboardingService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly biologicalSexOptions: BiologicalSex[] = ['MALE', 'FEMALE', 'INTERSEX', 'PREFER_NOT_TO_SAY'];

  readonly form = this.fb.group({
    name: ['', Validators.required],
    registeredId: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
    adminFirstName: ['', Validators.required],
    adminLastName: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminDateOfBirth: ['', Validators.required],
    adminAddress: createAddressFormGroup(this.fb),
    adminBiologicalSex: [null as BiologicalSex | null, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
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
        biologicalSex: value.adminBiologicalSex!,
      },
    };

    this.clinicOnboardingService.onboardClinic(request).subscribe({
      next: () => {
        this.notification.success(`Clinic ${value.name} onboarded successfully.`);
        this.form.reset();
        this.router.navigateByUrl('/home');
      },
      error: (err) => {
        this.notification.error(err?.error?.message ?? 'Failed to onboard clinic.');
      },
    });
  }
}
