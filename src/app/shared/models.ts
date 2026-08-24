import { AddressFormValue } from './address-form/address-form.component';

export type UserRole = 'SYSTEM_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'PATIENT';

/** Mirrors UserOnboardingRequest in contracts/onboarding-api.yaml (shared by every onboarding flow). */
export interface UserOnboardingRequest {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: AddressFormValue;
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

/** Mirrors UserResponse in contracts/onboarding-api.yaml, extended with Feature 016's Section 1 fields. */
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
  biologicalSex: BiologicalSex | null;
  personalPhone: string | null;
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
 * Mirrors MyProfileResponse in contracts/patient-profile-api.yaml — the caller's own full profile,
 * every section in one combined read (research.md #16), deliberately kept separate from MeResponse
 * (Feature 011 research.md #1). doctorDetails/insurance/emergencyContact/clinicalHistory/
 * consentStatuses/sectionStatus are present only for their own role, null (or omitted) for every
 * other role.
 */
export interface MyProfileResponse {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: AddressFormValue;
  biologicalSex: BiologicalSex | null;
  personalPhone: string | null;
  doctorDetails: DoctorProfileDetails | null;
  insurance: InsuranceDetails | null;
  emergencyContact: EmergencyContactDetails | null;
  clinicalHistory: ClinicalHistoryDetails | null;
  consentStatuses: ConsentDocumentStatus[];
  profileComplete: boolean;
  sectionStatus: SectionCompletionStatus | null;
}

/** Mirrors UpdateMyProfileRequest in contracts/patient-profile-api.yaml — Section 1 + doctorDetails only (research.md #16). */
export interface UpdateMyProfileRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: AddressFormValue;
  biologicalSex: BiologicalSex | null;
  personalPhone: string | null;
  doctorDetails: DoctorProfileDetails | null;
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
 * Mirrors AppointmentCriteria in contracts/appointment-search-api.yaml (Feature 013). Every field
 * is optional — an absent field means "no restriction on this dimension" — combined with, never
 * widening, the caller's own scope (data-model.md).
 */
export interface AppointmentCriteria {
  states?: AppointmentState[] | null;
  dateOnOrAfter?: string | null;
  dateOnOrBefore?: string | null;
}

/** Mirrors AppointmentSearchRequest in contracts/appointment-search-api.yaml. */
export interface AppointmentSearchRequest {
  criteria?: AppointmentCriteria | null;
  page: number;
  size: number;
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
