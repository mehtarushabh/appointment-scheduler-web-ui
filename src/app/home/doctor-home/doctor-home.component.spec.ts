import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DoctorHomeComponent } from './doctor-home.component';
import { AppointmentService } from '../../scheduling/appointments/appointment.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AppointmentResponse } from '../../shared/models';

function appointment(overrides: Partial<AppointmentResponse>): AppointmentResponse {
  return {
    id: '1',
    patientId: 'pat-1',
    patientName: 'Pat Ient',
    doctorId: 'doc-1',
    doctorName: 'Dana Doc',
    clinicId: 'clinic-1',
    clinicName: 'Metropolis Clinic',
    date: '2026-08-22',
    startTime: '09:00:00',
    durationMinutes: 30,
    state: 'SCHEDULED',
    ...overrides,
  };
}

describe('DoctorHomeComponent', () => {
  let cancelAppointmentSpy: ReturnType<typeof vi.fn>;
  let completeAppointmentSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Fixed local "now" so isToday()/isPastDue()-based filtering is deterministic (feature 010, 012).
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 22, 15, 30, 0)); // 2026-08-22, mid-afternoon
    cancelAppointmentSpy = vi.fn();
    completeAppointmentSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(appointments: AppointmentResponse[]) {
    const searchMyAppointmentsSpy = vi.fn().mockReturnValue(
      of({ items: appointments, page: 0, size: 100, totalElements: appointments.length, totalPages: 1 })
    );
    TestBed.configureTestingModule({
      imports: [DoctorHomeComponent],
      providers: [
        {
          provide: AppointmentService,
          useValue: {
            searchMyAppointments: searchMyAppointmentsSpy,
            cancelAppointment: cancelAppointmentSpy,
            completeAppointment: completeAppointmentSpy,
          },
        },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
    const fixture = TestBed.createComponent(DoctorHomeComponent);
    fixture.detectChanges();
    return { fixture, searchMyAppointmentsSpy };
  }

  it("requests only its own SCHEDULED appointments on or before today, not its entire history (feature 013)", () => {
    const { fixture, searchMyAppointmentsSpy } = setup([appointment({ id: '1' })]);
    expect(searchMyAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { states: ['SCHEDULED'], dateOnOrBefore: '2026-08-22' },
      page: 0,
      size: 100,
    });
    expect(fixture.componentInstance.todaysAppointments().length).toBe(1);
  });

  it('shows only appointments dated today and still SCHEDULED (feature 010), excluding today-but-cancelled, tomorrow-scheduled, and yesterday', () => {
    const { fixture } = setup([
      appointment({ id: 'today-scheduled', date: '2026-08-22', state: 'SCHEDULED' }),
      appointment({ id: 'today-cancelled', date: '2026-08-22', state: 'CANCELLED' }),
      appointment({ id: 'tomorrow-scheduled', date: '2026-08-23', state: 'SCHEDULED' }),
      appointment({ id: 'yesterday-scheduled', date: '2026-08-21', state: 'SCHEDULED' }),
    ]);

    expect(fixture.componentInstance.todaysAppointments().map((a) => a.id)).toEqual(['today-scheduled']);
  });

  it('shows a clear empty state when there are no appointments today', () => {
    const { fixture } = setup([appointment({ id: '1', date: '2026-08-23' })]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no appointments');
  });

  it('renders appointments with the patient name (feature 008)', () => {
    const { fixture } = setup([appointment({ id: '1', patientName: 'Pat Ient' })]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Pat Ient');
  });

  describe('past-due appointments (feature 012)', () => {
    it('shows an "Overdue appointments" section only when a SCHEDULED appointment is dated before today', () => {
      const { fixture } = setup([appointment({ id: 'overdue', date: '2026-08-15', state: 'SCHEDULED' })]);

      expect(fixture.componentInstance.pastDueAppointments().map((a) => a.id)).toEqual(['overdue']);
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Overdue appointments');
    });

    it('omits the section entirely when nothing is past-due', () => {
      const { fixture } = setup([appointment({ id: 'today-scheduled', date: '2026-08-22', state: 'SCHEDULED' })]);

      expect(fixture.componentInstance.pastDueAppointments()).toEqual([]);
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).not.toContain('Overdue appointments');
    });

    it('never treats a today-dated or future-dated appointment as past-due', () => {
      const { fixture } = setup([
        appointment({ id: 'today', date: '2026-08-22', state: 'SCHEDULED' }),
        appointment({ id: 'tomorrow', date: '2026-08-23', state: 'SCHEDULED' }),
      ]);

      expect(fixture.componentInstance.pastDueAppointments()).toEqual([]);
    });

    it('never treats a CANCELLED or COMPLETED past appointment as past-due', () => {
      const { fixture } = setup([
        appointment({ id: 'past-cancelled', date: '2026-08-15', state: 'CANCELLED' }),
        appointment({ id: 'past-completed', date: '2026-08-10', state: 'COMPLETED' }),
      ]);

      expect(fixture.componentInstance.pastDueAppointments()).toEqual([]);
    });

    it('sorts multiple past-due appointments oldest-date-first (most overdue first)', () => {
      const { fixture } = setup([
        appointment({ id: 'less-overdue', date: '2026-08-20', state: 'SCHEDULED' }),
        appointment({ id: 'most-overdue', date: '2026-08-10', state: 'SCHEDULED' }),
      ]);

      expect(fixture.componentInstance.pastDueAppointments().map((a) => a.id)).toEqual(['most-overdue', 'less-overdue']);
    });

    it('completes a past-due appointment, removing it from the section and showing a success toast', () => {
      const overdue = appointment({ id: 'overdue', date: '2026-08-15', state: 'SCHEDULED' });
      const completed = { ...overdue, state: 'COMPLETED' as const };
      const { fixture } = setup([overdue]);
      completeAppointmentSpy.mockReturnValue(of(completed));

      fixture.componentInstance.complete(overdue);

      expect(completeAppointmentSpy).toHaveBeenCalledWith('overdue');
      expect(fixture.componentInstance.pastDueAppointments()).toEqual([]);
      expect(notificationServiceStub.success).toHaveBeenCalled();
    });

    it('cancels a past-due appointment, removing it from the section and showing a success toast', () => {
      const overdue = appointment({ id: 'overdue', date: '2026-08-15', state: 'SCHEDULED' });
      const cancelled = { ...overdue, state: 'CANCELLED' as const };
      const { fixture } = setup([overdue]);
      cancelAppointmentSpy.mockReturnValue(of(cancelled));

      fixture.componentInstance.cancel(overdue);

      expect(cancelAppointmentSpy).toHaveBeenCalledWith('overdue');
      expect(fixture.componentInstance.pastDueAppointments()).toEqual([]);
      expect(notificationServiceStub.success).toHaveBeenCalled();
    });

    it('shows an error toast and keeps the appointment in the section when Complete fails', () => {
      const overdue = appointment({ id: 'overdue', date: '2026-08-15', state: 'SCHEDULED' });
      const { fixture } = setup([overdue]);
      completeAppointmentSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed to complete appointment.' } })));

      fixture.componentInstance.complete(overdue);

      expect(fixture.componentInstance.pastDueAppointments().map((a) => a.id)).toEqual(['overdue']);
      expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed to complete appointment.');
    });

    it('shows an error toast and keeps the appointment in the section when Cancel fails', () => {
      const overdue = appointment({ id: 'overdue', date: '2026-08-15', state: 'SCHEDULED' });
      const { fixture } = setup([overdue]);
      cancelAppointmentSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed to cancel appointment.' } })));

      fixture.componentInstance.cancel(overdue);

      expect(fixture.componentInstance.pastDueAppointments().map((a) => a.id)).toEqual(['overdue']);
      expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed to cancel appointment.');
    });
  });
});
