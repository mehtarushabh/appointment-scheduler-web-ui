import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ClinicAdminOnboardingFormComponent } from './clinic-admin-onboarding-form.component';
import { ClinicAdminOnboardingService } from './clinic-admin-onboarding.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

describe('ClinicAdminOnboardingFormComponent', () => {
  let onboardClinicAdminSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    onboardClinicAdminSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClinicAdminOnboardingFormComponent],
      providers: [
        { provide: ClinicAdminOnboardingService, useValue: { onboardClinicAdmin: onboardClinicAdminSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
      ],
    });
  });

  function fillValidForm(component: ClinicAdminOnboardingFormComponent) {
    component.form.setValue({
      firstName: 'Second',
      lastName: 'Admin',
      email: 'second@example.com',
      dateOfBirth: '1990-01-01',
      address: { addressLine1: '1 Main St', addressLine2: '', city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    });
  }

  it('does not submit when the form is invalid', () => {
    const fixture = TestBed.createComponent(ClinicAdminOnboardingFormComponent);
    fixture.componentInstance.submit();
    expect(onboardClinicAdminSpy).not.toHaveBeenCalled();
  });

  it('submits against the current clinic and shows a success toast naming the clinic admin (FR-002)', () => {
    onboardClinicAdminSpy.mockReturnValue(of({} as UserResponse));
    const fixture = TestBed.createComponent(ClinicAdminOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(onboardClinicAdminSpy).toHaveBeenCalledWith('clinic-1', expect.objectContaining({ email: 'second@example.com' }));
    expect(notificationServiceStub.success).toHaveBeenCalledWith('Clinic admin Second Admin onboarded successfully.');
  });

  it('shows a failure toast with the server error message on failure (FR-004)', () => {
    onboardClinicAdminSpy.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use.' } })));
    const fixture = TestBed.createComponent(ClinicAdminOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Email already in use.');
  });
});
