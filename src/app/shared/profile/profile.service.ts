import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MyProfileResponse, UpdateMyProfileRequest } from '../models';

/**
 * GET/PATCH /me/profile: the caller's own profile, own HttpClient calls per Constitution
 * Principle III. GET returns every section in one combined read (Feature 016 research.md #16);
 * PATCH covers only Section 1 (+ biologicalSex/personalPhone for a Patient) and doctorDetails —
 * Sections 2-5 each have their own endpoint, called from PatientProfileService instead.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  getMyProfile(): Observable<MyProfileResponse> {
    return this.http.get<MyProfileResponse>('/api/v1/me/profile');
  }

  updateMyProfile(request: UpdateMyProfileRequest): Observable<MyProfileResponse> {
    return this.http.patch<MyProfileResponse>('/api/v1/me/profile', request);
  }
}
