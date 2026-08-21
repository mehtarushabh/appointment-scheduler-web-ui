import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClinicProfileUpdateRequest, ClinicResponse, WorkingHoursEntry, WorkingHoursUpdateRequest } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class ClinicSettingsService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<ClinicResponse> {
    return this.http.get<ClinicResponse>('/api/v1/clinics/me');
  }

  updateProfile(request: ClinicProfileUpdateRequest): Observable<ClinicResponse> {
    return this.http.patch<ClinicResponse>('/api/v1/clinics/me', request);
  }

  /** Also reachable by a Patient associated with this clinic, so this one keeps clinicId in the path. */
  getWorkingHours(clinicId: string): Observable<WorkingHoursEntry[]> {
    return this.http.get<WorkingHoursEntry[]>(`/api/v1/clinics/${clinicId}/working-hours`);
  }

  updateWorkingHours(request: WorkingHoursUpdateRequest): Observable<WorkingHoursEntry[]> {
    return this.http.put<WorkingHoursEntry[]>('/api/v1/clinics/me/working-hours', request);
  }
}
