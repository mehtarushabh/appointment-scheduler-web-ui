import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DoctorOnboardingFormComponent } from './doctor-onboarding-form.component';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

describe('DoctorOnboardingFormComponent', () => {
  let onboardDoctorSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    onboardDoctorSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [DoctorOnboardingFormComponent],
      providers: [
        { provide: DoctorOnboardingService, useValue: { onboardDoctor: onboardDoctorSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
      ],
    });
  });

  function fillValidForm(component: DoctorOnboardingFormComponent) {
    component.form.setValue({
      firstName: 'Dana',
      lastName: 'Doc',
      email: 'dana@example.com',
      dateOfBirth: '1988-01-01',
      specialty: 'Cardiology',
      address: { addressLine1: '1 Main St', addressLine2: '', city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    });
  }

  it('does not submit when the form is invalid', () => {
    const fixture = TestBed.createComponent(DoctorOnboardingFormComponent);
    fixture.componentInstance.submit();
    expect(onboardDoctorSpy).not.toHaveBeenCalled();
  });

  it('submits against the current clinic and shows a success toast naming the doctor (FR-002)', () => {
    onboardDoctorSpy.mockReturnValue(of({} as UserResponse));
    const fixture = TestBed.createComponent(DoctorOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(onboardDoctorSpy).toHaveBeenCalledWith('clinic-1', expect.objectContaining({ specialty: 'Cardiology' }));
    expect(notificationServiceStub.success).toHaveBeenCalledWith('Doctor Dana Doc onboarded successfully.');
  });

  it('shows a failure toast with the server error message on failure (FR-004)', () => {
    onboardDoctorSpy.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use.' } })));
    const fixture = TestBed.createComponent(DoctorOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Email already in use.');
  });
});
