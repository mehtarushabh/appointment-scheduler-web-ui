import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorListResponse, DoctorOnboardingRequest, UserResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class DoctorOnboardingService {
  private readonly http = inject(HttpClient);

  onboardDoctor(request: DoctorOnboardingRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/v1/clinics/me/doctors', request);
  }

  listDoctors(): Observable<DoctorListResponse[]> {
    return this.http.get<DoctorListResponse[]>('/api/v1/clinics/me/doctors');
  }

  /** 021-user-data-restructuring (research.md #5): backs the Doctors table's expanded row, fetched lazily on first expand. */
  getDoctorProfile(doctorId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`/api/v1/clinics/me/doctors/${doctorId}/profile`);
  }
}
