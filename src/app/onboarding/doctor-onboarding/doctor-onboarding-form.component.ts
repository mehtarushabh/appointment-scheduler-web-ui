import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../shared/address-form/address-form.component';
import { NotificationService } from '../../shared/notification/notification.service';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { DoctorOnboardingRequest } from '../../shared/models';
import { AuthService } from '../../core/auth.service';

/** Clinic Admin onboards a Doctor into their own clinic (User Story 2). */
@Component({
  selector: 'app-doctor-onboarding-form',
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
  templateUrl: './doctor-onboarding-form.component.html',
})
export class DoctorOnboardingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly doctorOnboardingService = inject(DoctorOnboardingService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    dateOfBirth: ['', Validators.required],
    specialty: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
  });

  submit(): void {
    const clinicId = this.auth.currentUser()?.clinicId;
    if (this.form.invalid || !clinicId) {
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

    this.doctorOnboardingService.onboardDoctor(clinicId, request).subscribe({
      next: () => {
        this.notification.success(`Doctor ${value.firstName} ${value.lastName} onboarded successfully.`);
        this.form.reset();
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to onboard doctor.'),
    });
  }
}
