import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { AppointmentsListComponent } from './appointments-list.component';
import { AppointmentService } from './appointment.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AppointmentResponse, PageResponse } from '../../shared/models';

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

function page(items: AppointmentResponse[], overrides: Partial<PageResponse<AppointmentResponse>> = {}): PageResponse<AppointmentResponse> {
  return { items, page: 0, size: 50, totalElements: items.length, totalPages: 1, ...overrides };
}

describe('AppointmentsListComponent', () => {
  let searchClinicAppointmentsSpy: ReturnType<typeof vi.fn>;
  let searchMyAppointmentsSpy: ReturnType<typeof vi.fn>;
  let cancelAppointmentSpy: ReturnType<typeof vi.fn>;
  let completeAppointmentSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function setup(
    role: 'CLINIC_ADMIN' | 'DOCTOR' | 'PATIENT',
    scheduledItems: AppointmentResponse[],
    pastItems: AppointmentResponse[] = []
  ) {
    searchClinicAppointmentsSpy = vi.fn().mockImplementation((request) =>
      of(page(request.criteria.states.includes('SCHEDULED') ? scheduledItems : pastItems))
    );
    searchMyAppointmentsSpy = vi.fn().mockImplementation((request) =>
      of(page(request.criteria.states.includes('SCHEDULED') ? scheduledItems : pastItems))
    );
    cancelAppointmentSpy = vi.fn();
    completeAppointmentSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [AppointmentsListComponent],
      providers: [
        {
          provide: AppointmentService,
          useValue: {
            searchClinicAppointments: searchClinicAppointmentsSpy,
            searchMyAppointments: searchMyAppointmentsSpy,
            cancelAppointment: cancelAppointmentSpy,
            completeAppointment: completeAppointmentSpy,
          },
        },
        { provide: AuthService, useValue: { currentUser: () => ({ role, clinicId: 'clinic-1', token: 't' }) } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
    const fixture = TestBed.createComponent(AppointmentsListComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('requests page 0 of both the Scheduled and Past criteria for a Clinic Admin session, from the clinic-scoped endpoint', () => {
    setup('CLINIC_ADMIN', [appointment({ id: '1' })], [appointment({ id: '2', state: 'COMPLETED' })]);

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({ criteria: { states: ['SCHEDULED'] }, page: 0, size: 50 });
    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { states: ['CANCELLED', 'COMPLETED'] },
      page: 0,
      size: 50,
    });
    expect(searchMyAppointmentsSpy).not.toHaveBeenCalled();
  });

  it("requests page 0 of both criteria for a Doctor session, from the caller's-own endpoint", () => {
    setup('DOCTOR', [appointment({ id: '1' })]);

    expect(searchMyAppointmentsSpy).toHaveBeenCalledWith({ criteria: { states: ['SCHEDULED'] }, page: 0, size: 50 });
    expect(searchClinicAppointmentsSpy).not.toHaveBeenCalled();
  });

  it('cancels a SCHEDULED appointment, removing it from the Scheduled table and showing a success toast', () => {
    const scheduled = appointment({ id: '1' });
    const fixture = setup('CLINIC_ADMIN', [scheduled]);
    cancelAppointmentSpy.mockReturnValue(of({ ...scheduled, state: 'CANCELLED' as const }));

    fixture.componentInstance.cancel(scheduled);

    expect(cancelAppointmentSpy).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.scheduledAppointments()).toEqual([]);
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it('completes a SCHEDULED appointment, removing it from the Scheduled table and showing a success toast', () => {
    const scheduled = appointment({ id: '1' });
    const fixture = setup('CLINIC_ADMIN', [scheduled]);
    completeAppointmentSpy.mockReturnValue(of({ ...scheduled, state: 'COMPLETED' as const }));

    fixture.componentInstance.complete(scheduled);

    expect(completeAppointmentSpy).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.scheduledAppointments()).toEqual([]);
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it('keeps the appointment in the Scheduled table and shows an error toast when Cancel fails', () => {
    const scheduled = appointment({ id: '1' });
    const fixture = setup('CLINIC_ADMIN', [scheduled]);
    cancelAppointmentSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed to cancel appointment.' } })));

    fixture.componentInstance.cancel(scheduled);

    expect(fixture.componentInstance.scheduledAppointments().map((a) => a.id)).toEqual(['1']);
    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed to cancel appointment.');
  });

  it('offers no Cancel/Complete action for a CANCELLED or COMPLETED row', () => {
    const fixture = setup('CLINIC_ADMIN', [], [appointment({ id: '1', state: 'CANCELLED' }), appointment({ id: '2', state: 'COMPLETED' })]);

    expect(fixture.componentInstance.canManage(fixture.componentInstance.pastAppointments()[0])).toBe(false);
    expect(fixture.componentInstance.canManage(fixture.componentInstance.pastAppointments()[1])).toBe(false);
  });

  it('shows a clear empty state in both tables when there are no appointments at all', () => {
    const fixture = setup('CLINIC_ADMIN', [], []);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no scheduled appointments');
    expect(text.toLowerCase()).toContain('no past appointments');
  });

  it("shows a Patient's own appointments, without the Patient column or Cancel/Complete actions (bugfix)", () => {
    const fixture = setup('PATIENT', [appointment({ id: '1', state: 'SCHEDULED' })]);

    expect(searchMyAppointmentsSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.scheduledColumns()).toEqual(['doctorName', 'date', 'startTime', 'state']);
    expect(fixture.componentInstance.pastColumns()).toEqual(['doctorName', 'date', 'startTime', 'state']);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Cancel');
    expect(text).not.toContain('Complete');
    const headers = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).not.toContain('Patient');
  });

  it("keeps the Scheduled and Past tables independently populated from their own criteria-scoped response (feature 013)", () => {
    const fixture = setup(
      'CLINIC_ADMIN',
      [appointment({ id: 'scheduled-1', state: 'SCHEDULED' })],
      [appointment({ id: 'cancelled-1', state: 'CANCELLED' }), appointment({ id: 'completed-1', state: 'COMPLETED' })]
    );

    expect(fixture.componentInstance.scheduledAppointments().map((a) => a.id)).toEqual(['scheduled-1']);
    expect(fixture.componentInstance.pastAppointments().map((a) => a.id).sort()).toEqual(['cancelled-1', 'completed-1']);
  });

  it.each(['CLINIC_ADMIN', 'DOCTOR', 'PATIENT'] as const)(
    'never includes an "actions" column in the past table for a %s session (feature 010)',
    (role) => {
      const fixture = setup(role, [], []);
      expect(fixture.componentInstance.pastColumns()).not.toContain('actions');
    }
  );

  it('resolving a scheduled appointment removes it from the Scheduled table live, without a reload (feature 010) — the Past table is refreshed separately, not live-synced (feature 013)', () => {
    const scheduled = appointment({ id: '1', state: 'SCHEDULED' });
    const fixture = setup('CLINIC_ADMIN', [scheduled]);
    cancelAppointmentSpy.mockReturnValue(of({ ...scheduled, state: 'CANCELLED' as const }));
    expect(fixture.componentInstance.scheduledAppointments().map((a) => a.id)).toEqual(['1']);

    fixture.componentInstance.cancel(scheduled);

    expect(fixture.componentInstance.scheduledAppointments()).toEqual([]);
  });

  describe('paging (feature 013)', () => {
    it("requests only the next page of the Scheduled table when its paginator advances, leaving the Past table's page untouched", () => {
      const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })], [appointment({ id: '2', state: 'COMPLETED' })]);
      searchClinicAppointmentsSpy.mockClear();
      searchClinicAppointmentsSpy.mockImplementation((request) => of(page([appointment({ id: 'page-2' })], { page: request.page })));

      fixture.componentInstance.onScheduledPage({ pageIndex: 1, pageSize: 50, length: 100 } as PageEvent);

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledTimes(1);
      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({ criteria: { states: ['SCHEDULED'] }, page: 1, size: 50 });
      expect(fixture.componentInstance.scheduledAppointments().map((a) => a.id)).toEqual(['page-2']);
    });

    it("requests only the next page of the Past table when its paginator advances, leaving the Scheduled table's page untouched", () => {
      const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })], [appointment({ id: '2', state: 'COMPLETED' })]);
      searchClinicAppointmentsSpy.mockClear();
      searchClinicAppointmentsSpy.mockImplementation((request) =>
        of(page([appointment({ id: 'past-page-2', state: 'COMPLETED' })], { page: request.page }))
      );

      fixture.componentInstance.onPastPage({ pageIndex: 1, pageSize: 50, length: 100 } as PageEvent);

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledTimes(1);
      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
        criteria: { states: ['CANCELLED', 'COMPLETED'] },
        page: 1,
        size: 50,
      });
      expect(fixture.componentInstance.pastAppointments().map((a) => a.id)).toEqual(['past-page-2']);
    });

    it("reflects the response's totalElements as the Scheduled paginator's length", () => {
      const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })]);
      searchClinicAppointmentsSpy.mockClear();
      searchClinicAppointmentsSpy.mockImplementation((request) =>
        of(page([appointment({ id: '1' })], { totalElements: 237, page: request.page }))
      );

      fixture.componentInstance.onScheduledPage({ pageIndex: 0, pageSize: 50, length: 0 } as PageEvent);

      expect(fixture.componentInstance.scheduledTotalElements()).toBe(237);
    });
  });
});
