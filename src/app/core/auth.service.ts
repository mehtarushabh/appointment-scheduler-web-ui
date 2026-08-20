import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, switchMap, tap } from 'rxjs';

export type UserRole = 'SYSTEM_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'PATIENT';

/** POST /auth/login's response — session/authorization essentials only (research.md #1, feature 003). */
interface LoginResponse {
  token: string;
  role: UserRole;
  clinicId: string | null;
}

/** GET /me's response — display profile only, deliberately kept off LoginResponse (research.md #1). */
interface MeResponse {
  firstName: string;
  lastName: string;
  clinicName: string | null;
}

export interface AuthSession extends LoginResponse, MeResponse {}

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

  /**
   * Chains POST /auth/login -> GET /me and merges both into one AuthSession (research.md #1,
   * feature 003). GET /me is authenticated with the token this call just received, via an
   * explicit header, rather than through the session signal (which isn't set until this whole
   * chain completes) or the auth interceptor.
   */
  login(email: string, password: string): Observable<AuthSession> {
    return this.http.post<LoginResponse>('/api/v1/auth/login', { email, password }).pipe(
      switchMap((login) =>
        this.http
          .get<MeResponse>('/api/v1/me', { headers: new HttpHeaders({ Authorization: `Bearer ${login.token}` }) })
          .pipe(map((me) => ({ ...login, ...me })))
      ),
      tap((session) => {
        this.session.set(session);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
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
