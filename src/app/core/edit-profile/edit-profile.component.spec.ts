import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EditProfileComponent } from './edit-profile.component';
import { ProfileService } from '../../shared/profile/profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthService, UserRole } from '../auth.service';
import { MyProfileResponse } from '../../shared/models';

function profile(overrides: Partial<MyProfileResponse> = {}): MyProfileResponse {
  return {
    firstName: 'Pat',
    lastName: 'User',
    email: 'pat@example.com',
    dateOfBirth: '1990-01-01',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    doctorDetails: null,
    patientDetails: null,
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

  it('shows the insurance fields for a Patient and saves successfully when all three are blank (SC-006)', () => {
    const fixture = setup('PATIENT', profile({ patientDetails: { insuranceName: null, groupId: null, memberId: null } }));
    expect(fixture.componentInstance.isPatient()).toBe(true);
    expect(fixture.componentInstance.isDoctor()).toBe(false);

    fixture.componentInstance.save();

    expect(updateMyProfileSpy).toHaveBeenCalledWith(
      expect.objectContaining({ patientDetails: { insuranceName: null, groupId: null, memberId: null } })
    );
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it('shows neither role-specific section for a Clinic Admin', () => {
    const fixture = setup('CLINIC_ADMIN');
    expect(fixture.componentInstance.isDoctor()).toBe(false);
    expect(fixture.componentInstance.isPatient()).toBe(false);

    fixture.componentInstance.save();

    expect(updateMyProfileSpy).toHaveBeenCalledWith(expect.objectContaining({ doctorDetails: null, patientDetails: null }));
  });

  it('keeps the entered values and shows an error when the save fails', () => {
    const fixture = setup('SYSTEM_ADMIN');
    updateMyProfileSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed to update profile.' } })));
    fixture.componentInstance.form.patchValue({ lastName: 'Userson' });

    fixture.componentInstance.save();

    expect(fixture.componentInstance.form.getRawValue().lastName).toBe('Userson');
    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed to update profile.');
  });
});
