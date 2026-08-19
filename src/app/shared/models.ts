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
