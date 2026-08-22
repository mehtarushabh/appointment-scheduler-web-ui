import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClinicAdminHomeComponent } from './clinic-admin-home.component';
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

describe('ClinicAdminHomeComponent', () => {
  function setup(appointments: AppointmentResponse[]) {
    const listClinicAppointmentsSpy = vi.fn().mockReturnValue(of(appointments));
    TestBed.configureTestingModule({
      imports: [ClinicAdminHomeComponent],
      providers: [{ provide: AppointmentService, useValue: { listClinicAppointments: listClinicAppointmentsSpy } }],
    });
    const fixture = TestBed.createComponent(ClinicAdminHomeComponent);
    fixture.detectChanges();
    return { fixture, listClinicAppointmentsSpy };
  }

  it('loads the whole clinic\'s appointments on init', () => {
    const { fixture, listClinicAppointmentsSpy } = setup([appointment({ id: '1' })]);
    expect(listClinicAppointmentsSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.upcoming().length).toBe(1);
  });

  it('splits SCHEDULED appointments from CANCELLED/COMPLETED ones', () => {
    const { fixture } = setup([
      appointment({ id: '1', state: 'SCHEDULED' }),
      appointment({ id: '2', state: 'CANCELLED' }),
      appointment({ id: '3', state: 'COMPLETED' }),
    ]);

    expect(fixture.componentInstance.upcoming().map((a) => a.id)).toEqual(['1']);
    expect(fixture.componentInstance.past().map((a) => a.id)).toEqual(['2', '3']);
  });

  it('shows a clear empty state when there are no appointments', () => {
    const { fixture } = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no appointments');
  });

  it('renders upcoming appointments with patient and doctor names (feature 008)', () => {
    const { fixture } = setup([appointment({ id: '1', patientName: 'Pat Ient', doctorName: 'Dana Doc' })]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Pat Ient');
    expect(text).toContain('Dana Doc');
  });

  it('previews only the soonest 6 upcoming appointments, ignoring their listing order (feature 008)', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      appointment({ id: `a${i}`, date: '2026-09-01', startTime: `${String(10 + i).padStart(2, '0')}:00:00` })
    ).reverse(); // deliberately out of chronological order
    const { fixture } = setup(many);

    const upcoming = fixture.componentInstance.upcoming();
    expect(upcoming.length).toBe(6);
    expect(upcoming.map((a) => a.id)).toEqual(['a0', 'a1', 'a2', 'a3', 'a4', 'a5']);
  });
});
