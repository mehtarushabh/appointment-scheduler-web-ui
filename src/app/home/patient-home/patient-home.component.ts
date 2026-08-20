import { Component } from '@angular/core';

/**
 * Patient's Home page (User Story 4). Intentionally minimal — upcoming-appointment content is
 * deferred until the Appointments and Schedule Appointment features exist (spec.md Assumptions,
 * FR-013); nav to Schedule appointment/Appointments is provided by the shared AppShellComponent.
 */
@Component({
  selector: 'app-patient-home',
  standalone: true,
  templateUrl: './patient-home.component.html',
})
export class PatientHomeComponent {}
