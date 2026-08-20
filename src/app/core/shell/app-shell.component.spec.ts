import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService, AuthSession } from '../auth.service';
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

describe('AppShellComponent', () => {
  function setup(session: AuthSession | null) {
    const authServiceStub = {
      currentUser: () => session,
      isAuthenticated: () => session !== null,
      logout: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceStub }],
    });
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    return { fixture, authServiceStub };
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
    expect(fixture.componentInstance.navLinks().map((l) => l.label)).toEqual(['Doctors', 'Patients', 'Appointments']);
  });

  it('shows the role-appropriate nav links for a Doctor (FR-005)', () => {
    const { fixture } = setup(sessionFor({ role: 'DOCTOR', clinicName: 'Riverside Clinic' }));
    expect(fixture.componentInstance.navLinks().map((l) => l.label)).toEqual(['Patients', 'Appointments']);
    expect(fixture.componentInstance.navLinks()[0].path).toBe('/doctor/patients');
  });

  it('shows the role-appropriate nav links for a Patient (FR-005)', () => {
    const { fixture } = setup(sessionFor({ role: 'PATIENT' }));
    expect(fixture.componentInstance.navLinks().map((l) => l.label)).toEqual(['Schedule appointment', 'Appointments']);
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
});
