import { Component } from '@angular/core';

/**
 * Clinic Admin's Home page (User Story 2). Intentionally minimal — upcoming-appointment content
 * is deferred until a dedicated Appointments feature exists (spec.md Assumptions, FR-013); nav to
 * Doctors/Patients/Appointments is provided by the shared AppShellComponent, not this page.
 */
@Component({
  selector: 'app-clinic-admin-home',
  standalone: true,
  templateUrl: './clinic-admin-home.component.html',
})
export class ClinicAdminHomeComponent {}
