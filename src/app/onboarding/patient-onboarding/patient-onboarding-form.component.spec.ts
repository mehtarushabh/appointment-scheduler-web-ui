import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PatientOnboardingFormComponent } from './patient-onboarding-form.component';
import { PatientOnboardingService } from './patient-onboarding.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

describe('PatientOnboardingFormComponent', () => {
  let onboardOrLinkPatientSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    onboardOrLinkPatientSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [PatientOnboardingFormComponent],
      providers: [
        { provide: PatientOnboardingService, useValue: { onboardOrLinkPatient: onboardOrLinkPatientSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
      ],
    });
  });

  function fillValidForm(component: PatientOnboardingFormComponent) {
    component.form.setValue({
      firstName: 'Pat',
      lastName: 'Ient',
      email: 'pat@example.com',
      dateOfBirth: '1995-03-03',
      address: { addressLine1: '9 Oak St', addressLine2: '', city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    });
  }

  it('does not submit when the form is invalid', () => {
    const fixture = TestBed.createComponent(PatientOnboardingFormComponent);
    fixture.componentInstance.submit();
    expect(onboardOrLinkPatientSpy).not.toHaveBeenCalled();
  });

  it('submits against the current clinic and shows a success toast naming the patient (FR-002)', () => {
    onboardOrLinkPatientSpy.mockReturnValue(of({} as UserResponse));
    const fixture = TestBed.createComponent(PatientOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(onboardOrLinkPatientSpy).toHaveBeenCalledWith('clinic-1', expect.objectContaining({ email: 'pat@example.com' }));
    expect(notificationServiceStub.success).toHaveBeenCalledWith('Patient Pat Ient onboarded successfully.');
  });

  it('shows a failure toast with the server error message on failure (FR-004)', () => {
    onboardOrLinkPatientSpy.mockReturnValue(throwError(() => ({ error: { message: 'Email belongs to a non-patient account.' } })));
    const fixture = TestBed.createComponent(PatientOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Email belongs to a non-patient account.');
  });
});
