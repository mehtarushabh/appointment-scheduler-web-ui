import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AppointmentService } from './appointment.service';
import { BookAppointmentRequest } from '../../shared/models';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppointmentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists bookable doctors for a clinic', () => {
    service.listBookableDoctors('clinic-1').subscribe();
    const req = httpMock.expectOne('/api/v1/clinics/clinic-1/doctors/bookable');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets available slots with query params', () => {
    service.getAvailableSlots('clinic-1', 'doctor-1', '2026-08-24', 30).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === '/api/v1/clinics/clinic-1/doctors/doctor-1/available-slots'
        && r.params.get('date') === '2026-08-24'
        && r.params.get('durationMinutes') === '30'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ date: '2026-08-24', durationMinutes: 30, startTimes: [] });
  });

  it('books an appointment', () => {
    const request: BookAppointmentRequest = {
      clinicId: 'clinic-1',
      doctorId: 'doctor-1',
      date: '2026-08-24',
      startTime: '09:00',
      durationMinutes: 30,
    };
    service.bookAppointment(request).subscribe();
    const req = httpMock.expectOne('/api/v1/appointments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it("lists the caller's own appointments", () => {
    service.listMyAppointments().subscribe();
    const req = httpMock.expectOne('/api/v1/me/appointments');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it("lists the caller's own clinic's appointments", () => {
    service.listClinicAppointments().subscribe();
    const req = httpMock.expectOne('/api/v1/clinics/me/appointments');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('cancels an appointment', () => {
    service.cancelAppointment('appt-1').subscribe();
    const req = httpMock.expectOne('/api/v1/appointments/appt-1/cancel');
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('completes an appointment', () => {
    service.completeAppointment('appt-1').subscribe();
    const req = httpMock.expectOne('/api/v1/appointments/appt-1/complete');
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
