import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AppointmentService } from '../../scheduling/appointments/appointment.service';
import { AppointmentResponse } from '../../shared/models';
import { compareBySoonest } from '../../shared/date-utils';

/** How many upcoming appointments the home dashboard previews — the Appointments tab has the full list. */
const UPCOMING_PREVIEW_LIMIT = 6;

/**
 * Patient's Home page (User Story 4, FR-022): upcoming (SCHEDULED) appointments as cards only —
 * past/completed/cancelled appointments belong on the Appointments tab, not the "Welcome back"
 * screen, so they are deliberately not fetched or shown here at all.
 *
 * Feature 008: this is a preview, not the full list (the Appointments tab is), so `upcoming` is
 * capped to the soonest few — with months of real appointment data, an uncapped grid would render
 * hundreds of cards on a "Welcome back" screen.
 */
@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './patient-home.component.html',
})
export class PatientHomeComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);

  private readonly appointments = signal<AppointmentResponse[]>([]);

  readonly upcoming = computed(() =>
    this.appointments()
      .filter((a) => a.state === 'SCHEDULED')
      .sort(compareBySoonest)
      .slice(0, UPCOMING_PREVIEW_LIMIT)
  );

  ngOnInit(): void {
    this.appointmentService.listMyAppointments().subscribe((appointments) => this.appointments.set(appointments));
  }
}
