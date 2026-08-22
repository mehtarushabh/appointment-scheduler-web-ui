import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faSort, faAnglesLeft, faAnglesRight, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { AddDoctorDialogComponent } from './add-doctor-dialog/add-doctor-dialog.component';
import { UserResponse } from '../../shared/models';

/**
 * Clinic Admin's table of their own clinic's doctors (Feature 001 US2; row-expansion and the
 * "Add a new doctor" pop-up are Feature 005, FR-003/FR-005).
 *
 * Feature 008: the header sort icons and footer pagination controls are static visual chrome
 * matching the reference mockup only — no `MatSort`/`MatPaginator` behavior is wired in, since
 * sorting/pagination isn't functionality this app has today (research.md #5).
 */
@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatCardModule, FaIconComponent],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.scss',
})
export class DoctorListComponent implements OnInit {
  private readonly doctorOnboardingService = inject(DoctorOnboardingService);
  private readonly dialog = inject(MatDialog);

  protected readonly faArrowUp = faArrowUp;
  protected readonly faSort = faSort;
  protected readonly faAnglesLeft = faAnglesLeft;
  protected readonly faAnglesRight = faAnglesRight;
  protected readonly faChevronLeft = faChevronLeft;
  protected readonly faChevronRight = faChevronRight;

  readonly doctors = signal<UserResponse[]>([]);
  readonly displayedColumns = ['name', 'email', 'specialty'];

  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.doctorOnboardingService.listDoctors().subscribe((doctors) => this.doctors.set(doctors));
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
