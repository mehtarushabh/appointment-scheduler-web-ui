import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { ClinicOnboardingService } from './clinic-onboarding.service';
import { ClinicResponse } from '../../shared/models';

/** System Admin's table of every onboarded clinic (User Story 1, acceptance scenario 3). */
@Component({
  selector: 'app-clinic-list',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './clinic-list.component.html',
})
export class ClinicListComponent implements OnInit {
  private readonly clinicOnboardingService = inject(ClinicOnboardingService);

  readonly clinics = signal<ClinicResponse[]>([]);
  readonly displayedColumns = ['name', 'registeredId', 'firstClinicAdmin'];

  ngOnInit(): void {
    this.clinicOnboardingService.listClinics().subscribe((clinics) => this.clinics.set(clinics));
  }
}
