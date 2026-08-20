import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { AddDoctorDialogComponent } from './add-doctor-dialog/add-doctor-dialog.component';
import { UserResponse } from '../../shared/models';
import { AuthService } from '../../core/auth.service';

/**
 * Clinic Admin's table of their own clinic's doctors (Feature 001 US2; row-expansion and the
 * "Add a new doctor" pop-up are Feature 005, FR-003/FR-005).
 */
@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.scss',
})
export class DoctorListComponent implements OnInit {
  private readonly doctorOnboardingService = inject(DoctorOnboardingService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly doctors = signal<UserResponse[]>([]);
  readonly displayedColumns = ['name', 'email', 'specialty'];

  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    const clinicId = this.auth.currentUser()?.clinicId;
    if (!clinicId) {
      return;
    }
    this.doctorOnboardingService.listDoctors(clinicId).subscribe((doctors) => this.doctors.set(doctors));
  }

  isExpanded(doctor: UserResponse): boolean {
    return this.expandedIds().has(doctor.id);
  }

  /** FR-003: each row expands/collapses independently — any number can be open at once. */
  toggle(doctor: UserResponse): void {
    const next = new Set(this.expandedIds());
    if (next.has(doctor.id)) {
      next.delete(doctor.id);
    } else {
      next.add(doctor.id);
    }
    this.expandedIds.set(next);
  }

  openAddDoctorDialog(): void {
    this.dialog
      .open(AddDoctorDialogComponent)
      .afterClosed()
      .subscribe((doctor) => {
        if (doctor) {
          this.doctors.update((doctors) => [...doctors, doctor]);
        }
      });
  }
}
