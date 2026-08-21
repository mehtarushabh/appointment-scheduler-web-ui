import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppointmentsListComponent } from './appointments-list.component';
import { AppointmentService } from './appointment.service';
import { AuthService } from '../../core/auth.service';
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
    date: '2026-08-24',
    startTime: '09:00:00',
    durationMinutes: 30,
    state: 'SCHEDULED',
    ...overrides,
  };
}

describe('AppointmentsListComponent', () => {
  let listClinicAppointmentsSpy: ReturnType<typeof vi.fn>;
  let listMyAppointmentsSpy: ReturnType<typeof vi.fn>;
  let cancelAppointmentSpy: ReturnType<typeof vi.fn>;
  let completeAppointmentSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function setup(role: 'CLINIC_ADMIN' | 'DOCTOR', appointments: AppointmentResponse[]) {
    listClinicAppointmentsSpy = vi.fn().mockReturnValue(of(appointments));
    listMyAppointmentsSpy = vi.fn().mockReturnValue(of(appointments));
    cancelAppointmentSpy = vi.fn();
    completeAppointmentSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [AppointmentsListComponent],
      providers: [
        {
          provide: AppointmentService,
          useValue: {
            listClinicAppointments: listClinicAppointmentsSpy,
            listMyAppointments: listMyAppointmentsSpy,
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

  it('shows every clinic appointment for a Clinic Admin session', () => {
    const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' }), appointment({ id: '2' })]);

    expect(listClinicAppointmentsSpy).toHaveBeenCalledWith('clinic-1');
    expect(listMyAppointmentsSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.appointments().map((a) => a.id)).toEqual(['1', '2']);
  });

  it('shows only its own appointments for a Doctor session', () => {
    const fixture = setup('DOCTOR', [appointment({ id: '1' })]);

    expect(listMyAppointmentsSpy).toHaveBeenCalled();
    expect(listClinicAppointmentsSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.appointments().map((a) => a.id)).toEqual(['1']);
  });

  it('cancels a SCHEDULED appointment and updates its state on success', () => {
    const cancelled = appointment({ id: '1', state: 'CANCELLED' });
    const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })]);
    cancelAppointmentSpy.mockReturnValue(of(cancelled));

    fixture.componentInstance.cancel(appointment({ id: '1' }));

    expect(cancelAppointmentSpy).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.appointments()[0].state).toBe('CANCELLED');
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it('completes a SCHEDULED appointment and updates its state on success', () => {
    const completed = appointment({ id: '1', state: 'COMPLETED' });
    const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })]);
    completeAppointmentSpy.mockReturnValue(of(completed));

    fixture.componentInstance.complete(appointment({ id: '1' }));

    expect(completeAppointmentSpy).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.appointments()[0].state).toBe('COMPLETED');
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it('offers no Cancel/Complete action for a CANCELLED or COMPLETED row', () => {
    const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1', state: 'CANCELLED' }), appointment({ id: '2', state: 'COMPLETED' })]);

    expect(fixture.componentInstance.canManage(fixture.componentInstance.appointments()[0])).toBe(false);
    expect(fixture.componentInstance.canManage(fixture.componentInstance.appointments()[1])).toBe(false);
  });

  it('shows a clear empty state when there are no appointments', () => {
    const fixture = setup('CLINIC_ADMIN', []);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no appointments');
  });
});
