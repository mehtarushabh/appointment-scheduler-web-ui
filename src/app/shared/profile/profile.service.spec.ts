import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileService } from './profile.service';
import { UpdateMyProfileRequest } from '../models';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfileService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets the current user\'s own profile', () => {
    service.getMyProfile().subscribe();
    const req = httpMock.expectOne('/api/v1/me/profile');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('updates the current user\'s own profile', () => {
    const request: UpdateMyProfileRequest = {
      firstName: 'Patricia',
      lastName: 'Userson',
      dateOfBirth: '1991-02-03',
      address: { addressLine1: '2 Oak Ave', addressLine2: null, city: 'Gotham', state: 'NJ', zip: '07001', country: 'USA' },
      doctorDetails: null,
      patientDetails: null,
    };

    service.updateMyProfile(request).subscribe();

    const req = httpMock.expectOne('/api/v1/me/profile');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });
});
