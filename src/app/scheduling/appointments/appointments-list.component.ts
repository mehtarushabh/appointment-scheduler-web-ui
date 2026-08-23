import { Component, OnInit, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AppointmentService } from './appointment.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AppointmentCriteria, AppointmentResponse, AppointmentSearchRequest, PageResponse } from '../../shared/models';

const FULL_COLUMNS = ['patientName', 'doctorName', 'date', 'startTime', 'state'];
const PATIENT_COLUMNS = ['doctorName', 'date', 'startTime', 'state'];
const PAGE_SIZE = 50;

/**
 * "Appointments" screen (User Story 4; two-table split feature 010): a Clinic Admin sees every
 * appointment in their clinic, a Doctor sees only their own, and a Patient sees their own full
 * history — split into a scheduled-state table and a "Past appointments" table
 * (cancelled/completed) below it, the same way for every role. Cancel/Complete row actions are
 * offered only in the scheduled table, and only to Clinic Admin/Doctor (FR-025/FR-027) — a
 * Patient's columns omit "Patient" (redundant — it's always themselves) from both tables, and the
 * past table never has an "actions" column at all for any role, since nothing there is ever
 * manageable.
 *
 * Feature 013: the two tables are now independently, really paginated (50 records at a time,
 * `MatPaginator`) rather than both being client-side views over one, fully-fetched list — each
 * table has its own criteria-scoped `POST .../search` request and its own page state, and a
 * further page is only ever requested when that table's own paginator advances (never in
 * advance). Resolving a Scheduled row removes it from that table's current page immediately; the
 * Past table is not live-synced to reflect that resolution (research.md #4 of feature 013,
 * quickstart.md Scenario 4) — it picks it up the next time its own page is (re)loaded.
 */
@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatCardModule, MatPaginatorModule],
  templateUrl: './appointments-list.component.html',
  styleUrl: './appointments-list.component.scss',
})
export class AppointmentsListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly pageSize = PAGE_SIZE;

  readonly scheduledAppointments = signal<AppointmentResponse[]>([]);
  readonly scheduledPageIndex = signal(0);
  readonly scheduledTotalElements = signal(0);

  readonly pastAppointments = signal<AppointmentResponse[]>([]);
  readonly pastPageIndex = signal(0);
  readonly pastTotalElements = signal(0);

  readonly scheduledColumns = signal<string[]>([...FULL_COLUMNS, 'actions']);
  readonly pastColumns = signal<string[]>(FULL_COLUMNS);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    if (user.role === 'PATIENT') {
      this.scheduledColumns.set(PATIENT_COLUMNS);
      this.pastColumns.set(PATIENT_COLUMNS);
    }
    this.loadScheduled(0);
    this.loadPast(0);
  }

  onScheduledPage(event: PageEvent): void {
    this.loadScheduled(event.pageIndex);
  }

  onPastPage(event: PageEvent): void {
    this.loadPast(event.pageIndex);
  }

  canManage(appointment: AppointmentResponse): boolean {
    return appointment.state === 'SCHEDULED';
  }

  cancel(appointment: AppointmentResponse): void {
    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: () => {
        this.removeFromScheduled(appointment.id);
        this.notification.success('Appointment cancelled.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to cancel appointment.'),
    });
  }

  complete(appointment: AppointmentResponse): void {
    this.appointmentService.completeAppointment(appointment.id).subscribe({
      next: () => {
        this.removeFromScheduled(appointment.id);
        this.notification.success('Appointment marked completed.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to complete appointment.'),
    });
  }

  private loadScheduled(pageIndex: number): void {
    this.search({ states: ['SCHEDULED'] }, pageIndex).subscribe((response) => {
      this.scheduledAppointments.set(response.items);
      this.scheduledPageIndex.set(response.page);
      this.scheduledTotalElements.set(response.totalElements);
    });
  }

  private loadPast(pageIndex: number): void {
    this.search({ states: ['CANCELLED', 'COMPLETED'] }, pageIndex).subscribe((response) => {
      this.pastAppointments.set(response.items);
      this.pastPageIndex.set(response.page);
      this.pastTotalElements.set(response.totalElements);
    });
  }

  private search(criteria: AppointmentCriteria, pageIndex: number): Observable<PageResponse<AppointmentResponse>> {
    const request: AppointmentSearchRequest = { criteria, page: pageIndex, size: PAGE_SIZE };
    return this.auth.currentUser()?.role === 'CLINIC_ADMIN'
      ? this.appointmentService.searchClinicAppointments(request)
      : this.appointmentService.searchMyAppointments(request);
  }

  /** The resolved appointment no longer matches the Scheduled table's own criteria, so it's removed rather than updated in place. */
  private removeFromScheduled(appointmentId: string): void {
    this.scheduledAppointments.update((appointments) => appointments.filter((a) => a.id !== appointmentId));
    this.scheduledTotalElements.update((total) => Math.max(0, total - 1));
  }
}
