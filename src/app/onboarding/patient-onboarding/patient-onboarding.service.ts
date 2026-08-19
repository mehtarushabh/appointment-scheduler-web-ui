import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClinicResponse, UserOnboardingRequest, UserResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PatientOnboardingService {
  private readonly http = inject(HttpClient);

  /** Creates a new Patient, or links an existing one (matched by email) to this clinic (FR-007). */
  onboardOrLinkPatient(clinicId: string, request: UserOnboardingRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`/api/v1/clinics/${clinicId}/patients`, request);
  }

  listPatients(clinicId: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`/api/v1/clinics/${clinicId}/patients`);
  }

  /** The clinics the current authenticated Patient is associated with (FR-013). */
  listMyClinics(): Observable<ClinicResponse[]> {
    return this.http.get<ClinicResponse[]>('/api/v1/me/clinics');
  }
}
