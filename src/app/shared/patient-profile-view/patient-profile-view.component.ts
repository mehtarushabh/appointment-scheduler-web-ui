import { Component, Input } from '@angular/core';
import { PatientProfileView } from '../models';

/**
 * Read-only rendering of a patient's whole profile (Feature 016 FR-024) — shared by the Clinic
 * Admin's Patients page and the Doctor's Patients page, since both consume the same
 * {@link PatientProfileView} shape from `GET /clinics/me/patients/{id}/profile`. No edit
 * affordance anywhere in this component; this caller never edits (research.md #10).
 */
@Component({
  selector: 'app-patient-profile-view',
  standalone: true,
  templateUrl: './patient-profile-view.component.html',
})
export class PatientProfileViewComponent {
  @Input({ required: true }) profile!: PatientProfileView;
}
