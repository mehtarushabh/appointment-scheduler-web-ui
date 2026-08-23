import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MyProfileResponse, UpdateMyProfileRequest } from '../models';

/** GET/PATCH /me/profile (Feature 011): the caller's own editable profile, own HttpClient calls per Constitution Principle III. */
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
