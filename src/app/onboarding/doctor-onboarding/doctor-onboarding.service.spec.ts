import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { DoctorOnboardingRequest } from '../../shared/models';

describe('DoctorOnboardingService', () => {
  let service: DoctorOnboardingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DoctorOnboardingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DoctorOnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts a new doctor to /api/v1/clinics/:id/doctors', () => {
    const request: DoctorOnboardingRequest = {
      firstName: 'Dana',
      lastName: 'Doc',
      email: 'dana@example.com',
      dateOfBirth: '1988-01-01',
      specialty: 'Cardiology',
      address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    };

    service.onboardDoctor('clinic-1', request).subscribe();

    const req = httpMock.expectOne('/api/v1/clinics/clinic-1/doctors');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('lists doctors for a clinic', () => {
    service.listDoctors('clinic-1').subscribe();

    const req = httpMock.expectOne('/api/v1/clinics/clinic-1/doctors');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
