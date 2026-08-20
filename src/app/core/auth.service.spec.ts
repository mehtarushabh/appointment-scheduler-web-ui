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

  it('sets the current user on successful login, merging the chained GET /me profile call', () => {
    service.login('ada@example.com', 'correct-horse').subscribe();

    const loginReq = httpMock.expectOne('/api/v1/auth/login');
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush({ token: 'jwt-token', role: 'SYSTEM_ADMIN', clinicId: null });

    const meReq = httpMock.expectOne('/api/v1/me');
    expect(meReq.request.method).toBe('GET');
    expect(meReq.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    meReq.flush({ firstName: 'Ada', lastName: 'Admin', clinicName: null });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.role).toBe('SYSTEM_ADMIN');
    expect(service.currentUser()?.firstName).toBe('Ada');
    expect(service.currentUser()?.lastName).toBe('Admin');
    expect(service.currentUser()?.clinicName).toBeNull();
    expect(service.getToken()).toBe('jwt-token');
    expect(JSON.parse(sessionStorage.getItem('appointment-scheduler.session')!).firstName).toBe('Ada');
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
