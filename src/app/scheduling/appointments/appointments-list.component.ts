import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { AppointmentService } from './appointment.service';
import { MultiSelectFilterComponent, MultiSelectOption } from './multi-select-filter/multi-select-filter.component';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { DoctorOnboardingService } from '../../onboarding/doctor-onboarding/doctor-onboarding.service';
import { PatientOnboardingService } from '../../onboarding/patient-onboarding/patient-onboarding.service';
import {
  AppointmentCriteria,
  AppointmentResponse,
  AppointmentSearchRequest,
  AppointmentSortField,
  AppointmentState,
  DoctorSummaryResponse,
  PageResponse,
  PatientListResponse,
} from '../../shared/models';
import { appointmentStatusClass } from '../../shared/appointment-status-utils';
import { toDateOnlyString } from '../../shared/date-utils';

const FULL_COLUMNS = ['patientName', 'doctorName', 'date', 'startTime', 'state'];
const PATIENT_COLUMNS = ['doctorName', 'date', 'startTime', 'state'];
const PAGE_SIZE = 50;
const DEFAULT_DATE_RANGE_MONTHS = 2;

type StatusFilter = 'ALL' | AppointmentState;

/**
 * Maps a `mat-sort-header` id (assigned in the template) to the field it sorts by. Date and Time
 * are deliberately NOT listed here — `MatSort` rejects two headers sharing one id ("Cannot have
 * two MatSortables with the same id"), so per research.md #4's documented fallback, those two
 * columns are hand-rolled (`onDateTimeSortClick()` below) rather than real `mat-sort-header`s.
 */
const SORT_FIELD_BY_ID: Record<string, AppointmentSortField> = {
  patientName: 'PATIENT_NAME',
  doctorName: 'DOCTOR_NAME',
  status: 'STATUS',
};

function defaultToDate(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + DEFAULT_DATE_RANGE_MONTHS);
  return date;
}

/** Accepts either DoctorSummaryResponse (the Patient-facing GET /me/doctors) or DoctorListResponse (the Clinic-Admin-facing GET /clinics/me/doctors) — both carry these three fields. */
function toDoctorOptions(doctors: Pick<DoctorSummaryResponse, 'id' | 'firstName' | 'lastName'>[]): MultiSelectOption[] {
  return doctors.map((doctor) => ({ id: doctor.id, label: `${doctor.firstName} ${doctor.lastName}` }));
}

function toPatientOptions(patients: PatientListResponse[]): MultiSelectOption[] {
  return patients.map((patient) => ({ id: patient.id, label: `${patient.firstName} ${patient.lastName}` }));
}

/**
 * "Appointments" screen (feature 019): one unified, immediately-filterable list, replacing the
 * two-table split from feature 010/013 (research.md #6 of feature 019) — the Status filter
 * (including "All") is now how a user reaches what the two tables used to show separately. Every
 * filter's own change event re-searches directly (research.md #7) — no separate "Search" action.
 *
 * The Doctor/Patient filter OPTION lists are fetched once per role, from whichever existing
 * endpoint that role is actually authorized to call (research.md #2-#4) — a Clinic Admin fetches
 * both; a Doctor can only call the clinic's patients endpoint (the doctors endpoint is
 * Clinic-Admin-only); a Patient can only call its own across-clinics doctors endpoint (the
 * patients endpoint is clinic-staff-only). This is why the fetch itself is role-conditional even
 * before User Story 2 adds role-conditional *visibility* of the resulting filter controls.
 */
@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatPaginatorModule,
    MatSortModule,
    MultiSelectFilterComponent,
    FaIconComponent,
  ],
  // provideNativeDateAdapter() directly, matching add-patient-dialog/add-doctor-dialog/
  // add-leave-dialog's own established NG0201 fix — MatDatepicker's DateAdapter is not otherwise
  // reliably resolved without a MatNativeDateModule import at the app root, which this app
  // deliberately doesn't register globally.
  providers: [provideNativeDateAdapter()],
  templateUrl: './appointments-list.component.html',
  styleUrl: './appointments-list.component.scss',
})
export class AppointmentsListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorOnboardingService = inject(DoctorOnboardingService);
  private readonly patientOnboardingService = inject(PatientOnboardingService);
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly pageSize = PAGE_SIZE;
  readonly appointmentStatusClass = appointmentStatusClass;
  readonly statusOptions: StatusFilter[] = ['ALL', 'SCHEDULED', 'CANCELLED', 'COMPLETED'];

  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly totalElements = signal(0);
  readonly columns = signal<string[]>([...FULL_COLUMNS, 'actions']);

  readonly status = signal<StatusFilter>('ALL');
  readonly dateOnOrAfter = signal<Date>(new Date());
  readonly dateOnOrBefore = signal<Date>(defaultToDate());
  readonly selectedDoctorIds = signal<string[]>([]);
  readonly selectedPatientIds = signal<string[]>([]);

  /** Unset means no active sort — today's existing default order (data-model.md, feature 020). */
  readonly sortBy = signal<AppointmentSortField | undefined>(undefined);
  readonly sortDirection = signal<'ASC' | 'DESC' | undefined>(undefined);

  readonly doctorOptions = signal<MultiSelectOption[]>([]);
  readonly patientOptions = signal<MultiSelectOption[]>([]);

  readonly userRole = computed(() => this.auth.currentUser()?.role);

  /** research.md #4's fallback icons for the hand-rolled Date/Time shared sort indicator. */
  protected readonly faSortUp = faSortUp;
  protected readonly faSortDown = faSortDown;

  ngOnInit(): void {
    const role = this.userRole();
    if (!role) {
      return;
    }
    if (role === 'PATIENT') {
      this.columns.set(PATIENT_COLUMNS);
    }

    if (role === 'CLINIC_ADMIN') {
      this.doctorOnboardingService.listDoctors().subscribe((doctors) => this.doctorOptions.set(toDoctorOptions(doctors)));
      this.patientOnboardingService.listPatients().subscribe((patients) => this.patientOptions.set(toPatientOptions(patients)));
    } else if (role === 'DOCTOR') {
      this.patientOnboardingService.listPatients().subscribe((patients) => this.patientOptions.set(toPatientOptions(patients)));
    } else if (role === 'PATIENT') {
      this.patientOnboardingService.listMyDoctors().subscribe((doctors) => this.doctorOptions.set(toDoctorOptions(doctors)));
    }

    this.search(0);
  }

  onStatusChange(status: StatusFilter): void {
    this.status.set(status);
    this.search(0);
  }

  onDateOnOrAfterChange(event: MatDatepickerInputEvent<Date> | Date | null): void {
    const date = event instanceof Date ? event : event?.value;
    if (!date) {
      return;
    }
    this.dateOnOrAfter.set(date);
    this.search(0);
  }

  onDateOnOrBeforeChange(event: MatDatepickerInputEvent<Date> | Date | null): void {
    const date = event instanceof Date ? event : event?.value;
    if (!date) {
      return;
    }
    this.dateOnOrBefore.set(date);
    this.search(0);
  }

  onDoctorSelectionChange(doctorIds: string[]): void {
    this.selectedDoctorIds.set(doctorIds);
    this.search(0);
  }

  onPatientSelectionChange(patientIds: string[]): void {
    this.selectedPatientIds.set(patientIds);
    this.search(0);
  }

  onPage(event: PageEvent): void {
    this.search(event.pageIndex);
  }

  /**
   * `direction` is `''` only when a `mat-sort-header`'s "clear" state fires — unreachable here
   * since every sortable header sets `disableClear` (FR-003's strict two-state toggle has no
   * backend-visible third state either — contracts/appointment-sorting-api.yaml), so this only
   * ever needs to handle 'asc'/'desc'.
   */
  onSortChange(sort: Sort): void {
    this.sortBy.set(SORT_FIELD_BY_ID[sort.active]);
    this.sortDirection.set(sort.direction === 'desc' ? 'DESC' : 'ASC');
    this.search(0);
  }

  /**
   * research.md #4's fallback: `mat-sort-header` cannot express "two header cells, one shared sort
   * id" (Material throws on a duplicate id), so the Date and Time headers call this directly
   * instead of using `mat-sort-header`/`(matSortChange)`. Same two-state toggle semantics as
   * `onSortChange` above: not yet the active sort → ascending; already ascending → descending;
   * already descending → ascending.
   */
  onDateTimeSortClick(): void {
    const alreadyAscending = this.sortBy() === 'DATE_TIME' && this.sortDirection() === 'ASC';
    this.sortBy.set('DATE_TIME');
    this.sortDirection.set(alreadyAscending ? 'DESC' : 'ASC');
    this.search(0);
  }

  canManage(appointment: AppointmentResponse): boolean {
    return appointment.state === 'SCHEDULED';
  }

  cancel(appointment: AppointmentResponse): void {
    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: () => {
        this.removeFromList(appointment.id);
        this.notification.success('Appointment cancelled.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to cancel appointment.'),
    });
  }

  complete(appointment: AppointmentResponse): void {
    this.appointmentService.completeAppointment(appointment.id).subscribe({
      next: () => {
        this.removeFromList(appointment.id);
        this.notification.success('Appointment marked completed.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to complete appointment.'),
    });
  }

  private buildCriteria(): AppointmentCriteria {
    const criteria: AppointmentCriteria = {
      dateOnOrAfter: toDateOnlyString(this.dateOnOrAfter()),
      dateOnOrBefore: toDateOnlyString(this.dateOnOrBefore()),
    };
    const status = this.status();
    if (status !== 'ALL') {
      criteria.states = [status];
    }
    if (this.selectedDoctorIds().length > 0) {
      criteria.doctorIds = this.selectedDoctorIds();
    }
    if (this.selectedPatientIds().length > 0) {
      criteria.patientIds = this.selectedPatientIds();
    }
    return criteria;
  }

  private search(pageIndex: number): void {
    const request: AppointmentSearchRequest = { criteria: this.buildCriteria(), page: pageIndex, size: PAGE_SIZE };
    const sortBy = this.sortBy();
    if (sortBy) {
      request.sortBy = sortBy;
      request.sortDirection = this.sortDirection();
    }
    this.searchByRole(request).subscribe((response) => {
      this.appointments.set(response.items);
      this.pageIndex.set(response.page);
      this.totalElements.set(response.totalElements);
    });
  }

  private searchByRole(request: AppointmentSearchRequest): Observable<PageResponse<AppointmentResponse>> {
    return this.userRole() === 'CLINIC_ADMIN'
      ? this.appointmentService.searchClinicAppointments(request)
      : this.appointmentService.searchMyAppointments(request);
  }

  private removeFromList(appointmentId: string): void {
    this.appointments.update((appointments) => appointments.filter((a) => a.id !== appointmentId));
    this.totalElements.update((total) => Math.max(0, total - 1));
  }
}
