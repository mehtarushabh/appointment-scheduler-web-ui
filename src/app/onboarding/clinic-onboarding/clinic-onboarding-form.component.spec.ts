import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClinicOnboardingFormComponent } from './clinic-onboarding-form.component';
import { ClinicOnboardingService } from './clinic-onboarding.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { ClinicResponse } from '../../shared/models';

describe('ClinicOnboardingFormComponent', () => {
  let onboardClinicSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    onboardClinicSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClinicOnboardingFormComponent],
      providers: [
        provideRouter([]),
        { provide: ClinicOnboardingService, useValue: { onboardClinic: onboardClinicSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
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

  it('shows a success toast naming the clinic and navigates to /home (FR-002, FR-008)', () => {
    onboardClinicSpy.mockReturnValue(of({} as ClinicResponse));
    const fixture = TestBed.createComponent(ClinicOnboardingFormComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(onboardClinicSpy).toHaveBeenCalled();
    expect(notificationServiceStub.success).toHaveBeenCalledWith('Clinic Riverside Clinic onboarded successfully.');
    expect(navigateSpy).toHaveBeenCalledWith('/home');
  });

  it('shows a failure toast with the server error message on failure (FR-004)', () => {
    onboardClinicSpy.mockReturnValue(throwError(() => ({ error: { message: 'Registered ID already in use.' } })));
    const fixture = TestBed.createComponent(ClinicOnboardingFormComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.submit();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Registered ID already in use.');
  });
});
