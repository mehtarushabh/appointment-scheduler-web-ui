import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { UpdateUserPreferencesRequest, UserPreferencesResponse } from '../models';

/**
 * GET/PATCH /me/preferences (026-user-preferences): the caller's own preferences, starting with
 * defaultLandingPage. Follows ProfileService's page-load in-memory cache pattern (research.md) —
 * fetched once per page-load and reused, so both the Preferences section and the login flow's
 * redirect decision share one call.
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly http = inject(HttpClient);

  private readonly cache = signal<UserPreferencesResponse | null>(null);

  getPreferences(): Observable<UserPreferencesResponse> {
    const cached = this.cache();
    if (cached) {
      return of(cached);
    }
    return this.http
      .get<UserPreferencesResponse>('/api/v1/me/preferences')
      .pipe(tap((preferences) => this.cache.set(preferences)));
  }

  updatePreferences(request: UpdateUserPreferencesRequest): Observable<UserPreferencesResponse> {
    return this.http
      .patch<UserPreferencesResponse>('/api/v1/me/preferences', request)
      .pipe(tap((preferences) => this.cache.set(preferences)));
  }
}
