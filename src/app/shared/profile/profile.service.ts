import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { MyProfileResponse, UpdateMyProfileRequest, UploadProfilePhotoResponse } from '../models';

/**
 * GET/PATCH /me/profile: the caller's own lean, "operate-the-app" profile — own HttpClient calls
 * per Constitution Principle III. 022-role-details-endpoints narrowed this response to just the
 * fields every page needs (Section 1 + profileComplete); Sections 2-5 and every role's own detail
 * record each have their own endpoint/service instead (research.md #7).
 *
 * `getMyProfile()` is fetched once per page-load and cached in-memory (research.md #7): the app
 * shell calls it on mount for every role to read `profileComplete`, and Edit Profile's own
 * `ngOnInit()` call resolves from that same cache instead of re-fetching. The cache is
 * intentionally not persisted to sessionStorage — the shell's mount-time effect already re-fires
 * on a fresh login and on a page refresh alike, so an in-memory cache naturally refetches once per
 * page-load with no extra bookkeeping.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  private readonly cache = signal<MyProfileResponse | null>(null);

  getMyProfile(): Observable<MyProfileResponse> {
    const cached = this.cache();
    if (cached) {
      return of(cached);
    }
    return this.http.get<MyProfileResponse>('/api/v1/me/profile').pipe(tap((profile) => this.cache.set(profile)));
  }

  updateMyProfile(request: UpdateMyProfileRequest): Observable<MyProfileResponse> {
    return this.http
      .patch<MyProfileResponse>('/api/v1/me/profile', request)
      .pipe(tap((profile) => this.cache.set(profile)));
  }

  /** 024-profile-photo-upload: multipart upload; updates the same cache so every getMyProfile() consumer reflects the new photo with no re-fetch. */
  uploadProfilePhoto(file: File): Observable<UploadProfilePhotoResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadProfilePhotoResponse>('/api/v1/me/profile-photo', formData).pipe(
      tap(({ profilePhotoUrl }) => {
        const current = this.cache();
        if (current) {
          this.cache.set({ ...current, profilePhotoUrl });
        }
      })
    );
  }
}
