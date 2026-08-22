import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { PatientOnboardingService } from './patient-onboarding.service';
import { AddPatientDialogComponent } from './add-patient-dialog/add-patient-dialog.component';
import { UserResponse } from '../../shared/models';

/**
 * Clinic Admin's table of their own clinic's patients (Feature 001 US3; row-expansion and the
 * "Add a new patient" pop-up are Feature 006, FR-003/FR-005).
 */
@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatCardModule],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
})
export class PatientListComponent implements OnInit {
  private readonly patientOnboardingService = inject(PatientOnboardingService);
  private readonly dialog = inject(MatDialog);

  readonly patients = signal<UserResponse[]>([]);
  readonly displayedColumns = ['name', 'email'];

  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.patientOnboardingService.listPatients().subscribe((patients) => this.patients.set(patients));
  }

  isExpanded(patient: UserResponse): boolean {
    return this.expandedIds().has(patient.id);
  }

  /** FR-003: each row expands/collapses independently — any number can be open at once. */
  toggle(patient: UserResponse): void {
    const next = new Set(this.expandedIds());
    if (next.has(patient.id)) {
      next.delete(patient.id);
    } else {
      next.add(patient.id);
    }
    this.expandedIds.set(next);
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
