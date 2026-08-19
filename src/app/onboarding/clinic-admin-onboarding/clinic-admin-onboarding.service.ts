import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserOnboardingRequest, UserResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ClinicAdminOnboardingService {
  private readonly http = inject(HttpClient);

  onboardClinicAdmin(clinicId: string, request: UserOnboardingRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`/api/v1/clinics/${clinicId}/clinic-admins`, request);
  }
}
