import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ClinicAdminOnboardingFormComponent } from './clinic-admin-onboarding-form.component';
import { ClinicAdminOnboardingService } from './clinic-admin-onboarding.service';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

describe('ClinicAdminOnboardingFormComponent', () => {
  let onboardClinicAdminSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onboardClinicAdminSpy = vi.fn();
    TestBed.configureTestingModule({
      imports: [ClinicAdminOnboardingFormComponent],
      providers: [
        { provide: ClinicAdminOnboardingService, useValue: { onboardClinicAdmin: onboardClinicAdminSpy } },
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

  it('submits against the current clinic and marks success', () => {
    onboardClinicAdminSpy.mockReturnValue(of({} as UserResponse));
    const fixture = TestBed.createComponent(ClinicAdminOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(onboardClinicAdminSpy).toHaveBeenCalledWith('clinic-1', expect.objectContaining({ email: 'second@example.com' }));
    expect(fixture.componentInstance.submitted()).toBe(true);
  });

  it('surfaces a server error message on failure', () => {
    onboardClinicAdminSpy.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use.' } })));
    const fixture = TestBed.createComponent(ClinicAdminOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe('Email already in use.');
  });
});
