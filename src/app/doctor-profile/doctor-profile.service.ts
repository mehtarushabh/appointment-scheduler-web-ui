import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorDetailsResponse, UpdateDoctorDetailsRequest } from '../shared/models';

/**
 * GET/PATCH /me/doctor-details (022-role-details-endpoints): a Doctor's own specialty, its own
 * endpoint mirroring PatientProfileService's pattern for Patient-only sections.
 */
@Injectable({ providedIn: 'root' })
export class DoctorProfileService {
  private readonly http = inject(HttpClient);

  getDoctorDetails(): Observable<DoctorDetailsResponse> {
    return this.http.get<DoctorDetailsResponse>('/api/v1/me/doctor-details');
  }

  updateDoctorDetails(request: UpdateDoctorDetailsRequest): Observable<DoctorDetailsResponse> {
    return this.http.patch<DoctorDetailsResponse>('/api/v1/me/doctor-details', request);
  }
}
