import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService, AuthSession } from '../auth.service';
import { ProfileService } from '../../shared/profile/profile.service';
import { MyProfileResponse } from '../../shared/models';
import { AppShellComponent } from './app-shell.component';

function sessionFor(overrides: Partial<AuthSession>): AuthSession {
  return {
    token: 'jwt',
    role: 'SYSTEM_ADMIN',
    clinicId: null,
    firstName: 'Ada',
    lastName: 'Admin',
    clinicName: null,
    ...overrides,
  };
}

/** 022-role-details-endpoints: this shell only ever needed profileComplete, which now lives on the lean, cached MyProfileResponse. */
function profile(overrides: Partial<MyProfileResponse> = {}): MyProfileResponse {
  return {
    firstName: 'Ada',
    lastName: 'Admin',
    email: 'ada@example.com',
    dateOfBirth: '1990-01-01',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    biologicalSex: null,
    profileComplete: true,
    profilePhotoUrl: null,
    ...overrides,
  };
}

describe('AppShellComponent', () => {
  function setup(session: AuthSession | null, profileResponse: MyProfileResponse = profile()) {
    const authServiceStub = {
      currentUser: () => session,
      isAuthenticated: () => session !== null,
      logout: vi.fn(),
    };
    const getMyProfileSpy = vi.fn().mockReturnValue(of(profileResponse));
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: ProfileService, useValue: { getMyProfile: getMyProfileSpy } },
      ],
    });
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    return { fixture, authServiceStub, getMyProfileSpy };
  }

  it('shows only the title, no nav links or user menu, when nobody is logged in (FR-014)', () => {
    const { fixture } = setup(null);

    expect(fixture.componentInstance.loggedIn()).toBe(false);
    expect(fixture.componentInstance.title()).toBe('Appointment scheduler');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Home');
    expect(text).not.toContain('Logout');
  });

  it('shows "Appointment scheduler" as the title for a System Admin (FR-002)', () => {
    const { fixture } = setup(sessionFor({ role: 'SYSTEM_ADMIN' }));
    expect(fixture.componentInstance.title()).toBe('Appointment scheduler');
  });

  it('shows "Appointment scheduler" as the title for a Patient (FR-002)', () => {
    const { fixture } = setup(sessionFor({ role: 'PATIENT' }));
    expect(fixture.componentInstance.title()).toBe('Appointment scheduler');
  });

  it("shows the user's clinic name as the title for a Clinic Admin (FR-002)", () => {
    const { fixture } = setup(sessionFor({ role: 'CLINIC_ADMIN', clinicName: 'Riverside Clinic' }));
    expect(fixture.componentInstance.title()).toBe('Riverside Clinic');
  });

  it("shows the user's clinic name as the title for a Doctor (FR-002)", () => {
    const { fixture } = setup(sessionFor({ role: 'DOCTOR', clinicName: 'Riverside Clinic' }));
    expect(fixture.componentInstance.title()).toBe('Riverside Clinic');
  });

  it('shows the role-appropriate nav links for a System Admin (FR-005)', () => {
    const { fixture } = setup(sessionFor({ role: 'SYSTEM_ADMIN' }));
    expect(fixture.componentInstance.navLinks()).toEqual([{ label: 'Register new clinic', path: '/clinics/new' }]);
  });

  it('shows the role-appropriate nav links for a Clinic Admin (FR-005)', () => {
    const { fixture } = setup(sessionFor({ role: 'CLINIC_ADMIN', clinicName: 'Riverside Clinic' }));
    expect(fixture.componentInstance.navLinks().map((l) => l.label)).toEqual([
      'Clinic settings',
      'Doctors',
      'Patients',
      'Appointments',
    ]);
  });

  it('shows the role-appropriate nav links for a Doctor (FR-005)', () => {
    const { fixture } = setup(sessionFor({ role: 'DOCTOR', clinicName: 'Riverside Clinic' }));
    expect(fixture.componentInstance.navLinks().map((l) => l.label)).toEqual(['My schedule', 'Patients', 'Appointments']);
    expect(fixture.componentInstance.navLinks()[1].path).toBe('/doctor/patients');
  });

  it('shows the role-appropriate nav links for a Patient — no separate profile tab, Sections 2-5 live in Edit Profile instead (Feature 016)', () => {
    const { fixture } = setup(sessionFor({ role: 'PATIENT' }));
    expect(fixture.componentInstance.navLinks().map((l) => l.label)).toEqual(['Schedule appointment', 'Appointments']);
    expect(fixture.componentInstance.navLinks()[0].path).toBe('/schedule-appointment');
  });

  it("shows the user's full name (FR-003)", () => {
    const { fixture } = setup(sessionFor({ firstName: 'Ada', lastName: 'Admin' }));
    expect(fixture.componentInstance.userName()).toBe('Ada Admin');
  });

  it('logs out and navigates to /login (FR-004)', () => {
    const { fixture, authServiceStub } = setup(sessionFor({}));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    fixture.componentInstance.logout();

    expect(authServiceStub.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  // 022-role-details-endpoints (research.md #7): every role now triggers this one cached fetch on
  // mount, not just Patient — so Edit Profile's own later read resolves from the cache instantly.
  it('fetches profile for every authenticated role, not just Patient', () => {
    const { getMyProfileSpy } = setup(sessionFor({ role: 'CLINIC_ADMIN' }));
    expect(getMyProfileSpy).toHaveBeenCalled();
  });

  it('does not fetch a profile when nobody is logged in', () => {
    const { getMyProfileSpy } = setup(null);
    expect(getMyProfileSpy).not.toHaveBeenCalled();
  });

  it('disables Schedule appointment for a Patient whose fetched profile has profileComplete: false (Feature 016 FR-019/FR-020)', () => {
    const { fixture, getMyProfileSpy } = setup(sessionFor({ role: 'PATIENT' }), profile({ profileComplete: false }));

    expect(getMyProfileSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.scheduleAppointmentDisabled()).toBe(true);

    fixture.detectChanges();
    const disabledButton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Schedule appointment'
    );
    expect(disabledButton).toBeTruthy();
    expect(disabledButton?.disabled).toBe(true);
  });

  it('leaves Schedule appointment enabled for a Patient whose profile is complete', () => {
    const { fixture } = setup(sessionFor({ role: 'PATIENT' }), profile({ profileComplete: true }));
    expect(fixture.componentInstance.scheduleAppointmentDisabled()).toBe(false);
  });

  it('never disables Schedule appointment for a non-Patient role, even though it also fetches a profile', () => {
    const { fixture } = setup(sessionFor({ role: 'CLINIC_ADMIN' }), profile({ profileComplete: false }));
    expect(fixture.componentInstance.scheduleAppointmentDisabled()).toBe(false);
  });

  // 024-profile-photo-upload: read off the same cached GET /me/profile fetch as profileComplete — no second network call.
  describe('profile photo (024-profile-photo-upload)', () => {
    it('shows a placeholder, not the user photo image, when profilePhotoUrl is null', () => {
      const { fixture } = setup(sessionFor({ role: 'SYSTEM_ADMIN' }), profile({ profilePhotoUrl: null }));

      expect(fixture.componentInstance.profilePhotoUrl()).toBeNull();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.app-shell-avatar-placeholder')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.app-shell-avatar')).toBeFalsy();
    });

    it('shows the user photo image next to the name when profilePhotoUrl is set', () => {
      const { fixture } = setup(sessionFor({ role: 'SYSTEM_ADMIN' }), profile({ profilePhotoUrl: 'https://example.com/photo.png' }));

      expect(fixture.componentInstance.profilePhotoUrl()).toBe('https://example.com/photo.png');
      fixture.detectChanges();
      const img = fixture.nativeElement.querySelector('.app-shell-avatar') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toBe('https://example.com/photo.png');
    });

    it('clears the photo when nobody is logged in', () => {
      const { fixture } = setup(null);
      expect(fixture.componentInstance.profilePhotoUrl()).toBeNull();
    });
  });
});
