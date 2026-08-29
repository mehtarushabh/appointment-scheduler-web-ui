import { AddressFormValue } from './address-form/address-form.component';

export type UserRole = 'SYSTEM_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'PATIENT';

/**
 * Mirrors UserOnboardingRequest in contracts/onboarding-api.yaml (shared by every onboarding flow
 * that creates a Doctor or Clinic Admin account). biologicalSex required
 * (022-role-details-endpoints, research.md #2) — Patient onboarding uses its own, separate
 * PatientOnboardingRequest and is unaffected.
 */
export interface UserOnboardingRequest {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: AddressFormValue;
  biologicalSex: BiologicalSex;
}

export interface DoctorOnboardingRequest extends UserOnboardingRequest {
  specialty: string;
}

export type BiologicalSex = 'MALE' | 'FEMALE' | 'INTERSEX' | 'PREFER_NOT_TO_SAY';
export type PolicyholderRelationship = 'SELF' | 'SPOUSE' | 'CHILD';
export type EmergencyContactRelationship = 'SPOUSAL' | 'PARENT' | 'SIBLING' | 'FRIEND' | 'GUARDIAN' | 'OTHER';
export type AllergyCategory = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'LATEX';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE_ANAPHYLAXIS';
export type ConsentDocumentType = 'CONSENT_TO_TREAT' | 'NPP';

/**
 * Mirrors PatientOnboardingRequest in contracts/patient-profile-api.yaml (Feature 016) — only
 * email is required; the rest are required together only when no existing Patient matches the
 * email (research.md #11). Used for `POST /clinics/me/patients` only — Doctor/Clinic Admin
 * onboarding still use UserOnboardingRequest, fully required, unchanged.
 */
export interface PatientOnboardingRequest {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  address?: AddressFormValue | null;
}

/**
 * Mirrors UserResponse in contracts/onboarding-api.yaml. 021-user-data-restructuring:
 * biologicalSex/personalPhone removed (research.md #6) — a direct consequence of the backend User
 * entity losing those fields to PatientDetails, not a User Story 2 decision; they're still served
 * on MyProfileResponse below.
 */
export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: AddressFormValue;
  role: UserRole;
  clinicId: string | null;
  specialty: string | null;
}

/** Mirrors DoctorProfileDetails in contracts/patient-profile-api.yaml — Doctor-only, unchanged from Feature 011. */
export interface DoctorProfileDetails {
  specialty: string;
}

/** Mirrors InsuranceDetails in contracts/patient-profile-api.yaml (Feature 016 Section 3, FR-014) — Patient-only. */
export interface InsuranceDetails {
  insuranceName: string | null;
  memberId: string | null;
  groupId: string | null;
  hasNoGroupNumber: boolean;
  policyholderName: string | null;
  policyholderRelationship: PolicyholderRelationship | null;
  policyholderDateOfBirth: string | null;
  policyholderBiologicalSex: BiologicalSex | null;
}

/** Mirrors EmergencyContactDetails in contracts/patient-profile-api.yaml (Feature 016 Section 2, FR-013). */
export interface EmergencyContactDetails {
  contactFullName: string | null;
  relationship: EmergencyContactRelationship | null;
  primaryPhone: string | null;
  secondaryPhone: string | null;
}

/** Mirrors MedicationEntry in contracts/patient-profile-api.yaml — all three fields always present together (FR-015). */
export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
}

/** Mirrors AllergyEntry in contracts/patient-profile-api.yaml (FR-015). */
export interface AllergyEntry {
  category: AllergyCategory;
  description: string;
  severity: AllergySeverity;
}

/** Mirrors ClinicalHistoryDetails in contracts/patient-profile-api.yaml (Feature 016 Section 4, FR-015). */
export interface ClinicalHistoryDetails {
  medications: MedicationEntry[];
  allergies: AllergyEntry[];
  medicationsReviewed: boolean;
  allergiesReviewed: boolean;
  personalMedicalHistory: string | null;
  familyMedicalHistory: string | null;
  preferredPharmacyName: string | null;
}

/** Mirrors ConsentDocumentStatus in contracts/patient-profile-api.yaml (Feature 016 Section 5, FR-016/FR-019). */
export interface ConsentDocumentStatus {
  documentType: ConsentDocumentType;
  title: string;
  currentVersion: string;
  accepted: boolean;
  acceptedAt: string | null;
  acceptedVersion: string | null;
}

/**
 * Mirrors SectionCompletionStatus in contracts/patient-profile-api.yaml (017-edit-profile-redesign
 * data-model.md) — per-section completeness driving the Edit Profile page's completion checkmarks.
 * Never sent in a request; always server-computed, fresh on every read.
 */
export interface SectionCompletionStatus {
  basicInformation: boolean;
  emergencyContact: boolean;
  insurance: boolean;
  clinicalHistory: boolean;
  consents: boolean;
}

/**
 * Mirrors MyProfileResponse in contracts/role-details-endpoints-api.yaml — the caller's own
 * Section 1 (Basic Information), deliberately kept separate from MeResponse (Feature 011
 * research.md #1). 021-user-data-restructuring narrowed this away from Insurance/Emergency
 * Contact/Clinical History/Consents; 022-role-details-endpoints narrowed it further —
 * personalPhone/doctorDetails moved to PatientDetailsResponse/DoctorDetailsResponse — and added
 * profileComplete (research.md #4), true unconditionally for every non-Patient role.
 */
export interface MyProfileResponse {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: AddressFormValue;
  biologicalSex: BiologicalSex | null;
  profileComplete: boolean;
  /** null until the user's first successful upload (024-profile-photo-upload). */
  profilePhotoUrl: string | null;
}

/** POST /me/profile-photo response (024-profile-photo-upload). */
export interface UploadProfilePhotoResponse {
  profilePhotoUrl: string;
}

/** GET/PATCH /me/preferences response (026-user-preferences). defaultLandingPage is a real route path, e.g. "/appointments" — "/home" is the default. */
export interface UserPreferencesResponse {
  defaultLandingPage: string;
}

/** PATCH /me/preferences request body (026-user-preferences). Whole-section replace. */
export interface UpdateUserPreferencesRequest {
  defaultLandingPage: string;
}

/**
 * Mirrors PatientDetailsResponse in contracts/role-details-endpoints-api.yaml
 * (021-user-data-restructuring) — GET /me/patient-details: exactly the fields MyProfileResponse
 * lost above. Patient only. 022-role-details-endpoints: gains personalPhone, moved here from
 * MyProfileResponse the same way Insurance/Emergency Contact/Clinical History/Consents already did.
 */
export interface PatientDetailsResponse {
  insurance: InsuranceDetails | null;
  emergencyContact: EmergencyContactDetails | null;
  clinicalHistory: ClinicalHistoryDetails | null;
  consentStatuses: ConsentDocumentStatus[];
  personalPhone: string | null;
  profileComplete: boolean;
  sectionStatus: SectionCompletionStatus | null;
}

/** Whole-field replace (022-role-details-endpoints) — personal phone doesn't fit any of PatientDetailsResponse's four sections, so it gets its own small write. */
export interface UpdatePersonalPhoneRequest {
  personalPhone: string | null;
}

/**
 * Mirrors DoctorDetailsResponse in contracts/role-details-endpoints-api.yaml
 * (022-role-details-endpoints) — GET /me/doctor-details: a Doctor's own specialty, moved off
 * MyProfileResponse's doctorDetails onto its own independently-saved endpoint.
 */
export interface DoctorDetailsResponse {
  specialty: string;
  professionalBio: string | null;
  npiNumber: string | null;
  stateLicenseNumber: string | null;
}

/** Whole-section replace (022-role-details-endpoints; 023-doctor-professional-details adds the three optional fields below). */
export interface UpdateDoctorDetailsRequest {
  specialty: string;
  professionalBio: string | null;
  npiNumber: string | null;
  stateLicenseNumber: string | null;
}

/** Mirrors ClinicAdminDetailsResponse in contracts/role-details-endpoints-api.yaml (022-role-details-endpoints) — intentionally empty today, no Clinic-Admin-specific fields exist yet (research.md #6). */
export type ClinicAdminDetailsResponse = Record<string, never>;

/** Mirrors SystemAdminDetailsResponse in contracts/role-details-endpoints-api.yaml (022-role-details-endpoints) — same situation as ClinicAdminDetailsResponse. */
export type SystemAdminDetailsResponse = Record<string, never>;

/** Mirrors UpdateMyProfileRequest in contracts/role-details-endpoints-api.yaml — Section 1 only (research.md #16 of feature 016; 022-role-details-endpoints removed personalPhone/doctorDetails). biologicalSex is accepted for every role now, not Patient-conditional. */
export interface UpdateMyProfileRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: AddressFormValue;
  biologicalSex: BiologicalSex | null;
}

/** Mirrors UpdateInsuranceRequest in contracts/patient-profile-api.yaml — whole-section replace (FR-014, FR-012). */
export interface UpdateInsuranceRequest {
  insuranceName: string | null;
  memberId: string | null;
  groupId: string | null;
  hasNoGroupNumber: boolean;
  policyholderName: string | null;
  policyholderRelationship: PolicyholderRelationship | null;
  policyholderDateOfBirth: string | null;
  policyholderBiologicalSex: BiologicalSex | null;
}

/** Mirrors UpdateEmergencyContactRequest in contracts/patient-profile-api.yaml — whole-section replace (FR-013, FR-012). */
export interface UpdateEmergencyContactRequest {
  contactFullName: string | null;
  relationship: EmergencyContactRelationship | null;
  primaryPhone: string | null;
  secondaryPhone: string | null;
}

/** Mirrors UpdateClinicalHistoryRequest in contracts/patient-profile-api.yaml — whole-section replace, lists bulk-replaced (research.md #15). */
export interface UpdateClinicalHistoryRequest {
  medications: MedicationEntry[];
  allergies: AllergyEntry[];
  personalMedicalHistory: string | null;
  familyMedicalHistory: string | null;
  preferredPharmacyName: string | null;
}

/** Mirrors ConsentAcceptanceRequest in contracts/patient-profile-api.yaml — documentVersion/ipAddress/userAgent are never client-supplied (research.md #7, #9). */
export interface ConsentAcceptanceRequest {
  documentType: ConsentDocumentType;
  signatureText: string;
}

/** Mirrors ConsentDocumentContent in contracts/patient-profile-api.yaml — fetched on demand, not inlined into MyProfileResponse (research.md #7). */
export interface ConsentDocumentContent {
  documentType: ConsentDocumentType;
  version: string;
  title: string;
  bodyText: string;
}

/** Mirrors PatientProfileView in contracts/patient-profile-api.yaml (FR-024) — read-only, clinic-staff-facing; a separate type from MyProfileResponse (research.md #10). */
export interface PatientProfileView {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: AddressFormValue;
  biologicalSex: BiologicalSex | null;
  personalPhone: string | null;
  insurance: InsuranceDetails | null;
  emergencyContact: EmergencyContactDetails | null;
  clinicalHistory: ClinicalHistoryDetails | null;
  consentStatuses: ConsentDocumentStatus[];
  profileComplete: boolean;
}

export interface ClinicOnboardingRequest {
  name: string;
  address: AddressFormValue;
  registeredId: string;
  firstClinicAdmin: UserOnboardingRequest;
}

export interface ClinicResponse {
  id: string;
  name: string;
  address: AddressFormValue;
  registeredId: string;
  firstClinicAdmin: UserResponse | null;
}

/** Mirrors ClinicProfileUpdateRequest in contracts/appointment-scheduling-api.yaml (FR-003: no registeredId field). */
export interface ClinicProfileUpdateRequest {
  name: string;
  address: AddressFormValue;
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

/** Mirrors WorkingHoursEntry in contracts/appointment-scheduling-api.yaml. */
export interface WorkingHoursEntry {
  dayOfWeek: DayOfWeek;
  isOpen: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface WorkingHoursUpdateRequest {
  days: WorkingHoursEntry[];
}

/** Mirrors DoctorSummaryResponse in contracts/appointment-scheduling-api.yaml (research.md #1: deliberately minimal). */
export interface DoctorSummaryResponse {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

/**
 * Mirrors DoctorListResponse in contracts/user-data-restructuring-api.yaml (021-user-data-restructuring,
 * research.md #5) — GET /clinics/me/doctors's row fields only; the expanded row fetches the rest via
 * GET /clinics/me/doctors/{doctorId}/profile (UserResponse). A separate type from
 * DoctorSummaryResponse, whose two other consumers stay deliberately minimal without email.
 */
export interface DoctorListResponse {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
}

/** Mirrors PatientListResponse in contracts/user-data-restructuring-api.yaml (021-user-data-restructuring, research.md #5) — GET /clinics/me/patients's row fields only. */
export interface PatientListResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AvailableSlotsResponse {
  date: string;
  durationMinutes: number;
  startTimes: string[];
}

export interface BookAppointmentRequest {
  clinicId: string;
  doctorId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
}

export type AppointmentState = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

/**
 * Mirrors AppointmentCriteria in contracts/appointment-filters-api.yaml (Feature 013, extended by
 * Feature 019's doctorIds/patientIds). Every field is optional — an absent field means "no
 * restriction on this dimension" — combined with, never widening, the caller's own scope
 * (data-model.md).
 */
export interface AppointmentCriteria {
  states?: AppointmentState[] | null;
  dateOnOrAfter?: string | null;
  dateOnOrBefore?: string | null;
  doctorIds?: string[] | null;
  patientIds?: string[] | null;
}

/**
 * One value per logical sort dimension shown in the Appointments table, not one per column —
 * 'DATE_TIME' is deliberately the single value for both the Date and the Time column (Feature 020,
 * research.md #3); the caller sends 'DATE_TIME' regardless of which of the two was clicked.
 */
export type AppointmentSortField = 'PATIENT_NAME' | 'DOCTOR_NAME' | 'DATE_TIME' | 'STATUS';

/**
 * Mirrors AppointmentSearchRequest in contracts/appointment-sorting-api.yaml (Feature 013,
 * extended by Feature 019's criteria fields and Feature 020's sortBy/sortDirection). sortBy/
 * sortDirection are siblings of criteria, not part of it — a sort is not a filter (data-model.md).
 * An absent sortBy means the existing default order (date, then time, ascending); an absent
 * sortDirection with a present sortBy means ascending.
 */
export interface AppointmentSearchRequest {
  criteria?: AppointmentCriteria | null;
  page: number;
  size: number;
  sortBy?: AppointmentSortField | null;
  sortDirection?: 'ASC' | 'DESC' | null;
}

/**
 * Mirrors PageResponse in contracts/appointment-search-api.yaml — a generic paged-response shape
 * (data-model.md); this feature is its only current user, but nothing about it is
 * Appointment-specific.
 */
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Mirrors LeaveRequest in contracts/appointment-scheduling-api.yaml. */
export interface LeaveRequest {
  date: string;
  fullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  confirmCancelConflicts?: boolean;
}

export interface LeaveResponse {
  id: string;
  date: string;
  fullDay: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface LeaveConflictResponse {
  message: string;
  conflictingAppointments: AppointmentResponse[];
}

/** Mirrors AppointmentResponse in contracts/appointment-scheduling-api.yaml. */
export interface AppointmentResponse {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  state: AppointmentState;
}
