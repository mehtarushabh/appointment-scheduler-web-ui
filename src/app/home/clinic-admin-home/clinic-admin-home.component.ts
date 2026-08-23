import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { AppointmentService } from '../../scheduling/appointments/appointment.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AppointmentResponse } from '../../shared/models';
import { compareBySoonest, isPastDue, isToday, toDateOnlyString } from '../../shared/date-utils';

/**
 * Clinic Admin's Home page ("Today's appointments," feature 010): every clinic-wide appointment
 * dated today and still SCHEDULED — nothing from other days, and no past/cancelled/completed
 * section at all (that's what the Appointments tab is for).
 *
 * Feature 012: also surfaces a separate "Overdue appointments" section, above "Today's
 * appointments," for any clinic-wide SCHEDULED appointment whose date has already passed —
 * flagged with an alert icon/tooltip and resolvable in place via the same Complete/Cancel actions
 * `AppointmentsListComponent` already offers (research.md #4/#6).
 *
 * Feature 013: requests only SCHEDULED appointments dated on or before today directly from the
 * server (covering both sections above from one small response) instead of fetching the whole
 * clinic's appointment history and filtering it here — the split between "today's" and "overdue"
 * stays a client-side concern (research.md #7 of feature 013), it just now runs over a response
 * that was already small to begin with.
 */
@Component({
  selector: 'app-clinic-admin-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatTooltipModule, FaIconComponent],
  templateUrl: './clinic-admin-home.component.html',
})
export class ClinicAdminHomeComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly notification = inject(NotificationService);

  protected readonly faTriangleExclamation = faTriangleExclamation;

  private readonly appointments = signal<AppointmentResponse[]>([]);

  readonly todaysAppointments = computed(() =>
    this.appointments().filter((a) => isToday(a.date) && a.state === 'SCHEDULED')
  );

  /** Most-overdue-first — compareBySoonest's ascending date order already yields that over a past-only list (research.md #3). */
  readonly pastDueAppointments = computed(() =>
    this.appointments()
      .filter((a) => a.state === 'SCHEDULED' && isPastDue(a.date))
      .sort(compareBySoonest)
  );

  ngOnInit(): void {
    this.appointmentService
      .searchClinicAppointments({
        criteria: { states: ['SCHEDULED'], dateOnOrBefore: toDateOnlyString(new Date()) },
        page: 0,
        size: 100,
      })
      .subscribe((response) => this.appointments.set(response.items));
  }

  cancel(appointment: AppointmentResponse): void {
    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.notification.success('Appointment cancelled.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to cancel appointment.'),
    });
  }

  complete(appointment: AppointmentResponse): void {
    this.appointmentService.completeAppointment(appointment.id).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.notification.success('Appointment marked completed.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to complete appointment.'),
    });
  }

  private replace(updated: AppointmentResponse): void {
    this.appointments.update((appointments) => appointments.map((a) => (a.id === updated.id ? updated : a)));
  }
}
