import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ClinicOnboardingFormComponent } from './clinic-onboarding-form.component';
import { ClinicOnboardingService } from './clinic-onboarding.service';
import { ClinicResponse } from '../../shared/models';

describe('ClinicOnboardingFormComponent', () => {
  let onboardClinicSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onboardClinicSpy = vi.fn();
    TestBed.configureTestingModule({
      imports: [ClinicOnboardingFormComponent],
      providers: [{ provide: ClinicOnboardingService, useValue: { onboardClinic: onboardClinicSpy } }],
    });
  });

  function fillValidForm(component: ClinicOnboardingFormComponent) {
    component.form.setValue({
      name: 'Riverside Clinic',
      registeredId: 'REG-1',
      address: { addressLine1: '1 River Rd', addressLine2: '', city: 'Riverside', state: 'CA', zip: '92501', country: 'USA' },
      adminFirstName: 'Cara',
      adminLastName: 'Admin',
      adminEmail: 'cara@example.com',
      adminDateOfBirth: '1985-05-05',
      adminAddress: { addressLine1: '2 Elm St', addressLine2: '', city: 'Riverside', state: 'CA', zip: '92501', country: 'USA' },
    });
  }

  it('does not submit when the form is invalid', () => {
    const fixture = TestBed.createComponent(ClinicOnboardingFormComponent);
    fixture.componentInstance.submit();
    expect(onboardClinicSpy).not.toHaveBeenCalled();
  });

  it('submits the onboarding request and marks success', () => {
    onboardClinicSpy.mockReturnValue(of({} as ClinicResponse));
    const fixture = TestBed.createComponent(ClinicOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(onboardClinicSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.submitted()).toBe(true);
  });

  it('surfaces a server error message on failure', () => {
    onboardClinicSpy.mockReturnValue(throwError(() => ({ error: { message: 'Registered ID already in use.' } })));
    const fixture = TestBed.createComponent(ClinicOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe('Registered ID already in use.');
  });
});
