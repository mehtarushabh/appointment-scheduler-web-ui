import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorOnboardingRequest, UserResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class DoctorOnboardingService {
  private readonly http = inject(HttpClient);

  onboardDoctor(request: DoctorOnboardingRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/v1/clinics/me/doctors', request);
  }

  listDoctors(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>('/api/v1/clinics/me/doctors');
  }
}
