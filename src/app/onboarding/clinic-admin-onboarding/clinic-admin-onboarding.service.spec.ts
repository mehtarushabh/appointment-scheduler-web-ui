import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ClinicAdminOnboardingService } from './clinic-admin-onboarding.service';
import { UserOnboardingRequest } from '../../shared/models';

describe('ClinicAdminOnboardingService', () => {
  let service: ClinicAdminOnboardingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClinicAdminOnboardingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClinicAdminOnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts a new clinic admin to /api/v1/clinics/:id/clinic-admins', () => {
    const request: UserOnboardingRequest = {
      firstName: 'Second',
      lastName: 'Admin',
      email: 'second@example.com',
      dateOfBirth: '1990-01-01',
      address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    };

    service.onboardClinicAdmin('clinic-1', request).subscribe();

    const req = httpMock.expectOne('/api/v1/clinics/clinic-1/clinic-admins');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });
});
