import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClinicProfileUpdateRequest, ClinicResponse, WorkingHoursEntry, WorkingHoursUpdateRequest } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class ClinicSettingsService {
  private readonly http = inject(HttpClient);

  getProfile(clinicId: string): Observable<ClinicResponse> {
    return this.http.get<ClinicResponse>(`/api/v1/clinics/${clinicId}`);
  }

  updateProfile(clinicId: string, request: ClinicProfileUpdateRequest): Observable<ClinicResponse> {
    return this.http.patch<ClinicResponse>(`/api/v1/clinics/${clinicId}`, request);
  }

  getWorkingHours(clinicId: string): Observable<WorkingHoursEntry[]> {
    return this.http.get<WorkingHoursEntry[]>(`/api/v1/clinics/${clinicId}/working-hours`);
  }

  updateWorkingHours(clinicId: string, request: WorkingHoursUpdateRequest): Observable<WorkingHoursEntry[]> {
    return this.http.put<WorkingHoursEntry[]>(`/api/v1/clinics/${clinicId}/working-hours`, request);
  }
}
