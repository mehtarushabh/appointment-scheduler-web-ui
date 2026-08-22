import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AppointmentService } from './appointment.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AppointmentResponse } from '../../shared/models';
import { compareBySoonest } from '../../shared/date-utils';

const FULL_COLUMNS = ['patientName', 'doctorName', 'date', 'startTime', 'state', 'actions'];
const PATIENT_COLUMNS = ['doctorName', 'date', 'startTime', 'state'];

/**
 * "Appointments" screen (User Story 4): a Clinic Admin sees every appointment in their clinic, a
 * Doctor sees only their own, and a Patient sees their own full history. Cancel/Complete row
 * actions are offered only for SCHEDULED rows and only to Clinic Admin/Doctor (FR-025/FR-027) — a
 * Patient's columns omit both "Patient" (redundant — it's always themselves) and "Actions"
 * entirely, since a Patient can never manage their own appointments here. One component, its data
 * source, columns, and available actions all driven by the logged-in role.
 */
@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatCardModule],
  templateUrl: './appointments-list.component.html',
  styleUrl: './appointments-list.component.scss',
})
export class AppointmentsListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly appointments = signal<AppointmentResponse[]>([]);
  /**
   * Soonest date+time first (bugfix): the backend returns them in no particular order. A previous
   * version sorted furthest-out-first, on the assumption "most recent" meant "latest date" — but
   * for a forward-looking appointments list, what a user actually wants up top is their next
   * upcoming appointment, not the one furthest away.
   */
  readonly sortedAppointments = computed(() => [...this.appointments()].sort(compareBySoonest));
  readonly displayedColumns = signal<string[]>(FULL_COLUMNS);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    if (user.role === 'CLINIC_ADMIN') {
      this.appointmentService.listClinicAppointments().subscribe((appointments) => this.appointments.set(appointments));
    } else if (user.role === 'DOCTOR') {
      this.appointmentService.listMyAppointments().subscribe((appointments) => this.appointments.set(appointments));
    } else if (user.role === 'PATIENT') {
      this.displayedColumns.set(PATIENT_COLUMNS);
      this.appointmentService.listMyAppointments().subscribe((appointments) => this.appointments.set(appointments));
    }
  }

  canManage(appointment: AppointmentResponse): boolean {
    return appointment.state === 'SCHEDULED';
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
