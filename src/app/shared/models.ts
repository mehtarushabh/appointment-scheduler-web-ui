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
