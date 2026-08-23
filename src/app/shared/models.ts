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

/** Mirrors UserResponse in contracts/onboarding-api.yaml. */
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

/** Mirrors DoctorProfileDetails in contracts/edit-profile-api.yaml (Feature 011) — Doctor-only. */
export interface DoctorProfileDetails {
  specialty: string;
}

/** Mirrors PatientProfileDetails in contracts/edit-profile-api.yaml (Feature 011) — Patient-only, all optional. */
export interface PatientProfileDetails {
  insuranceName: string | null;
  groupId: string | null;
  memberId: string | null;
}

/**
 * Mirrors MyProfileResponse in contracts/edit-profile-api.yaml — the caller's own full, editable
 * profile (GET/PATCH /me/profile), deliberately kept separate from MeResponse (research.md #1).
 * doctorDetails/patientDetails are present only for their own role, null for every other role.
 */
export interface MyProfileResponse {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  address: AddressFormValue;
  doctorDetails: DoctorProfileDetails | null;
  patientDetails: PatientProfileDetails | null;
}

/** Mirrors UpdateMyProfileRequest in contracts/edit-profile-api.yaml. */
export interface UpdateMyProfileRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: AddressFormValue;
  doctorDetails: DoctorProfileDetails | null;
  patientDetails: PatientProfileDetails | null;
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
