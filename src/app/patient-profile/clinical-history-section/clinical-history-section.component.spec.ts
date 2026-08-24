import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClinicalHistorySectionComponent } from './clinical-history-section.component';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { MyProfileResponse } from '../../shared/models';

describe('ClinicalHistorySectionComponent', () => {
  let updateClinicalHistorySpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    updateClinicalHistorySpy = vi.fn().mockReturnValue(of({} as MyProfileResponse));
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClinicalHistorySectionComponent],
      providers: [
        { provide: PatientProfileService, useValue: { updateClinicalHistory: updateClinicalHistorySpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
  });

  it('adds and removes medication rows', () => {
    const fixture = TestBed.createComponent(ClinicalHistorySectionComponent);

    fixture.componentInstance.addMedication('Ibuprofen', '200mg', 'As needed');
    expect(fixture.componentInstance.medications.length).toBe(1);

    fixture.componentInstance.removeMedication(0);
    expect(fixture.componentInstance.medications.length).toBe(0);
  });

  it('adds and removes allergy rows', () => {
    const fixture = TestBed.createComponent(ClinicalHistorySectionComponent);

    fixture.componentInstance.addAllergy('FOOD', 'Peanuts', 'SEVERE_ANAPHYLAXIS');
    expect(fixture.componentInstance.allergies.length).toBe(1);

    fixture.componentInstance.removeAllergy(0);
    expect(fixture.componentInstance.allergies.length).toBe(0);
  });

  it('saves successfully with both lists empty — an explicit "none" answer (FR-015)', () => {
    const fixture = TestBed.createComponent(ClinicalHistorySectionComponent);
    fixture.componentInstance.form.patchValue({
      personalMedicalHistory: 'None',
      familyMedicalHistory: 'None',
      preferredPharmacyName: 'Corner Pharmacy',
    });

    fixture.componentInstance.save();

    expect(updateClinicalHistorySpy).toHaveBeenCalledWith(
      expect.objectContaining({ medications: [], allergies: [], personalMedicalHistory: 'None' })
    );
  });

  it('does not save when a medication row is missing a required field', () => {
    const fixture = TestBed.createComponent(ClinicalHistorySectionComponent);
    fixture.componentInstance.addMedication('Ibuprofen', '', 'As needed');

    fixture.componentInstance.save();

    expect(updateClinicalHistorySpy).not.toHaveBeenCalled();
  });

  it('emits the updated profile on successful save', () => {
    const updated = { firstName: 'Pat' } as MyProfileResponse;
    updateClinicalHistorySpy.mockReturnValue(of(updated));
    const fixture = TestBed.createComponent(ClinicalHistorySectionComponent);
    const emitted: MyProfileResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.save();

    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(emitted).toEqual([updated]);
  });

  it('pre-fills lists and narrative fields from the clinicalHistory input', () => {
    const fixture = TestBed.createComponent(ClinicalHistorySectionComponent);
    fixture.componentInstance.clinicalHistory = {
      medications: [{ name: 'Ibuprofen', dosage: '200mg', frequency: 'As needed' }],
      allergies: [{ category: 'FOOD', description: 'Peanuts', severity: 'SEVERE_ANAPHYLAXIS' }],
      medicationsReviewed: true,
      allergiesReviewed: true,
      personalMedicalHistory: 'None',
      familyMedicalHistory: 'None',
      preferredPharmacyName: 'Corner Pharmacy',
    };

    fixture.componentInstance.ngOnChanges();

    expect(fixture.componentInstance.medications.length).toBe(1);
    expect(fixture.componentInstance.allergies.length).toBe(1);
    expect(fixture.componentInstance.form.getRawValue().preferredPharmacyName).toBe('Corner Pharmacy');
  });
});
