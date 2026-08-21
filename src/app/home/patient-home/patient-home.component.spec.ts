import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientHomeComponent } from './patient-home.component';
import { AppointmentService } from '../../scheduling/appointments/appointment.service';
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

describe('PatientHomeComponent', () => {
  function setup(appointments: AppointmentResponse[]) {
    const listMyAppointmentsSpy = vi.fn().mockReturnValue(of(appointments));
    TestBed.configureTestingModule({
      imports: [PatientHomeComponent],
      providers: [{ provide: AppointmentService, useValue: { listMyAppointments: listMyAppointmentsSpy } }],
    });
    const fixture = TestBed.createComponent(PatientHomeComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders', () => {
    expect(() => setup([])).not.toThrow();
  });

  it('splits SCHEDULED appointments from CANCELLED/COMPLETED ones', () => {
    const fixture = setup([
      appointment({ id: '1', state: 'SCHEDULED' }),
      appointment({ id: '2', state: 'CANCELLED' }),
      appointment({ id: '3', state: 'COMPLETED' }),
    ]);

    expect(fixture.componentInstance.upcoming().map((a) => a.id)).toEqual(['1']);
    expect(fixture.componentInstance.past().map((a) => a.id)).toEqual(['2', '3']);
  });

  it('shows a clear empty state when there are no appointments', () => {
    const fixture = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no appointments');
  });
});
