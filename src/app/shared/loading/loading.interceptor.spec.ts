import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from './loading.service';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loadingInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loadingService = TestBed.inject(LoadingService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('reports loading while a request is in flight, and stops once it succeeds', () => {
    http.get('/api/v1/me').subscribe();
    expect(loadingService.isLoading()).toBe(true);

    httpMock.expectOne('/api/v1/me').flush({});
    expect(loadingService.isLoading()).toBe(false);
  });

  it('stops reporting loading once a request fails too', () => {
    http.get('/api/v1/me').subscribe({ error: () => {} });
    expect(loadingService.isLoading()).toBe(true);

    httpMock.expectOne('/api/v1/me').flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    expect(loadingService.isLoading()).toBe(false);
  });

  it('stays loading across overlapping requests until the last one finishes', () => {
    http.get('/api/v1/a').subscribe();
    http.get('/api/v1/b').subscribe();
    expect(loadingService.isLoading()).toBe(true);

    httpMock.expectOne('/api/v1/a').flush({});
    expect(loadingService.isLoading()).toBe(true);

    httpMock.expectOne('/api/v1/b').flush({});
    expect(loadingService.isLoading()).toBe(false);
  });
});
