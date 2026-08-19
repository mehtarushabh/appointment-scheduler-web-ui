import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PatientOnboardingService } from './patient-onboarding.service';
import { UserOnboardingRequest } from '../../shared/models';

describe('PatientOnboardingService', () => {
  let service: PatientOnboardingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PatientOnboardingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientOnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts a patient to /api/v1/clinics/:id/patients', () => {
    const request: UserOnboardingRequest = {
      firstName: 'Pat',
      lastName: 'Ient',
      email: 'pat@example.com',
      dateOfBirth: '1995-03-03',
      address: { addressLine1: '9 Oak St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    };

    service.onboardOrLinkPatient('clinic-1', request).subscribe();

    const req = httpMock.expectOne('/api/v1/clinics/clinic-1/patients');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('lists patients for a clinic', () => {
    service.listPatients('clinic-1').subscribe();
    const req = httpMock.expectOne('/api/v1/clinics/clinic-1/patients');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('lists the current clinics for a patient', () => {
    service.listMyClinics().subscribe();
    const req = httpMock.expectOne('/api/v1/me/clinics');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
