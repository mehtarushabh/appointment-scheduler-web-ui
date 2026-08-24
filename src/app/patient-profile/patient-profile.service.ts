import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsentAcceptanceRequest,
  ConsentDocumentContent,
  ConsentDocumentType,
  MyProfileResponse,
  UpdateClinicalHistoryRequest,
  UpdateEmergencyContactRequest,
  UpdateInsuranceRequest,
} from '../shared/models';

/**
 * Sections 2-5 writes (Feature 016 FR-012 through FR-017) — each its own endpoint, per
 * research.md #16. Reads go through the existing `ProfileService.getMyProfile()` (already
 * extended to return every section in one combined read); this service intentionally does not
 * duplicate that call.
 */
@Injectable({ providedIn: 'root' })
export class PatientProfileService {
  private readonly http = inject(HttpClient);

  updateInsurance(request: UpdateInsuranceRequest): Observable<MyProfileResponse> {
    return this.http.patch<MyProfileResponse>('/api/v1/me/profile/insurance', request);
  }

  updateEmergencyContact(request: UpdateEmergencyContactRequest): Observable<MyProfileResponse> {
    return this.http.patch<MyProfileResponse>('/api/v1/me/profile/emergency-contact', request);
  }

  updateClinicalHistory(request: UpdateClinicalHistoryRequest): Observable<MyProfileResponse> {
    return this.http.patch<MyProfileResponse>('/api/v1/me/profile/clinical-history', request);
  }

  /** FR-016, FR-017: documentVersion/ipAddress/userAgent are never sent — the server determines/captures them (research.md #7, #9). */
  acceptConsent(request: ConsentAcceptanceRequest): Observable<MyProfileResponse> {
    return this.http.post<MyProfileResponse>('/api/v1/me/profile/consents', request);
  }

  /** Fetched on demand when a document is expanded to view — not pre-loaded with the rest of the profile (research.md #7). */
  getConsentDocument(documentType: ConsentDocumentType, version?: string): Observable<ConsentDocumentContent> {
    return this.http.get<ConsentDocumentContent>(`/api/v1/consent-documents/${documentType}`, {
      params: version ? { version } : undefined,
    });
  }
}
