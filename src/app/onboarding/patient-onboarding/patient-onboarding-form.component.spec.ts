import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PatientOnboardingFormComponent } from './patient-onboarding-form.component';
import { PatientOnboardingService } from './patient-onboarding.service';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

describe('PatientOnboardingFormComponent', () => {
  let onboardOrLinkPatientSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onboardOrLinkPatientSpy = vi.fn();
    TestBed.configureTestingModule({
      imports: [PatientOnboardingFormComponent],
      providers: [
        { provide: PatientOnboardingService, useValue: { onboardOrLinkPatient: onboardOrLinkPatientSpy } },
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

  it('submits against the current clinic and marks success, whether created or linked', () => {
    onboardOrLinkPatientSpy.mockReturnValue(of({} as UserResponse));
    const fixture = TestBed.createComponent(PatientOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(onboardOrLinkPatientSpy).toHaveBeenCalledWith('clinic-1', expect.objectContaining({ email: 'pat@example.com' }));
    expect(fixture.componentInstance.submitted()).toBe(true);
  });

  it('surfaces a server error message on failure', () => {
    onboardOrLinkPatientSpy.mockReturnValue(throwError(() => ({ error: { message: 'Email belongs to a non-patient account.' } })));
    const fixture = TestBed.createComponent(PatientOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe('Email belongs to a non-patient account.');
  });
});
