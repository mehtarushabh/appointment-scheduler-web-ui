import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type UserRole = 'SYSTEM_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'PATIENT';

export interface AuthSession {
  token: string;
  role: UserRole;
  clinicId: string | null;
}

const SESSION_STORAGE_KEY = 'appointment-scheduler.session';

/**
 * Foundational auth state (research.md #2, #3): stateless bearer-token session held in a signal
 * and mirrored to sessionStorage so a page refresh doesn't lose it. This is the minimal login
 * capability needed to exercise the onboarding user stories — the polished Login Page is APP-2.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<AuthSession | null>(this.restoreSession());

  readonly currentUser = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<AuthSession> {
    return this.http.post<AuthSession>('/api/v1/auth/login', { email, password }).pipe(
      tap((result) => {
        this.session.set(result);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(result));
      })
    );
  }

  logout(): void {
    this.session.set(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  getToken(): string | null {
    return this.session()?.token ?? null;
  }

  /** FR-021: available any time to any logged-in user; never a forced step. */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>('/api/v1/me/password', { currentPassword, newPassword });
  }

  hasRole(role: UserRole): boolean {
    return this.session()?.role === role;
  }

  private restoreSession(): AuthSession | null {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthSession) : null;
  }
}
