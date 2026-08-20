import { Component } from '@angular/core';

/**
 * Doctor's Home page (User Story 3). Intentionally minimal — upcoming-appointment content is
 * deferred until a dedicated Appointments feature exists (spec.md Assumptions, FR-013); nav to
 * Patients/Appointments is provided by the shared AppShellComponent, not this page.
 */
@Component({
  selector: 'app-doctor-home',
  standalone: true,
  templateUrl: './doctor-home.component.html',
})
export class DoctorHomeComponent {}
