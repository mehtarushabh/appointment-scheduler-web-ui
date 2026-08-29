import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileService } from './profile.service';
import { MyProfileResponse, UpdateMyProfileRequest } from '../models';

function profile(overrides: Partial<MyProfileResponse> = {}): MyProfileResponse {
  return {
    firstName: 'Pat',
    lastName: 'User',
    email: 'pat@example.com',
    dateOfBirth: '1990-01-01',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    biologicalSex: null,
    profileComplete: true,
    profilePhotoUrl: null,
    ...overrides,
  };
}

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
    req.flush(profile());
  });

  it('updates the current user\'s own profile', () => {
    const request: UpdateMyProfileRequest = {
      firstName: 'Patricia',
      lastName: 'Userson',
      dateOfBirth: '1991-02-03',
      address: { addressLine1: '2 Oak Ave', addressLine2: null, city: 'Gotham', state: 'NJ', zip: '07001', country: 'USA' },
      biologicalSex: null,
    };

    service.updateMyProfile(request).subscribe();

    const req = httpMock.expectOne('/api/v1/me/profile');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush(profile());
  });

  // 022-role-details-endpoints, research.md #7: fetched once per page-load and reused, so the
  // app shell (every role) and Edit Profile don't each trigger their own GET /me/profile.
  describe('in-memory caching (022-role-details-endpoints)', () => {
    it('fetches over the network on the first call and caches the result', () => {
      const emitted: MyProfileResponse[] = [];
      service.getMyProfile().subscribe((p) => emitted.push(p));

      httpMock.expectOne('/api/v1/me/profile').flush(profile({ firstName: 'Ada' }));

      expect(emitted).toEqual([profile({ firstName: 'Ada' })]);
    });

    it('returns the cached value on a second call with no second HTTP request', () => {
      service.getMyProfile().subscribe();
      httpMock.expectOne('/api/v1/me/profile').flush(profile({ firstName: 'Ada' }));

      const emitted: MyProfileResponse[] = [];
      service.getMyProfile().subscribe((p) => emitted.push(p));

      httpMock.expectNone('/api/v1/me/profile');
      expect(emitted).toEqual([profile({ firstName: 'Ada' })]);
    });

    it('updates the cache on a successful save, so a later getMyProfile() reflects it with no extra fetch', () => {
      service.getMyProfile().subscribe();
      httpMock.expectOne('/api/v1/me/profile').flush(profile({ firstName: 'Ada' }));

      const request: UpdateMyProfileRequest = {
        firstName: 'Adaline',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        address: profile().address,
        biologicalSex: null,
      };
      service.updateMyProfile(request).subscribe();
      httpMock.expectOne({ url: '/api/v1/me/profile', method: 'PATCH' }).flush(profile({ firstName: 'Adaline' }));

      const emitted: MyProfileResponse[] = [];
      service.getMyProfile().subscribe((p) => emitted.push(p));

      httpMock.expectNone('/api/v1/me/profile');
      expect(emitted).toEqual([profile({ firstName: 'Adaline' })]);
    });
  });

  // 024-profile-photo-upload
  describe('uploadProfilePhoto', () => {
    it('posts the file as multipart form data', () => {
      const file = new File([new Uint8Array(10)], 'photo.png', { type: 'image/png' });

      service.uploadProfilePhoto(file).subscribe();

      const req = httpMock.expectOne('/api/v1/me/profile-photo');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      expect((req.request.body as FormData).get('file')).toBe(file);
      req.flush({ profilePhotoUrl: 'https://example.com/photo.png' });
    });

    it('updates the cached profile with the new photo URL, so a later getMyProfile() reflects it with no extra fetch', () => {
      service.getMyProfile().subscribe();
      httpMock.expectOne('/api/v1/me/profile').flush(profile({ profilePhotoUrl: null }));

      const file = new File([new Uint8Array(10)], 'photo.png', { type: 'image/png' });
      service.uploadProfilePhoto(file).subscribe();
      httpMock.expectOne('/api/v1/me/profile-photo').flush({ profilePhotoUrl: 'https://example.com/photo.png' });

      const emitted: MyProfileResponse[] = [];
      service.getMyProfile().subscribe((p) => emitted.push(p));

      httpMock.expectNone('/api/v1/me/profile');
      expect(emitted).toEqual([profile({ profilePhotoUrl: 'https://example.com/photo.png' })]);
    });

    it('does not update the cache when nothing has been fetched yet', () => {
      const file = new File([new Uint8Array(10)], 'photo.png', { type: 'image/png' });

      service.uploadProfilePhoto(file).subscribe();
      httpMock.expectOne('/api/v1/me/profile-photo').flush({ profilePhotoUrl: 'https://example.com/photo.png' });

      service.getMyProfile().subscribe();
      httpMock.expectOne('/api/v1/me/profile').flush(profile());
    });
  });
});
