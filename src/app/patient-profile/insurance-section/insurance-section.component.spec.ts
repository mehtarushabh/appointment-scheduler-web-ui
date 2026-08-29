import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InsuranceSectionComponent } from './insurance-section.component';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { PatientDetailsResponse } from '../../shared/models';

describe('InsuranceSectionComponent', () => {
  let updateInsuranceSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    updateInsuranceSpy = vi.fn().mockReturnValue(of({} as PatientDetailsResponse));
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [InsuranceSectionComponent],
      providers: [
        { provide: PatientProfileService, useValue: { updateInsurance: updateInsuranceSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
  });

  function fillRequiredFields(component: InsuranceSectionComponent) {
    component.form.patchValue({
      insuranceName: 'Acme Health',
      memberId: 'MEM-1',
      policyholderName: 'Pat User',
      policyholderRelationship: 'SPOUSE',
      policyholderDateOfBirth: '1985-05-05',
      policyholderBiologicalSex: 'MALE',
    });
  }

  it('pre-fills Policyholder Name/Date of Birth/Biological Sex from the patient when Relationship is set to Self', () => {
    const fixture = TestBed.createComponent(InsuranceSectionComponent);
    fixture.componentInstance.patientName = 'Pat User';
    fixture.componentInstance.patientDateOfBirth = '1990-01-01';
    fixture.componentInstance.patientBiologicalSex = 'FEMALE';

    fixture.componentInstance.onRelationshipChange('SELF');

    expect(fixture.componentInstance.form.getRawValue().policyholderName).toBe('Pat User');
    expect(fixture.componentInstance.form.getRawValue().policyholderDateOfBirth).toBe('1990-01-01');
    expect(fixture.componentInstance.form.getRawValue().policyholderBiologicalSex).toBe('FEMALE');
  });

  it('does not touch Policyholder Name/Date of Birth/Biological Sex for a non-Self relationship', () => {
    const fixture = TestBed.createComponent(InsuranceSectionComponent);
    fixture.componentInstance.patientName = 'Pat User';
    fixture.componentInstance.patientDateOfBirth = '1990-01-01';
    fixture.componentInstance.patientBiologicalSex = 'FEMALE';
    fixture.componentInstance.form.patchValue({
      policyholderName: 'Someone Else',
      policyholderDateOfBirth: '1985-05-05',
      policyholderBiologicalSex: 'MALE',
    });

    fixture.componentInstance.onRelationshipChange('SPOUSE');

    expect(fixture.componentInstance.form.getRawValue().policyholderName).toBe('Someone Else');
    expect(fixture.componentInstance.form.getRawValue().policyholderDateOfBirth).toBe('1985-05-05');
  });

  // Group Number's disabled state is owned by the FormControl itself (research.md #6) — Reactive
  // Forms overwrites a plain template [attr.disabled] binding on a formControlName-bound element,
  // which is why this needs ngOnInit()'s subscription rather than a template expression.
  describe('Group Number disables with "My plan has no group number"', () => {
    it('disables Group Number when the checkbox is checked', () => {
      const fixture = TestBed.createComponent(InsuranceSectionComponent);
      fixture.componentInstance.ngOnInit();

      fixture.componentInstance.form.controls.hasNoGroupNumber.setValue(true);

      expect(fixture.componentInstance.form.controls.groupId.disabled).toBe(true);
    });

    it('re-enables Group Number when the checkbox is unchecked again', () => {
      const fixture = TestBed.createComponent(InsuranceSectionComponent);
      fixture.componentInstance.ngOnInit();
      fixture.componentInstance.form.controls.hasNoGroupNumber.setValue(true);

      fixture.componentInstance.form.controls.hasNoGroupNumber.setValue(false);

      expect(fixture.componentInstance.form.controls.groupId.disabled).toBe(false);
    });

    it('starts Group Number disabled when the loaded profile already has hasNoGroupNumber true', () => {
      const fixture = TestBed.createComponent(InsuranceSectionComponent);

      fixture.componentInstance.insurance = {
        insuranceName: 'Acme Health',
        memberId: 'MEM-1',
        groupId: null,
        hasNoGroupNumber: true,
        policyholderName: 'Pat User',
        policyholderRelationship: 'SELF',
        policyholderDateOfBirth: '1990-01-01',
        policyholderBiologicalSex: 'FEMALE',
      };
      fixture.componentInstance.ngOnChanges();

      expect(fixture.componentInstance.form.controls.groupId.disabled).toBe(true);
    });
  });

  it('sends groupId as null and hasNoGroupNumber true when the checkbox is checked', () => {
    const fixture = TestBed.createComponent(InsuranceSectionComponent);
    fillRequiredFields(fixture.componentInstance);
    fixture.componentInstance.form.patchValue({ groupId: 'should-be-ignored', hasNoGroupNumber: true });

    fixture.componentInstance.save();

    expect(updateInsuranceSpy).toHaveBeenCalledWith(expect.objectContaining({ groupId: null, hasNoGroupNumber: true }));
  });

  it('emits the updated profile on successful save', () => {
    const updated = { profileComplete: true } as PatientDetailsResponse;
    updateInsuranceSpy.mockReturnValue(of(updated));
    const fixture = TestBed.createComponent(InsuranceSectionComponent);
    fillRequiredFields(fixture.componentInstance);
    const emitted: PatientDetailsResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.save();

    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(emitted).toEqual([updated]);
  });

  it('does not save when a required field is missing', () => {
    const fixture = TestBed.createComponent(InsuranceSectionComponent);

    fixture.componentInstance.save();

    expect(updateInsuranceSpy).not.toHaveBeenCalled();
  });
});
