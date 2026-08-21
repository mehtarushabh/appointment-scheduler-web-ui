import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ClinicSettingsService } from './clinic-settings.service';
import { ClinicProfileUpdateRequest, WorkingHoursUpdateRequest } from '../../../shared/models';

describe('ClinicSettingsService', () => {
  let service: ClinicSettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClinicSettingsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClinicSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets a clinic profile', () => {
    service.getProfile().subscribe();
    const req = httpMock.expectOne('/api/v1/clinics/me');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('updates a clinic profile', () => {
    const request: ClinicProfileUpdateRequest = {
      name: 'Renamed Clinic',
      address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    };

    service.updateProfile(request).subscribe();

    const req = httpMock.expectOne('/api/v1/clinics/me');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('gets working hours', () => {
    service.getWorkingHours('clinic-1').subscribe();
    const req = httpMock.expectOne('/api/v1/clinics/clinic-1/working-hours');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('updates working hours', () => {
    const request: WorkingHoursUpdateRequest = {
      days: [{ dayOfWeek: 'MONDAY', isOpen: true, startTime: '08:00', endTime: '17:00' }],
    };

    service.updateWorkingHours(request).subscribe();

    const req = httpMock.expectOne('/api/v1/clinics/me/working-hours');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush([]);
  });
});
