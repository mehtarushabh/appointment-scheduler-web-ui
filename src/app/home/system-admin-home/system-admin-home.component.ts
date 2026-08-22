import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { ClinicOnboardingService } from '../../onboarding/clinic-onboarding/clinic-onboarding.service';
import { ClinicResponse } from '../../shared/models';

/**
 * System Admin's Home page (User Story 1): the "Registered Clinics" table with expandable rows,
 * reusing Feature 001's ClinicOnboardingService.listClinics() — no new HTTP call (research.md #2).
 * Supersedes the old plain ClinicListComponent/`/clinics` screen (research.md #3).
 *
 * Feature 008: the footer pagination controls are static visual chrome matching the reference
 * mockup only — no `MatPaginator` behavior is wired in (research.md #5).
 */
@Component({
  selector: 'app-system-admin-home',
  standalone: true,
  imports: [MatTableModule, MatCardModule, MatButtonModule, FaIconComponent],
  templateUrl: './system-admin-home.component.html',
})
export class SystemAdminHomeComponent implements OnInit {
  private readonly clinicOnboardingService = inject(ClinicOnboardingService);

  protected readonly faAngleLeft = faAngleLeft;
  protected readonly faAngleRight = faAngleRight;

  readonly clinics = signal<ClinicResponse[]>([]);
  readonly displayedColumns = ['name', 'city', 'state'];

  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.clinicOnboardingService.listClinics().subscribe((clinics) => this.clinics.set(clinics));
  }

  isExpanded(clinic: ClinicResponse): boolean {
    return this.expandedIds().has(clinic.id);
  }

  /** FR-010: each row expands/collapses independently — any number can be open at once. */
  toggle(clinic: ClinicResponse): void {
    const next = new Set(this.expandedIds());
    if (next.has(clinic.id)) {
      next.delete(clinic.id);
    } else {
      next.add(clinic.id);
    }
    this.expandedIds.set(next);
  }
}
