import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AddPatientDialogComponent } from './add-patient-dialog.component';
import { PatientOnboardingService } from '../patient-onboarding.service';
import { NotificationService } from '../../../shared/notification/notification.service';
import { AuthService } from '../../../core/auth.service';
import { UserResponse } from '../../../shared/models';

describe('AddPatientDialogComponent', () => {
  let onboardOrLinkPatientSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRefStub: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    onboardOrLinkPatientSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    dialogRefStub = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AddPatientDialogComponent],
      providers: [
        { provide: PatientOnboardingService, useValue: { onboardOrLinkPatient: onboardOrLinkPatientSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
        { provide: MatDialogRef, useValue: dialogRefStub },
      ],
    });
  });

  function fillValidForm(component: AddPatientDialogComponent) {
    component.form.setValue({
      firstName: 'Pat',
      lastName: 'Ient',
      email: 'pat@example.com',
      dateOfBirth: '1995-03-03',
      address: { addressLine1: '9 Oak St', addressLine2: '', city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    });
  }

  it('stays on the fields step and does not call the service when the form is invalid (FR-006)', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);

    fixture.componentInstance.next();

    expect(fixture.componentInstance.step()).toBe('fields');
    expect(onboardOrLinkPatientSpy).not.toHaveBeenCalled();
  });

  it('moves to the confirm step with the entered values and does not create/link the patient yet (FR-007)', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fillValidForm(fixture.componentInstance);

    fixture.componentInstance.next();

    expect(fixture.componentInstance.step()).toBe('confirm');
    expect(onboardOrLinkPatientSpy).not.toHaveBeenCalled();
  });

  it('returns to the fields step with values preserved when going back from confirm (FR-007a)', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.back();

    expect(fixture.componentInstance.step()).toBe('fields');
    expect(fixture.componentInstance.form.getRawValue().firstName).toBe('Pat');
  });

  it('closes with no result and does not create a patient when cancelled (FR-010)', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.cancel();

    expect(dialogRefStub.close).toHaveBeenCalledWith();
    expect(onboardOrLinkPatientSpy).not.toHaveBeenCalled();
  });

  it('creates the patient, shows a success toast, and closes with the result on Confirm (FR-008)', () => {
    const created = { id: 'p1', firstName: 'Pat', lastName: 'Ient' } as UserResponse;
    onboardOrLinkPatientSpy.mockReturnValue(of(created));
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.confirm();

    expect(onboardOrLinkPatientSpy).toHaveBeenCalledWith('clinic-1', expect.objectContaining({ email: 'pat@example.com' }));
    expect(notificationServiceStub.success).toHaveBeenCalledWith('Patient Pat Ient onboarded successfully.');
    expect(dialogRefStub.close).toHaveBeenCalledWith(created);
  });

  it('shows the same success toast when the server links an existing patient instead of creating one (FR-008, research.md #4)', () => {
    // onboardOrLinkPatient resolves identically for both cases from the frontend's perspective —
    // the HTTP status (200 vs 201) is not surfaced to the caller, so no distinct handling is needed.
    const linked = { id: 'existing-1', firstName: 'Pat', lastName: 'Ient' } as UserResponse;
    onboardOrLinkPatientSpy.mockReturnValue(of(linked));
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.confirm();

    expect(notificationServiceStub.success).toHaveBeenCalledWith('Patient Pat Ient onboarded successfully.');
    expect(dialogRefStub.close).toHaveBeenCalledWith(linked);
  });

  it('shows a failure toast and returns to the fields step with values intact on failure (FR-009)', () => {
    onboardOrLinkPatientSpy.mockReturnValue(throwError(() => ({ error: { message: 'Email belongs to a non-patient account.' } })));
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fillValidForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.confirm();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Email belongs to a non-patient account.');
    expect(fixture.componentInstance.step()).toBe('fields');
    expect(fixture.componentInstance.form.getRawValue().email).toBe('pat@example.com');
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
