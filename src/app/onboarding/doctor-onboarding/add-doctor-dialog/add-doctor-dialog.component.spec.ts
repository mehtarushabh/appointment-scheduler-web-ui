import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AddDoctorDialogComponent } from './add-doctor-dialog.component';
import { DoctorOnboardingService } from '../doctor-onboarding.service';
import { NotificationService } from '../../../shared/notification/notification.service';
import { AuthService } from '../../../core/auth.service';
import { UserResponse } from '../../../shared/models';

describe('AddDoctorDialogComponent', () => {
  let onboardDoctorSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRefStub: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    onboardDoctorSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    dialogRefStub = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AddDoctorDialogComponent],
      providers: [
        { provide: DoctorOnboardingService, useValue: { onboardDoctor: onboardDoctorSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
        { provide: MatDialogRef, useValue: dialogRefStub },
      ],
    });
  });

  function fillValidForm(component: AddDoctorDialogComponent) {
    component.form.setValue({
      firstName: 'Dana',
      lastName: 'Doc',
      email: 'dana@example.com',
      dateOfBirth: '1988-01-01',
      specialty: 'Cardiology',
      address: { addressLine1: '1 Main St', addressLine2: '', city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    });
  }

  it('stays on the fields step and does not call the service when the form is invalid (FR-006)', () => {
    const fixture = TestBed.createComponent(AddDoctorDialogComponent);

    fixture.componentInstance.next();

    expect(fixture.componentInstance.step()).toBe('fields');
    expect(onboardDoctorSpy).not.toHaveBeenCalled();
  });

  it('moves to the confirm step with the entered values and does not create the doctor yet (FR-007)', () => {
    const fixture = TestBed.createComponent(AddDoctorDialogComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.next();

    expect(fixture.componentInstance.step()).toBe('confirm');
    expect(onboardDoctorSpy).not.toHaveBeenCalled();
  });

  it('returns to the fields step with values preserved when going back from confirm (FR-007a)', () => {
    const fixture = TestBed.createComponent(AddDoctorDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.back();

    expect(fixture.componentInstance.step()).toBe('fields');
    expect(fixture.componentInstance.form.getRawValue().firstName).toBe('Dana');
  });

  it('closes with no result and does not create a doctor when cancelled (FR-010)', () => {
    const fixture = TestBed.createComponent(AddDoctorDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.cancel();

    expect(dialogRefStub.close).toHaveBeenCalledWith();
    expect(onboardDoctorSpy).not.toHaveBeenCalled();
  });

  it('creates the doctor, shows a success toast, and closes with the result on Confirm (FR-008)', () => {
    const created = { id: 'd1', firstName: 'Dana', lastName: 'Doc' } as UserResponse;
    onboardDoctorSpy.mockReturnValue(of(created));
    const fixture = TestBed.createComponent(AddDoctorDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.confirm();

    expect(onboardDoctorSpy).toHaveBeenCalledWith('clinic-1', expect.objectContaining({ specialty: 'Cardiology' }));
    expect(notificationServiceStub.success).toHaveBeenCalledWith('Doctor Dana Doc onboarded successfully.');
    expect(dialogRefStub.close).toHaveBeenCalledWith(created);
  });

  it('shows a failure toast and returns to the fields step with values intact on failure (FR-009)', () => {
    onboardDoctorSpy.mockReturnValue(throwError(() => ({ error: { message: 'Email already in use.' } })));
    const fixture = TestBed.createComponent(AddDoctorDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.confirm();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Email already in use.');
    expect(fixture.componentInstance.step()).toBe('fields');
    expect(fixture.componentInstance.form.getRawValue().email).toBe('dana@example.com');
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
