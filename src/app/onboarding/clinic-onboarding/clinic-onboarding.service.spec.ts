import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ClinicOnboardingService } from './clinic-onboarding.service';
import { ClinicOnboardingRequest } from '../../shared/models';

describe('ClinicOnboardingService', () => {
  let service: ClinicOnboardingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClinicOnboardingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClinicOnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts a new clinic to /api/v1/clinics', () => {
    const request: ClinicOnboardingRequest = {
      name: 'Riverside Clinic',
      registeredId: 'REG-1',
      address: { addressLine1: '1 River Rd', addressLine2: null, city: 'Riverside', state: 'CA', zip: '92501', country: 'USA' },
      firstClinicAdmin: {
        firstName: 'Cara',
        lastName: 'Admin',
        email: 'cara@example.com',
        dateOfBirth: '1985-05-05',
        address: { addressLine1: '2 Elm St', addressLine2: null, city: 'Riverside', state: 'CA', zip: '92501', country: 'USA' },
      },
    };

    service.onboardClinic(request).subscribe();

    const req = httpMock.expectOne('/api/v1/clinics');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: '1', ...request, firstClinicAdmin: null });
  });

  it('lists clinics from /api/v1/clinics', () => {
    service.listClinics().subscribe();

    const req = httpMock.expectOne('/api/v1/clinics');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
