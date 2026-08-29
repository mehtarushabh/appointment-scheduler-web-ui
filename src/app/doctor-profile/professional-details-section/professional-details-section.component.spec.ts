import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProfessionalDetailsSectionComponent } from './professional-details-section.component';
import { DoctorProfileService } from '../doctor-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { DoctorDetailsResponse } from '../../shared/models';

function doctorDetails(overrides: Partial<DoctorDetailsResponse> = {}): DoctorDetailsResponse {
  return {
    specialty: 'Cardiology',
    professionalBio: null,
    npiNumber: null,
    stateLicenseNumber: null,
    ...overrides,
  };
}

describe('ProfessionalDetailsSectionComponent', () => {
  let updateDoctorDetailsSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    updateDoctorDetailsSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ProfessionalDetailsSectionComponent],
      providers: [
        { provide: DoctorProfileService, useValue: { updateDoctorDetails: updateDoctorDetailsSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
  });

  it('pre-fills the form from the doctorDetails input, including the three new fields (023-doctor-professional-details)', () => {
    const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
    fixture.componentInstance.doctorDetails = doctorDetails({
      professionalBio: 'Board-certified cardiologist.',
      npiNumber: '1234567893',
      stateLicenseNumber: 'NY-12345',
    });

    fixture.componentInstance.ngOnChanges();

    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      specialty: 'Cardiology',
      professionalBio: 'Board-certified cardiologist.',
      npiNumber: '1234567893',
      stateLicenseNumber: 'NY-12345',
    });
  });

  it('does not save when specialty is blank', () => {
    const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);

    fixture.componentInstance.save();

    expect(updateDoctorDetailsSpy).not.toHaveBeenCalled();
  });

  it('saves with the three new fields left blank (they are optional, 023-doctor-professional-details FR-003)', () => {
    const updated = doctorDetails();
    updateDoctorDetailsSpy.mockReturnValue(of(updated));
    const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
    fixture.componentInstance.form.patchValue({ specialty: 'Cardiology' });

    fixture.componentInstance.save();

    expect(updateDoctorDetailsSpy).toHaveBeenCalledWith({
      specialty: 'Cardiology',
      professionalBio: null,
      npiNumber: null,
      stateLicenseNumber: null,
    });
  });

  it('saves the section and emits the updated details on success', () => {
    const updated = doctorDetails({ specialty: 'Neurology' });
    updateDoctorDetailsSpy.mockReturnValue(of(updated));
    const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
    fixture.componentInstance.form.setValue({
      specialty: 'Neurology',
      professionalBio: '',
      npiNumber: '',
      stateLicenseNumber: '',
    });
    const emitted: DoctorDetailsResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((d) => emitted.push(d));

    fixture.componentInstance.save();

    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(emitted).toEqual([updated]);
  });

  it('shows an error toast and does not emit on failure', () => {
    updateDoctorDetailsSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed.' } })));
    const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
    fixture.componentInstance.form.setValue({
      specialty: 'Neurology',
      professionalBio: '',
      npiNumber: '',
      stateLicenseNumber: '',
    });
    const emitted: DoctorDetailsResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((d) => emitted.push(d));

    fixture.componentInstance.save();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed.');
    expect(emitted).toEqual([]);
  });

  describe('NPI Number format validation (023-doctor-professional-details FR-005)', () => {
    it('blocks save when NPI Number is not exactly 10 digits', () => {
      const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
      fixture.componentInstance.form.patchValue({ specialty: 'Cardiology', npiNumber: '12345' });

      fixture.componentInstance.save();

      expect(updateDoctorDetailsSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.form.controls.npiNumber.hasError('pattern')).toBe(true);
    });

    it('allows a blank NPI Number (optional)', () => {
      const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
      fixture.componentInstance.form.patchValue({ specialty: 'Cardiology' });

      expect(fixture.componentInstance.form.controls.npiNumber.valid).toBe(true);
    });

    it('accepts a well-formed 10-digit NPI Number', () => {
      const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
      fixture.componentInstance.form.patchValue({ specialty: 'Cardiology', npiNumber: '1234567893' });

      expect(fixture.componentInstance.form.controls.npiNumber.valid).toBe(true);
    });
  });

  describe('length validation (023-doctor-professional-details FR-006, FR-007)', () => {
    it('blocks save when Professional Bio exceeds 2000 characters', () => {
      const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
      fixture.componentInstance.form.patchValue({ specialty: 'Cardiology', professionalBio: 'a'.repeat(2001) });

      fixture.componentInstance.save();

      expect(updateDoctorDetailsSpy).not.toHaveBeenCalled();
    });

    it('blocks save when State License Number exceeds 50 characters', () => {
      const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
      fixture.componentInstance.form.patchValue({ specialty: 'Cardiology', stateLicenseNumber: 'a'.repeat(51) });

      fixture.componentInstance.save();

      expect(updateDoctorDetailsSpy).not.toHaveBeenCalled();
    });
  });

  it('saving only a changed NPI Number resends the already-pre-filled Bio and License Number unchanged (023-doctor-professional-details Acceptance Scenario 3)', () => {
    updateDoctorDetailsSpy.mockReturnValue(of(doctorDetails()));
    const fixture = TestBed.createComponent(ProfessionalDetailsSectionComponent);
    fixture.componentInstance.doctorDetails = doctorDetails({
      professionalBio: 'Board-certified cardiologist.',
      npiNumber: '1234567893',
      stateLicenseNumber: 'NY-12345',
    });
    fixture.componentInstance.ngOnChanges();

    fixture.componentInstance.form.patchValue({ npiNumber: '9876543210' });
    fixture.componentInstance.save();

    expect(updateDoctorDetailsSpy).toHaveBeenCalledWith({
      specialty: 'Cardiology',
      professionalBio: 'Board-certified cardiologist.',
      npiNumber: '9876543210',
      stateLicenseNumber: 'NY-12345',
    });
  });
});
