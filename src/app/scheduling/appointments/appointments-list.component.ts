import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { AppointmentService } from './appointment.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AppointmentResponse } from '../../shared/models';

/**
 * "Appointments" screen (User Story 4): a Clinic Admin sees every appointment in their clinic, a
 * Doctor sees only their own. Cancel/Complete row actions are offered only for SCHEDULED rows
 * (FR-025/FR-027) — one component, its data source and available actions driven by the logged-in
 * role.
 */
@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './appointments-list.component.html',
  styleUrl: './appointments-list.component.scss',
})
export class AppointmentsListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly displayedColumns = ['patientName', 'doctorName', 'date', 'startTime', 'state', 'actions'];

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    if (user.role === 'CLINIC_ADMIN' && user.clinicId) {
      this.appointmentService.listClinicAppointments(user.clinicId).subscribe((appointments) => this.appointments.set(appointments));
    } else if (user.role === 'DOCTOR') {
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
