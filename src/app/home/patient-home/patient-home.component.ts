import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AppointmentService } from '../../scheduling/appointments/appointment.service';
import { AppointmentResponse } from '../../shared/models';

/**
 * Patient's Home page (User Story 4, FR-022): upcoming (SCHEDULED) appointments as cards, past
 * (CANCELLED/COMPLETED) ones in a table below.
 */
@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [MatCardModule, MatTableModule],
  templateUrl: './patient-home.component.html',
})
export class PatientHomeComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);

  private readonly appointments = signal<AppointmentResponse[]>([]);
  readonly displayedColumns = ['doctorName', 'date', 'startTime', 'state'];

  readonly upcoming = computed(() => this.appointments().filter((a) => a.state === 'SCHEDULED'));
  readonly past = computed(() => this.appointments().filter((a) => a.state !== 'SCHEDULED'));

  ngOnInit(): void {
    this.appointmentService.listMyAppointments().subscribe((appointments) => this.appointments.set(appointments));
  }
}
