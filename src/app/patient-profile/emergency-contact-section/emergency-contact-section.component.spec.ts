import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EmergencyContactSectionComponent } from './emergency-contact-section.component';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { PatientDetailsResponse } from '../../shared/models';

describe('EmergencyContactSectionComponent', () => {
  let updateEmergencyContactSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    updateEmergencyContactSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [EmergencyContactSectionComponent],
      providers: [
        { provide: PatientProfileService, useValue: { updateEmergencyContact: updateEmergencyContactSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
  });

  it('pre-fills the form from the emergencyContact input', () => {
    const fixture = TestBed.createComponent(EmergencyContactSectionComponent);
    fixture.componentInstance.emergencyContact = {
      contactFullName: 'Jordan Contact',
      relationship: 'SPOUSAL',
      primaryPhone: '555-0200',
      secondaryPhone: null,
    };

    fixture.componentInstance.ngOnChanges();

    expect(fixture.componentInstance.form.getRawValue().contactFullName).toBe('Jordan Contact');
    expect(fixture.componentInstance.form.getRawValue().relationship).toBe('SPOUSAL');
  });

  it('does not save when a required field is blank', () => {
    const fixture = TestBed.createComponent(EmergencyContactSectionComponent);

    fixture.componentInstance.save();

    expect(updateEmergencyContactSpy).not.toHaveBeenCalled();
  });

  it('saves the section and emits the updated profile on success', () => {
    const updated = { profileComplete: true } as PatientDetailsResponse;
    updateEmergencyContactSpy.mockReturnValue(of(updated));
    const fixture = TestBed.createComponent(EmergencyContactSectionComponent);
    fixture.componentInstance.form.setValue({
      contactFullName: 'Jordan Contact',
      relationship: 'SPOUSAL',
      primaryPhone: '555-0200',
      secondaryPhone: '',
    });
    const emitted: PatientDetailsResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.save();

    expect(updateEmergencyContactSpy).toHaveBeenCalledWith(
      expect.objectContaining({ contactFullName: 'Jordan Contact', relationship: 'SPOUSAL' })
    );
    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(emitted).toEqual([updated]);
  });

  it('shows an error toast and does not emit on failure', () => {
    updateEmergencyContactSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed.' } })));
    const fixture = TestBed.createComponent(EmergencyContactSectionComponent);
    fixture.componentInstance.form.setValue({
      contactFullName: 'Jordan Contact',
      relationship: 'SPOUSAL',
      primaryPhone: '555-0200',
      secondaryPhone: '',
    });
    const emitted: PatientDetailsResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.save();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed.');
    expect(emitted).toEqual([]);
  });
});
