import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { PatientOnboardingService } from '../../onboarding/patient-onboarding/patient-onboarding.service';
import { PatientProfileViewComponent } from '../../shared/patient-profile-view/patient-profile-view.component';
import { PatientProfileView, UserResponse } from '../../shared/models';

/**
 * A Doctor's table of their own clinic's patients (Feature 016 FR-024), replacing the
 * `ComingSoonComponent` placeholder that stood in for this screen since routing was first laid
 * out. Reuses {@link PatientListComponent}'s row-expansion pattern; on first expand, fetches and
 * caches that patient's full read-only profile via the same endpoint the Clinic Admin's Patients
 * page uses.
 */
@Component({
  selector: 'app-doctor-patient-list',
  standalone: true,
  imports: [MatTableModule, MatCardModule, PatientProfileViewComponent],
  templateUrl: './doctor-patient-list.component.html',
})
export class DoctorPatientListComponent implements OnInit {
  private readonly patientOnboardingService = inject(PatientOnboardingService);

  readonly patients = signal<UserResponse[]>([]);
  readonly displayedColumns = ['name', 'email'];

  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());
  private readonly profiles = signal<ReadonlyMap<string, PatientProfileView>>(new Map());

  ngOnInit(): void {
    this.patientOnboardingService.listPatients().subscribe((patients) => this.patients.set(patients));
  }

  isExpanded(patient: UserResponse): boolean {
    return this.expandedIds().has(patient.id);
  }

  profileFor(patient: UserResponse): PatientProfileView | null {
    return this.profiles().get(patient.id) ?? null;
  }

  toggle(patient: UserResponse): void {
    const next = new Set(this.expandedIds());
    if (next.has(patient.id)) {
      next.delete(patient.id);
      this.expandedIds.set(next);
      return;
    }
    next.add(patient.id);
    this.expandedIds.set(next);

    if (!this.profiles().has(patient.id)) {
      this.patientOnboardingService.getPatientProfile(patient.id).subscribe((profile) => {
        const nextProfiles = new Map(this.profiles());
        nextProfiles.set(patient.id, profile);
        this.profiles.set(nextProfiles);
      });
    }
  }
}
