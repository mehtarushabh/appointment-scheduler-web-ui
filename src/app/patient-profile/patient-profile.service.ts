import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsentAcceptanceRequest,
  ConsentDocumentContent,
  ConsentDocumentType,
  PatientDetailsResponse,
  UpdateClinicalHistoryRequest,
  UpdateEmergencyContactRequest,
  UpdateInsuranceRequest,
  UpdatePersonalPhoneRequest,
} from '../shared/models';

/**
 * Sections 2-5 reads/writes (Feature 016 FR-012 through FR-017) — each write its own endpoint, per
 * research.md #16. 021-user-data-restructuring moved these off /me/profile/* to /me/patient-
 * details/* and gave this service its own combined read (`getPatientDetails`) — Section 1 still
 * goes through `ProfileService.getMyProfile()`, which no longer carries these fields.
 */
@Injectable({ providedIn: 'root' })
export class PatientProfileService {
  private readonly http = inject(HttpClient);

  getPatientDetails(): Observable<PatientDetailsResponse> {
    return this.http.get<PatientDetailsResponse>('/api/v1/me/patient-details');
  }

  updateInsurance(request: UpdateInsuranceRequest): Observable<PatientDetailsResponse> {
    return this.http.patch<PatientDetailsResponse>('/api/v1/me/patient-details/insurance', request);
  }

  updateEmergencyContact(request: UpdateEmergencyContactRequest): Observable<PatientDetailsResponse> {
    return this.http.patch<PatientDetailsResponse>('/api/v1/me/patient-details/emergency-contact', request);
  }

  updateClinicalHistory(request: UpdateClinicalHistoryRequest): Observable<PatientDetailsResponse> {
    return this.http.patch<PatientDetailsResponse>('/api/v1/me/patient-details/clinical-history', request);
  }

  /** 022-role-details-endpoints: moved off /me/profile — doesn't fit any of the other four sections, so it's its own small write. */
  updatePersonalPhone(request: UpdatePersonalPhoneRequest): Observable<PatientDetailsResponse> {
    return this.http.patch<PatientDetailsResponse>('/api/v1/me/patient-details/personal-phone', request);
  }

  /** FR-016, FR-017: documentVersion/ipAddress/userAgent are never sent — the server determines/captures them (research.md #7, #9). */
  acceptConsent(request: ConsentAcceptanceRequest): Observable<PatientDetailsResponse> {
    return this.http.post<PatientDetailsResponse>('/api/v1/me/patient-details/consents', request);
  }

  /** Fetched on demand when a document is expanded to view — not pre-loaded with the rest of the profile (research.md #7). */
  getConsentDocument(documentType: ConsentDocumentType, version?: string): Observable<ConsentDocumentContent> {
    return this.http.get<ConsentDocumentContent>(`/api/v1/consent-documents/${documentType}`, {
      params: version ? { version } : undefined,
    });
  }
}
