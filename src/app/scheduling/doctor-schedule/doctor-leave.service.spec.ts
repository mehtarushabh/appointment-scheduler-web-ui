import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DoctorLeaveService } from './doctor-leave.service';
import { LeaveRequest } from '../../shared/models';

describe('DoctorLeaveService', () => {
  let service: DoctorLeaveService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DoctorLeaveService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DoctorLeaveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists the caller\'s own leave entries', () => {
    service.listMyLeaves().subscribe();
    const req = httpMock.expectOne('/api/v1/me/leaves');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('adds a leave entry', () => {
    const request: LeaveRequest = { date: '2026-08-24', fullDay: true, startTime: null, endTime: null };
    service.addLeave(request).subscribe();
    const req = httpMock.expectOne('/api/v1/me/leaves');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });
});
