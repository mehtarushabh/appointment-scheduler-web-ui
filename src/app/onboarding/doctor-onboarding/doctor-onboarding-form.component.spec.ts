import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DoctorOnboardingFormComponent } from './doctor-onboarding-form.component';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

describe('DoctorOnboardingFormComponent', () => {
  let onboardDoctorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onboardDoctorSpy = vi.fn();
    TestBed.configureTestingModule({
      imports: [DoctorOnboardingFormComponent],
      providers: [
        { provide: DoctorOnboardingService, useValue: { onboardDoctor: onboardDoctorSpy } },
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

  it('submits against the current clinic and marks success', () => {
    onboardDoctorSpy.mockReturnValue(of({} as UserResponse));
    const fixture = TestBed.createComponent(DoctorOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(onboardDoctorSpy).toHaveBeenCalledWith('clinic-1', expect.objectContaining({ specialty: 'Cardiology' }));
    expect(fixture.componentInstance.submitted()).toBe(true);
  });

  it('surfaces a server error message on failure', () => {
    onboardDoctorSpy.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use.' } })));
    const fixture = TestBed.createComponent(DoctorOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe('Email already in use.');
  });
});
