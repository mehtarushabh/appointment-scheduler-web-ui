import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EditProfileComponent } from './edit-profile.component';
import { ProfileService } from '../../shared/profile/profile.service';
import { ProfileCompletionStatusService } from '../../shared/profile/profile-completion-status.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthService, UserRole } from '../auth.service';
import { MyProfileResponse, SectionCompletionStatus } from '../../shared/models';

function profile(overrides: Partial<MyProfileResponse> = {}): MyProfileResponse {
  return {
    firstName: 'Pat',
    lastName: 'User',
    email: 'pat@example.com',
    dateOfBirth: '1990-01-01',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    biologicalSex: null,
    personalPhone: null,
    doctorDetails: null,
    insurance: null,
    emergencyContact: null,
    clinicalHistory: null,
    consentStatuses: [],
    profileComplete: true,
    sectionStatus: null,
    ...overrides,
  };
}

describe('EditProfileComponent', () => {
  let getMyProfileSpy: ReturnType<typeof vi.fn>;
  let updateMyProfileSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let updateDisplayNameSpy: ReturnType<typeof vi.fn>;

  function setup(role: UserRole, profileResponse: MyProfileResponse = profile()) {
    getMyProfileSpy = vi.fn().mockReturnValue(of(profileResponse));
    updateMyProfileSpy = vi.fn().mockReturnValue(of(profileResponse));
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    updateDisplayNameSpy = vi.fn();

    TestBed.configureTestingModule({
      imports: [EditProfileComponent],
      providers: [
        { provide: ProfileService, useValue: { getMyProfile: getMyProfileSpy, updateMyProfile: updateMyProfileSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
        {
          provide: AuthService,
          useValue: { currentUser: () => ({ role, clinicId: null, token: 't' }), updateDisplayName: updateDisplayNameSpy },
        },
      ],
    });
    const fixture = TestBed.createComponent(EditProfileComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('pre-fills the form from the current profile', () => {
    const fixture = setup('SYSTEM_ADMIN', profile({ firstName: 'Ada', lastName: 'Admin' }));

    expect(getMyProfileSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.form.getRawValue().firstName).toBe('Ada');
    expect(fixture.componentInstance.form.getRawValue().lastName).toBe('Admin');
    expect(fixture.componentInstance.email()).toBe('pat@example.com');
  });

  it('saves valid changes, shows a success confirmation, and refreshes the shell\'s display name', () => {
    const fixture = setup('SYSTEM_ADMIN', profile({ firstName: 'Pat', lastName: 'Userson' }));
    updateMyProfileSpy.mockReturnValue(of(profile({ firstName: 'Pat', lastName: 'Userson' })));
    fixture.componentInstance.form.patchValue({ lastName: 'Userson' });

    fixture.componentInstance.save();

    expect(updateMyProfileSpy).toHaveBeenCalledWith(expect.objectContaining({ lastName: 'Userson' }));
    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(updateDisplayNameSpy).toHaveBeenCalledWith('Pat', 'Userson');
  });

  it('blocks save when a required field is blank', () => {
    const fixture = setup('SYSTEM_ADMIN');
    fixture.componentInstance.form.patchValue({ firstName: '' });

    fixture.componentInstance.save();

    expect(updateMyProfileSpy).not.toHaveBeenCalled();
  });

  it('shows the specialty field for a Doctor and blocks save when it is blank', () => {
    const fixture = setup('DOCTOR', profile({ doctorDetails: { specialty: 'Cardiology' } }));
    expect(fixture.componentInstance.isDoctor()).toBe(true);
    expect(fixture.componentInstance.isPatient()).toBe(false);
    expect(fixture.componentInstance.form.getRawValue().specialty).toBe('Cardiology');

    fixture.componentInstance.form.patchValue({ specialty: '' });
    fixture.componentInstance.save();

    expect(updateMyProfileSpy).not.toHaveBeenCalled();
  });

  it('sends doctorDetails with the specialty for a Doctor save', () => {
    const fixture = setup('DOCTOR', profile({ doctorDetails: { specialty: 'Cardiology' } }));

    fixture.componentInstance.save();

    expect(updateMyProfileSpy).toHaveBeenCalledWith(
      expect.objectContaining({ doctorDetails: { specialty: 'Cardiology' } })
    );
  });

  it('shows Biological Sex/Personal Phone for a Patient and pre-fills them from the profile (Feature 016 FR-007)', () => {
    const fixture = setup('PATIENT', profile({ biologicalSex: 'FEMALE', personalPhone: '555-0100' }));
    expect(fixture.componentInstance.isPatient()).toBe(true);
    expect(fixture.componentInstance.isDoctor()).toBe(false);
    expect(fixture.componentInstance.form.getRawValue().biologicalSex).toBe('FEMALE');
    expect(fixture.componentInstance.form.getRawValue().personalPhone).toBe('555-0100');
  });

  it('sends biologicalSex/personalPhone for a Patient save but not for other roles', () => {
    const fixture = setup('PATIENT', profile({ biologicalSex: 'FEMALE', personalPhone: '555-0100' }));

    fixture.componentInstance.save();

    expect(updateMyProfileSpy).toHaveBeenCalledWith(
      expect.objectContaining({ biologicalSex: 'FEMALE', personalPhone: '555-0100' })
    );
  });

  it('shows neither role-specific section for a Clinic Admin and omits Section 1 extras from the save', () => {
    const fixture = setup('CLINIC_ADMIN');
    expect(fixture.componentInstance.isDoctor()).toBe(false);
    expect(fixture.componentInstance.isPatient()).toBe(false);

    fixture.componentInstance.save();

    expect(updateMyProfileSpy).toHaveBeenCalledWith(
      expect.objectContaining({ doctorDetails: null, biologicalSex: null, personalPhone: null })
    );
  });

  it('keeps the entered values and shows an error when the save fails', () => {
    const fixture = setup('SYSTEM_ADMIN');
    updateMyProfileSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed to update profile.' } })));
    fixture.componentInstance.form.patchValue({ lastName: 'Userson' });

    fixture.componentInstance.save();

    expect(fixture.componentInstance.form.getRawValue().lastName).toBe('Userson');
    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed to update profile.');
  });

  // Feature 016: Sections 2-5 used to be a separate "Patient Profile" page — they now live on this
  // page, below Section 1, so a Patient has one single place to "complete their profile."
  describe('Sections 2-5 (Feature 016)', () => {
    it('fetches and exposes the full profile for a Patient, for the Sections 2-5 accordion', () => {
      const fixture = setup('PATIENT', profile({ profileComplete: false }));
      expect(fixture.componentInstance.profile()).toEqual(profile({ profileComplete: false }));
    });

    it('does not populate profile() for a non-Patient role', () => {
      const fixture = setup('SYSTEM_ADMIN');
      expect(fixture.componentInstance.profile()).toBeNull();
    });

    it('publishes the fetched Patient profile\'s completion state to the shared status service', () => {
      setup('PATIENT', profile({ profileComplete: false }));
      const statusService = TestBed.inject(ProfileCompletionStatusService);
      expect(statusService.profileComplete()).toBe(false);
    });

    it('does not touch the shared completion status for a non-Patient role', () => {
      setup('SYSTEM_ADMIN');
      const statusService = TestBed.inject(ProfileCompletionStatusService);
      expect(statusService.profileComplete()).toBeNull();
    });

    it('adopts the updated profile and refreshes the shared completion status when a section reports it saved', () => {
      const fixture = setup('PATIENT', profile({ profileComplete: false }));
      const statusService = TestBed.inject(ProfileCompletionStatusService);
      const updated = profile({ profileComplete: true });

      fixture.componentInstance.onSectionSaved(updated);

      expect(fixture.componentInstance.profile()).toEqual(updated);
      expect(statusService.profileComplete()).toBe(true);
    });

    it("updates profile() and the shared completion status after a Patient's Section 1 save", () => {
      const fixture = setup('PATIENT', profile({ profileComplete: false }));
      updateMyProfileSpy.mockReturnValue(of(profile({ profileComplete: true })));
      const statusService = TestBed.inject(ProfileCompletionStatusService);

      fixture.componentInstance.save();

      expect(fixture.componentInstance.profile()).toEqual(profile({ profileComplete: true }));
      expect(statusService.profileComplete()).toBe(true);
    });
  });

  // 017-edit-profile-redesign: the accordion above became a section list (one entry per section,
  // a green checkmark when complete) plus a detail area showing exactly one section at a time.
  describe('section list and switching (017-edit-profile-redesign)', () => {
    function sectionStatus(overrides: Partial<SectionCompletionStatus> = {}): SectionCompletionStatus {
      return {
        basicInformation: false,
        emergencyContact: false,
        insurance: false,
        clinicalHistory: false,
        consents: false,
        ...overrides,
      };
    }

    it('defaults the selected section to Basic Information', () => {
      const fixture = setup('PATIENT');
      expect(fixture.componentInstance.selectedSection()).toBe('basicInformation');
    });

    it('switches the selected section on selectSection()', () => {
      const fixture = setup('PATIENT');

      fixture.componentInstance.selectSection('insurance');

      expect(fixture.componentInstance.selectedSection()).toBe('insurance');
    });

    it('lists all five sections in FR-002 order, with each one\'s checkmark reflecting a genuine mix from sectionStatus', () => {
      const fixture = setup(
        'PATIENT',
        profile({ sectionStatus: sectionStatus({ basicInformation: true, insurance: true }) })
      );

      expect(fixture.componentInstance.sections()).toEqual([
        { id: 'basicInformation', label: 'Basic Information', complete: true },
        { id: 'emergencyContact', label: 'Emergency Contact', complete: false },
        { id: 'insurance', label: 'Insurance & Financial Responsibility', complete: true },
        { id: 'clinicalHistory', label: 'Clinical History & Health Intake', complete: false },
        { id: 'consents', label: 'Legal Consents & Policy Acknowledgments', complete: false },
      ]);
    });

    it('reflects an updated sectionStatus immediately after a section reports it saved, with no reload', () => {
      const fixture = setup('PATIENT', profile({ sectionStatus: sectionStatus() }));

      fixture.componentInstance.onSectionSaved(profile({ sectionStatus: sectionStatus({ emergencyContact: true }) }));

      expect(fixture.componentInstance.sections().find((s) => s.id === 'emergencyContact')?.complete).toBe(true);
    });
  });

  // 017-edit-profile-redesign, User Story 2: every role's fields render under a "Basic Information"
  // heading; a role with only this one section (i.e. every role but Patient) gets no section list.
  describe('Basic Information label for every role (User Story 2)', () => {
    it('shows a "Basic Information" heading and no section list for a non-Patient role', () => {
      const fixture = setup('SYSTEM_ADMIN');
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('Basic Information');
      expect(fixture.nativeElement.querySelector('.app-profile-section-list')).toBeNull();
    });

    it('shows the section list (with Basic Information as its first entry) for a Patient, instead of a bare heading', () => {
      const fixture = setup('PATIENT');

      expect(fixture.nativeElement.querySelector('.app-profile-section-list')).not.toBeNull();
    });
  });
});
