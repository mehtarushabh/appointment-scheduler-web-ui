import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sets the current user on successful login', () => {
    service.login('ada@example.com', 'correct-horse').subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'jwt-token', role: 'SYSTEM_ADMIN', clinicId: null });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.role).toBe('SYSTEM_ADMIN');
    expect(service.getToken()).toBe('jwt-token');
  });

  it('leaves the user unauthenticated when login fails', () => {
    service.login('ada@example.com', 'wrong-password').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ message: 'Invalid email or password.' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });
});
