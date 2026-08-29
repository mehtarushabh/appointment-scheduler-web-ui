import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EditProfileComponent } from './edit-profile.component';
import { ProfileService } from '../../shared/profile/profile.service';
import { PatientProfileService } from '../../patient-profile/patient-profile.service';
import { DoctorProfileService } from '../../doctor-profile/doctor-profile.service';
import { ProfileCompletionStatusService } from '../../shared/profile/profile-completion-status.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { UserPreferencesService } from '../../shared/preferences/user-preferences.service';
import { AuthService, UserRole } from '../auth.service';
import { DoctorDetailsResponse, MyProfileResponse, PatientDetailsResponse, SectionCompletionStatus, UserPreferencesResponse } from '../../shared/models';

function profile(overrides: Partial<MyProfileResponse> = {}): MyProfileResponse {
  return {
    firstName: 'Pat',
    lastName: 'User',
    email: 'pat@example.com',
    dateOfBirth: '1990-01-01',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    biologicalSex: null,
    profileComplete: true,
    profilePhotoUrl: null,
    ...overrides,
  };
}

function patientDetails(overrides: Partial<PatientDetailsResponse> = {}): PatientDetailsResponse {
  return {
    insurance: null,
    emergencyContact: null,
    clinicalHistory: null,
    consentStatuses: [],
    personalPhone: null,
    profileComplete: true,
    sectionStatus: null,
    ...overrides,
  };
}

function doctorDetails(overrides: Partial<DoctorDetailsResponse> = {}): DoctorDetailsResponse {
  return { specialty: 'Cardiology', professionalBio: null, npiNumber: null, stateLicenseNumber: null, ...overrides };
}

function preferences(overrides: Partial<UserPreferencesResponse> = {}): UserPreferencesResponse {
  return { defaultLandingPage: '/home', ...overrides };
}

describe('EditProfileComponent', () => {
  let getMyProfileSpy: ReturnType<typeof vi.fn>;
  let updateMyProfileSpy: ReturnType<typeof vi.fn>;
  let getPatientDetailsSpy: ReturnType<typeof vi.fn>;
  let getDoctorDetailsSpy: ReturnType<typeof vi.fn>;
  let getPreferencesSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let updateDisplayNameSpy: ReturnType<typeof vi.fn>;

  function setup(
    role: UserRole,
    profileResponse: MyProfileResponse = profile(),
    patientDetailsResponse: PatientDetailsResponse = patientDetails(),
    doctorDetailsResponse: DoctorDetailsResponse = doctorDetails(),
    preferencesResponse: UserPreferencesResponse = preferences()
  ) {
    getMyProfileSpy = vi.fn().mockReturnValue(of(profileResponse));
    updateMyProfileSpy = vi.fn().mockReturnValue(of(profileResponse));
    getPatientDetailsSpy = vi.fn().mockReturnValue(of(patientDetailsResponse));
    getDoctorDetailsSpy = vi.fn().mockReturnValue(of(doctorDetailsResponse));
    getPreferencesSpy = vi.fn().mockReturnValue(of(preferencesResponse));
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    updateDisplayNameSpy = vi.fn();

    TestBed.configureTestingModule({
      imports: [EditProfileComponent],
      providers: [
        { provide: ProfileService, useValue: { getMyProfile: getMyProfileSpy, updateMyProfile: updateMyProfileSpy } },
        { provide: PatientProfileService, useValue: { getPatientDetails: getPatientDetailsSpy } },
        { provide: DoctorProfileService, useValue: { getDoctorDetails: getDoctorDetailsSpy } },
        { provide: UserPreferencesService, useValue: { getPreferences: getPreferencesSpy } },
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

  it('shows Biological Sex for every role and pre-fills it from the profile (Feature 016 FR-007, 022-role-details-endpoints FR-013)', () => {
    const fixture = setup('SYSTEM_ADMIN', profile({ biologicalSex: 'FEMALE' }));
    expect(fixture.componentInstance.form.getRawValue().biologicalSex).toBe('FEMALE');
  });

  it('sends biologicalSex regardless of role (022-role-details-endpoints FR-013)', () => {
    const fixture = setup('CLINIC_ADMIN', profile({ biologicalSex: 'FEMALE' }));

    fixture.componentInstance.save();

    expect(updateMyProfileSpy).toHaveBeenCalledWith(expect.objectContaining({ biologicalSex: 'FEMALE' }));
  });

  it('keeps the entered values and shows an error when the save fails', () => {
    const fixture = setup('SYSTEM_ADMIN');
    updateMyProfileSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed to update profile.' } })));
    fixture.componentInstance.form.patchValue({ lastName: 'Userson' });

    fixture.componentInstance.save();

    expect(fixture.componentInstance.form.getRawValue().lastName).toBe('Userson');
    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed to update profile.');
  });

  // 022-role-details-endpoints: specialty moved off this page's own form onto its own
  // independently-saved panel (ProfessionalDetailsSectionComponent, renamed in
  // 023-doctor-professional-details), fetched separately from Basic Information.
  describe('Doctor professional details panel (022-role-details-endpoints; 023-doctor-professional-details)', () => {
    it('fetches the specialty for a Doctor and exposes it via doctorDetails()', () => {
      const fixture = setup('DOCTOR', profile(), patientDetails(), doctorDetails({ specialty: 'Neurology' }));

      expect(getDoctorDetailsSpy).toHaveBeenCalled();
      expect(fixture.componentInstance.doctorDetails()).toEqual(doctorDetails({ specialty: 'Neurology' }));
    });

    it('does not fetch specialty for a non-Doctor role', () => {
      const fixture = setup('SYSTEM_ADMIN');

      expect(getDoctorDetailsSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.doctorDetails()).toBeNull();
    });

    it('adopts the updated professional details when the panel reports it saved', () => {
      const fixture = setup('DOCTOR');
      const updated = doctorDetails({ specialty: 'Neurology' });

      fixture.componentInstance.onDoctorDetailsSaved(updated);

      expect(fixture.componentInstance.doctorDetails()).toEqual(updated);
    });
  });

  // Feature 016: Sections 2-5 used to be a separate "Patient Profile" page — they now live on this
  // page, below Section 1, so a Patient has one single place to "complete their profile." 021-
  // user-data-restructuring: Section 1 (GET /me/profile) and Sections 2-5 (GET /me/patient-details)
  // now come from two separate calls, merged into this one profile() signal so the template needs
  // no change. 022-role-details-endpoints: personalPhone now arrives via the Sections 2-5 fetch too.
  describe('Sections 2-5 (Feature 016)', () => {
    it('fetches Section 1 and Sections 2-5 for a Patient and merges them into profile()', () => {
      const fixture = setup('PATIENT', profile({ firstName: 'Pat' }), patientDetails({ profileComplete: false, personalPhone: '555-0100' }));

      expect(getPatientDetailsSpy).toHaveBeenCalled();
      expect(fixture.componentInstance.profile()).toEqual({
        ...profile({ firstName: 'Pat' }),
        ...patientDetails({ profileComplete: false, personalPhone: '555-0100' }),
      });
    });

    it('does not fetch patient details or populate profile() for a non-Patient role', () => {
      const fixture = setup('SYSTEM_ADMIN');

      expect(getPatientDetailsSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.profile()).toBeNull();
    });

    it("publishes the fetched Patient details' completion state to the shared status service", () => {
      setup('PATIENT', profile(), patientDetails({ profileComplete: false }));
      const statusService = TestBed.inject(ProfileCompletionStatusService);
      expect(statusService.profileComplete()).toBe(false);
    });

    it('does not touch the shared completion status for a non-Patient role', () => {
      setup('SYSTEM_ADMIN');
      const statusService = TestBed.inject(ProfileCompletionStatusService);
      expect(statusService.profileComplete()).toBeNull();
    });

    it('adopts the updated section detail and refreshes the shared completion status when a section reports it saved', () => {
      const fixture = setup('PATIENT', profile(), patientDetails({ profileComplete: false }));
      const statusService = TestBed.inject(ProfileCompletionStatusService);
      const updated = patientDetails({ profileComplete: true });

      fixture.componentInstance.onSectionSaved(updated);

      expect(fixture.componentInstance.profile()).toEqual({ ...profile(), ...updated });
      expect(statusService.profileComplete()).toBe(true);
    });

    it("updates profile() and the shared completion status after a Patient's Section 1 save", () => {
      const fixture = setup('PATIENT', profile(), patientDetails({ profileComplete: false }));
      const statusService = TestBed.inject(ProfileCompletionStatusService);
      updateMyProfileSpy.mockReturnValue(of(profile({ biologicalSex: 'FEMALE' })));
      // Section 1's own response no longer carries profileComplete (research.md, data-model.md) —
      // save() re-fetches patient-details afterward to pick this up; simulate that returning true.
      getPatientDetailsSpy.mockReturnValue(of(patientDetails({ profileComplete: true })));

      fixture.componentInstance.save();

      expect(fixture.componentInstance.profile()).toEqual({
        ...profile({ biologicalSex: 'FEMALE' }),
        ...patientDetails({ profileComplete: true }),
      });
      expect(statusService.profileComplete()).toBe(true);
    });
  });

  // 026-user-preferences: Preferences is its own independently-saved panel, fetched separately for
  // every role — matching how the Photo section already works, not part of the Patient section list.
  describe('Preferences panel (026-user-preferences)', () => {
    it('fetches preferences for every role and exposes it via preferences()', () => {
      const fixture = setup('SYSTEM_ADMIN', profile(), patientDetails(), doctorDetails(), preferences({ defaultLandingPage: '/clinics/new' }));

      expect(getPreferencesSpy).toHaveBeenCalled();
      expect(fixture.componentInstance.preferences()).toEqual(preferences({ defaultLandingPage: '/clinics/new' }));
    });

    it('adopts the updated preferences when the panel reports it saved', () => {
      const fixture = setup('SYSTEM_ADMIN');
      const updated = preferences({ defaultLandingPage: '/clinics/new' });

      fixture.componentInstance.onPreferencesSaved(updated);

      expect(fixture.componentInstance.preferences()).toEqual(updated);
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
        profile(),
        patientDetails({ sectionStatus: sectionStatus({ basicInformation: true, insurance: true }) })
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
      const fixture = setup('PATIENT', profile(), patientDetails({ sectionStatus: sectionStatus() }));

      fixture.componentInstance.onSectionSaved(patientDetails({ sectionStatus: sectionStatus({ emergencyContact: true }) }));

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
