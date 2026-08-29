import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { PatientOnboardingService } from './patient-onboarding.service';
import { AddPatientDialogComponent } from './add-patient-dialog/add-patient-dialog.component';
import { PatientProfileViewComponent } from '../../shared/patient-profile-view/patient-profile-view.component';
import { PatientListResponse, PatientProfileView } from '../../shared/models';

/**
 * Clinic Admin's table of their own clinic's patients (Feature 001 US3; row-expansion and the
 * "Add a new patient" pop-up are Feature 006, FR-003/FR-005). Feature 016 FR-024: expanding a row
 * now fetches and shows that patient's whole profile (Sections 1-5), not just the basic fields
 * already in the list response — reusing the same read-only view the Doctor's Patients page uses.
 */
@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatCardModule, PatientProfileViewComponent],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
})
export class PatientListComponent implements OnInit {
  private readonly patientOnboardingService = inject(PatientOnboardingService);
  private readonly dialog = inject(MatDialog);

  readonly patients = signal<PatientListResponse[]>([]);
  readonly displayedColumns = ['name', 'email'];

  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());
  private readonly profiles = signal<ReadonlyMap<string, PatientProfileView>>(new Map());

  ngOnInit(): void {
    this.patientOnboardingService.listPatients().subscribe((patients) => this.patients.set(patients));
  }

  isExpanded(patient: PatientListResponse): boolean {
    return this.expandedIds().has(patient.id);
  }

  profileFor(patient: PatientListResponse): PatientProfileView | null {
    return this.profiles().get(patient.id) ?? null;
  }

  /** FR-003: each row expands/collapses independently — any number can be open at once. */
  toggle(patient: PatientListResponse): void {
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

  openAddPatientDialog(): void {
    this.dialog
      .open(AddPatientDialogComponent)
      .afterClosed()
      .subscribe((patient) => {
        if (patient) {
          this.patients.update((patients) => [...patients, patient]);
        }
      });
  }
}
