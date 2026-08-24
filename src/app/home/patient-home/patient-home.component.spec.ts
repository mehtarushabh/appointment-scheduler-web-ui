import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PatientHomeComponent } from './patient-home.component';
import { AppointmentService } from '../../scheduling/appointments/appointment.service';
import { AppointmentResponse } from '../../shared/models';
import { ProfileCompletionStatusService } from '../../shared/profile/profile-completion-status.service';

function appointment(overrides: Partial<AppointmentResponse>): AppointmentResponse {
  return {
    id: '1',
    patientId: 'pat-1',
    patientName: 'Pat Ient',
    doctorId: 'doc-1',
    doctorName: 'Dana Doc',
    clinicId: 'clinic-1',
    clinicName: 'Metropolis Clinic',
    date: '2026-08-24',
    startTime: '09:00:00',
    durationMinutes: 30,
    state: 'SCHEDULED',
    ...overrides,
  };
}

describe('PatientHomeComponent', () => {
  beforeEach(() => {
    // Fixed local "now" so isWithinNextDays()-based filtering is deterministic (feature 010).
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 22, 15, 30, 0)); // 2026-08-22, mid-afternoon
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(appointments: AppointmentResponse[]) {
    const searchMyAppointmentsSpy = vi.fn().mockReturnValue(
      of({ items: appointments, page: 0, size: 100, totalElements: appointments.length, totalPages: 1 })
    );
    const navigateSpy = vi.fn();
    TestBed.configureTestingModule({
      imports: [PatientHomeComponent],
      providers: [
        { provide: AppointmentService, useValue: { searchMyAppointments: searchMyAppointmentsSpy } },
        { provide: Router, useValue: { navigateByUrl: navigateSpy } },
      ],
    });
    const fixture = TestBed.createComponent(PatientHomeComponent);
    fixture.detectChanges();
    return { fixture, searchMyAppointmentsSpy, navigateSpy };
  }

  it('renders', () => {
    expect(() => setup([])).not.toThrow();
  });

  it('requests only its own SCHEDULED appointments within the upcoming week, not its entire history (feature 013)', () => {
    const { searchMyAppointmentsSpy } = setup([appointment({ id: '1' })]);
    expect(searchMyAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { states: ['SCHEDULED'], dateOnOrAfter: '2026-08-22', dateOnOrBefore: '2026-08-28' },
      page: 0,
      size: 100,
    });
  });

  it('only shows SCHEDULED appointments, excluding CANCELLED/COMPLETED ones entirely', () => {
    const { fixture } = setup([
      appointment({ id: '1', date: '2026-08-24', state: 'SCHEDULED' }),
      appointment({ id: '2', date: '2026-08-24', state: 'CANCELLED' }),
      appointment({ id: '3', date: '2026-08-24', state: 'COMPLETED' }),
    ]);

    expect(fixture.componentInstance.upcoming().map((a) => a.id)).toEqual(['1']);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('CANCELLED');
    expect(text).not.toContain('COMPLETED');
  });

  it('shows a clear empty state when there are no appointments', () => {
    const { fixture } = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no appointments');
  });

  it('shows every SCHEDULED appointment within the next 7 days (today through 6 days out, inclusive), with no count-based cap (feature 010)', () => {
    const { fixture } = setup([
      appointment({ id: 'today', date: '2026-08-22' }),
      appointment({ id: 'day-6', date: '2026-08-28' }), // inclusive boundary: today + 6 days
      appointment({ id: 'day-7-excluded', date: '2026-08-29' }), // first excluded day
      appointment({ id: 'yesterday-excluded', date: '2026-08-21' }),
    ]);

    expect(fixture.componentInstance.upcoming().map((a) => a.id)).toEqual(['today', 'day-6']);
  });

  it('shows more than 6 appointments within the window when that many exist, ignoring their listing order (feature 010, supersedes feature 008 preview cap)', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      appointment({ id: `a${i}`, date: '2026-08-22', startTime: `${String(9 + i).padStart(2, '0')}:00:00` })
    ).reverse(); // deliberately out of chronological order
    const { fixture } = setup(many);

    const upcoming = fixture.componentInstance.upcoming();
    expect(upcoming.length).toBe(8);
    expect(upcoming.map((a) => a.id)).toEqual(['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7']);
  });

  // Feature 016 FR-019/FR-020: reads the shared completion cache the shell populates, rather than
  // fetching GET /me/profile itself — see profile-completion-status.service.ts.
  describe('incomplete-profile banner (Feature 016)', () => {
    it('shows the banner and navigates to Edit Profile when "Complete now" is clicked', () => {
      const { fixture, navigateSpy } = setup([]);
      TestBed.inject(ProfileCompletionStatusService).set(false);
      fixture.detectChanges();

      expect(fixture.componentInstance.profileIncomplete()).toBe(true);
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Your profile is incomplete');

      fixture.componentInstance.goToEditProfile();
      expect(navigateSpy).toHaveBeenCalledWith('/edit-profile');
    });

    it('hides the banner once the profile is complete', () => {
      const { fixture } = setup([]);
      TestBed.inject(ProfileCompletionStatusService).set(true);
      fixture.detectChanges();

      expect(fixture.componentInstance.profileIncomplete()).toBe(false);
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).not.toContain('Your profile is incomplete');
    });

    it('hides the banner while completion status is not yet known', () => {
      const { fixture } = setup([]);
      expect(fixture.componentInstance.profileIncomplete()).toBe(false);
    });
  });
});
