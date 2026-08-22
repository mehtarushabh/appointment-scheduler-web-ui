import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../shared/address-form/address-form.component';
import { NotificationService } from '../../shared/notification/notification.service';
import { ClinicAdminOnboardingService } from './clinic-admin-onboarding.service';
import { UserOnboardingRequest } from '../../shared/models';

/** Clinic Admin onboards another Clinic Admin for the same clinic (User Story 4). */
@Component({
  selector: 'app-clinic-admin-onboarding-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    AddressFormComponent,
  ],
  templateUrl: './clinic-admin-onboarding-form.component.html',
})
export class ClinicAdminOnboardingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clinicAdminOnboardingService = inject(ClinicAdminOnboardingService);
  private readonly notification = inject(NotificationService);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    dateOfBirth: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
  });

  submit(): void {
    if (this.form.invalid) {
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

    this.clinicAdminOnboardingService.onboardClinicAdmin(request).subscribe({
      next: () => {
        this.notification.success(`Clinic admin ${value.firstName} ${value.lastName} onboarded successfully.`);
        this.form.reset();
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to onboard clinic admin.'),
    });
  }
}
