import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClinicOnboardingRequest, ClinicResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ClinicOnboardingService {
  private readonly http = inject(HttpClient);

  onboardClinic(request: ClinicOnboardingRequest): Observable<ClinicResponse> {
    return this.http.post<ClinicResponse>('/api/v1/clinics', request);
  }

  listClinics(): Observable<ClinicResponse[]> {
    return this.http.get<ClinicResponse[]>('/api/v1/clinics');
  }
}
