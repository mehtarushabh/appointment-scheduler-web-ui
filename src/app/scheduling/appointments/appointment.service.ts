import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AppointmentResponse,
  AvailableSlotsResponse,
  BookAppointmentRequest,
  DoctorSummaryResponse,
} from '../../shared/models';

/**
 * Shared across the Patient booking flow (User Story 2) and the Clinic Admin/Doctor appointments
 * list (User Story 4) — one service for every `/appointments`-family endpoint, per Constitution
 * Principle III.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);

  listBookableDoctors(clinicId: string): Observable<DoctorSummaryResponse[]> {
    return this.http.get<DoctorSummaryResponse[]>(`/api/v1/clinics/${clinicId}/doctors/bookable`);
  }

  getAvailableSlots(clinicId: string, doctorId: string, date: string, durationMinutes: number): Observable<AvailableSlotsResponse> {
    return this.http.get<AvailableSlotsResponse>(`/api/v1/clinics/${clinicId}/doctors/${doctorId}/available-slots`, {
      params: { date, durationMinutes },
    });
  }

  bookAppointment(request: BookAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>('/api/v1/appointments', request);
  }

  listMyAppointments(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>('/api/v1/me/appointments');
  }

  listClinicAppointments(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>('/api/v1/clinics/me/appointments');
  }

  cancelAppointment(appointmentId: string): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`/api/v1/appointments/${appointmentId}/cancel`, {});
  }

  completeAppointment(appointmentId: string): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`/api/v1/appointments/${appointmentId}/complete`, {});
  }
}
