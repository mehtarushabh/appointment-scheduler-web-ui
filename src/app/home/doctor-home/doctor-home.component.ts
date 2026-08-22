import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AppointmentService } from '../../scheduling/appointments/appointment.service';
import { AppointmentResponse } from '../../shared/models';
import { compareBySoonest } from '../../shared/date-utils';

/** How many upcoming appointments the home dashboard previews — the Appointments tab has the full list. */
const UPCOMING_PREVIEW_LIMIT = 6;

/**
 * Doctor's Home page (User Story 3): upcoming (SCHEDULED) appointments as cards, past
 * (CANCELLED/COMPLETED) ones in a table below — mirrors PatientHomeComponent (feature 004 FR-022)
 * so every role's home dashboard shows the same at-a-glance summary, reusing the same
 * `AppointmentService.listMyAppointments()` the Appointments tab already calls for a Doctor.
 *
 * Feature 008: this is a preview, not the full list (the Appointments tab is), so `upcoming` is
 * capped to the soonest few — a busy doctor can easily have hundreds of scheduled appointments
 * across months, which would otherwise render as an unbounded card grid on a "Welcome back" screen.
 */
@Component({
  selector: 'app-doctor-home',
  standalone: true,
  imports: [MatCardModule, MatTableModule],
  templateUrl: './doctor-home.component.html',
})
export class DoctorHomeComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);

  private readonly appointments = signal<AppointmentResponse[]>([]);
  readonly displayedColumns = ['patientName', 'date', 'startTime', 'state'];

  readonly upcoming = computed(() =>
    this.appointments()
      .filter((a) => a.state === 'SCHEDULED')
      .sort(compareBySoonest)
      .slice(0, UPCOMING_PREVIEW_LIMIT)
  );
  readonly past = computed(() => this.appointments().filter((a) => a.state !== 'SCHEDULED'));

  ngOnInit(): void {
    this.appointmentService.listMyAppointments().subscribe((appointments) => this.appointments.set(appointments));
  }
}
