import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AddPatientDialogComponent } from './add-patient-dialog.component';
import { PatientOnboardingService } from '../patient-onboarding.service';
import { NotificationService } from '../../../shared/notification/notification.service';
import { UserResponse } from '../../../shared/models';

describe('AddPatientDialogComponent', () => {
  let lookupPatientSpy: ReturnType<typeof vi.fn>;
  let onboardOrLinkPatientSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRefStub: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    lookupPatientSpy = vi.fn();
    onboardOrLinkPatientSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    dialogRefStub = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AddPatientDialogComponent],
      providers: [
        {
          provide: PatientOnboardingService,
          useValue: { lookupPatient: lookupPatientSpy, onboardOrLinkPatient: onboardOrLinkPatientSpy },
        },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
      ],
    });
  });

  function fillDetailsForm(component: AddPatientDialogComponent) {
    component.detailsForm.setValue({
      firstName: 'Pat',
      lastName: 'Ient',
      dateOfBirth: '1995-03-03',
      address: { addressLine1: '9 Oak St', addressLine2: '', city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    });
  }

  it('does not call lookupPatient when the email is invalid (FR-001)', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);

    fixture.componentInstance.lookupEmail();

    expect(fixture.componentInstance.step()).toBe('email');
    expect(lookupPatientSpy).not.toHaveBeenCalled();
  });

  it('moves to the match step and stores the found patient when the email already exists (FR-002)', () => {
    const found = { id: 'existing-1', firstName: 'Pat', lastName: 'Ient' } as UserResponse;
    lookupPatientSpy.mockReturnValue(of(found));
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.emailForm.setValue({ email: 'existing@example.com' });

    fixture.componentInstance.lookupEmail();

    expect(fixture.componentInstance.step()).toBe('match');
    expect(fixture.componentInstance.matchedPatient()).toBe(found);
  });

  it('moves to the fields step, collecting no Biological Sex/Personal Phone field, when the email matches nobody (FR-005)', () => {
    lookupPatientSpy.mockReturnValue(of(null));
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.emailForm.setValue({ email: 'new@example.com' });

    fixture.componentInstance.lookupEmail();

    expect(fixture.componentInstance.step()).toBe('fields');
    expect(fixture.componentInstance.detailsForm.contains('biologicalSex')).toBe(false);
    expect(fixture.componentInstance.detailsForm.contains('personalPhone')).toBe(false);
  });

  it('shows the rejection inline on the email step and does not advance when the email belongs to a non-Patient account (FR-006)', () => {
    lookupPatientSpy.mockReturnValue(
      throwError(() => ({ error: { message: 'This email belongs to an existing account that is not a Patient.' } }))
    );
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.emailForm.setValue({ email: 'doctor@example.com' });

    fixture.componentInstance.lookupEmail();

    expect(fixture.componentInstance.step()).toBe('email');
    expect(fixture.componentInstance.lookupErrorMessage()).toBe(
      'This email belongs to an existing account that is not a Patient.'
    );
  });

  it('links the matched patient using only the email, with a success toast and no re-entered fields (FR-003)', () => {
    const linked = { id: 'existing-1', firstName: 'Pat', lastName: 'Ient' } as UserResponse;
    onboardOrLinkPatientSpy.mockReturnValue(of(linked));
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.emailForm.setValue({ email: 'existing@example.com' });
    fixture.componentInstance.matchedPatient.set(linked);
    fixture.componentInstance.step.set('match');

    fixture.componentInstance.confirmLink();

    expect(onboardOrLinkPatientSpy).toHaveBeenCalledWith({ email: 'existing@example.com' });
    expect(notificationServiceStub.success).toHaveBeenCalledWith('Pat Ient added to this clinic.');
    expect(dialogRefStub.close).toHaveBeenCalledWith(linked);
  });

  it('returns from the match step to the email step on Back', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.step.set('match');

    fixture.componentInstance.back();

    expect(fixture.componentInstance.step()).toBe('email');
  });

  it('stays on the fields step and does not advance when the details form is invalid', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.step.set('fields');

    fixture.componentInstance.next();

    expect(fixture.componentInstance.step()).toBe('fields');
  });

  it('moves to the confirm step with the entered values and does not create the patient yet', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.step.set('fields');
    fillDetailsForm(fixture.componentInstance);

    fixture.componentInstance.next();

    expect(fixture.componentInstance.step()).toBe('confirm');
    expect(onboardOrLinkPatientSpy).not.toHaveBeenCalled();
  });

  it('returns to the fields step with values preserved when going back from confirm', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.step.set('fields');
    fillDetailsForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.back();

    expect(fixture.componentInstance.step()).toBe('fields');
    expect(fixture.componentInstance.detailsForm.getRawValue().firstName).toBe('Pat');
  });

  it('closes with no result and does not call the service when cancelled from any step', () => {
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.step.set('fields');
    fillDetailsForm(fixture.componentInstance);

    fixture.componentInstance.cancel();

    expect(dialogRefStub.close).toHaveBeenCalledWith();
    expect(onboardOrLinkPatientSpy).not.toHaveBeenCalled();
  });

  it('creates the new patient, shows a success toast, and closes with the result on Confirm', () => {
    const created = { id: 'p1', firstName: 'Pat', lastName: 'Ient' } as UserResponse;
    onboardOrLinkPatientSpy.mockReturnValue(of(created));
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.emailForm.setValue({ email: 'pat@example.com' });
    fixture.componentInstance.step.set('fields');
    fillDetailsForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.confirm();

    expect(onboardOrLinkPatientSpy).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'pat@example.com', firstName: 'Pat', lastName: 'Ient' })
    );
    expect(notificationServiceStub.success).toHaveBeenCalledWith('Patient Pat Ient onboarded successfully.');
    expect(dialogRefStub.close).toHaveBeenCalledWith(created);
  });

  it('shows a failure toast and returns to the fields step with values intact on failure (FR-009)', () => {
    onboardOrLinkPatientSpy.mockReturnValue(throwError(() => ({ error: { message: 'Something went wrong.' } })));
    const fixture = TestBed.createComponent(AddPatientDialogComponent);
    fixture.componentInstance.emailForm.setValue({ email: 'pat@example.com' });
    fixture.componentInstance.step.set('fields');
    fillDetailsForm(fixture.componentInstance);
    fixture.componentInstance.next();

    fixture.componentInstance.confirm();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Something went wrong.');
    expect(fixture.componentInstance.step()).toBe('fields');
    expect(fixture.componentInstance.detailsForm.getRawValue().firstName).toBe('Pat');
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
