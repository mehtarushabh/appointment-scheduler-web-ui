import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { ClinicResponse, DoctorSummaryResponse, PatientListResponse, PatientOnboardingRequest, PatientProfileView, UserResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PatientOnboardingService {
  private readonly http = inject(HttpClient);

  /**
   * FR-001, FR-002: `null` means no account at all matches this email — proceed to the
   * new-patient form. A 409 (email belongs to a non-Patient account, FR-006) propagates as an
   * error for the caller to handle inline.
   */
  lookupPatient(email: string): Observable<UserResponse | null> {
    return this.http
      .get<UserResponse>('/api/v1/clinics/me/patients/lookup', { params: { email } })
      .pipe(catchError((err) => (err?.status === 404 ? of(null) : throwError(() => err))));
  }

  /** Creates a new Patient, or links an existing one (matched by email) to this clinic (FR-003, FR-004, FR-005). */
  onboardOrLinkPatient(request: PatientOnboardingRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/v1/clinics/me/patients', request);
  }

  /** Clinic Admin or Doctor of their own clinic (Feature 016 FR-024). Row fields only (021-user-data-restructuring). */
  listPatients(): Observable<PatientListResponse[]> {
    return this.http.get<PatientListResponse[]>('/api/v1/clinics/me/patients');
  }

  /** FR-024: a Clinic Admin's or Doctor's read-only view of one patient's whole profile. */
  getPatientProfile(patientId: string): Observable<PatientProfileView> {
    return this.http.get<PatientProfileView>(`/api/v1/clinics/me/patients/${patientId}/profile`);
  }

  /** The clinics the current authenticated Patient is associated with (FR-013). */
  listMyClinics(): Observable<ClinicResponse[]> {
    return this.http.get<ClinicResponse[]>('/api/v1/me/clinics');
  }

  /** Feature 019: the distinct doctors across every clinic the current Patient is associated with — options for the Appointments page's Doctor filter. */
  listMyDoctors(): Observable<DoctorSummaryResponse[]> {
    return this.http.get<DoctorSummaryResponse[]>('/api/v1/me/doctors');
  }
}
