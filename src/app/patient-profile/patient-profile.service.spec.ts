import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PatientProfileService } from './patient-profile.service';
import { UpdateClinicalHistoryRequest, UpdateEmergencyContactRequest, UpdateInsuranceRequest } from '../shared/models';

describe('PatientProfileService', () => {
  let service: PatientProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PatientProfileService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs /me/patient-details', () => {
    service.getPatientDetails().subscribe();

    const req = httpMock.expectOne('/api/v1/me/patient-details');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('PATCHes /me/patient-details/insurance', () => {
    const request: UpdateInsuranceRequest = {
      insuranceName: 'Acme',
      memberId: 'MEM-1',
      groupId: null,
      hasNoGroupNumber: true,
      policyholderName: 'Pat User',
      policyholderRelationship: 'SELF',
      policyholderDateOfBirth: '1990-01-01',
      policyholderBiologicalSex: 'FEMALE',
    };

    service.updateInsurance(request).subscribe();

    const req = httpMock.expectOne('/api/v1/me/patient-details/insurance');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('PATCHes /me/patient-details/emergency-contact', () => {
    const request: UpdateEmergencyContactRequest = {
      contactFullName: 'Jordan Contact',
      relationship: 'SPOUSAL',
      primaryPhone: '555-0200',
      secondaryPhone: null,
    };

    service.updateEmergencyContact(request).subscribe();

    const req = httpMock.expectOne('/api/v1/me/patient-details/emergency-contact');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('PATCHes /me/patient-details/clinical-history', () => {
    const request: UpdateClinicalHistoryRequest = {
      medications: [],
      allergies: [],
      personalMedicalHistory: 'None',
      familyMedicalHistory: 'None',
      preferredPharmacyName: 'Corner Pharmacy',
    };

    service.updateClinicalHistory(request).subscribe();

    const req = httpMock.expectOne('/api/v1/me/patient-details/clinical-history');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });
});
