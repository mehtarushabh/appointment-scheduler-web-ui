import { Component, OnInit, inject, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { PatientOnboardingService } from './patient-onboarding.service';
import { ClinicResponse } from '../../shared/models';

/**
 * Minimal view for a logged-in Patient of every clinic they're associated with (US3, FR-013).
 * Intentionally minimal — the polished Patient home page is feature APP-6.
 */
@Component({
  selector: 'app-my-clinics',
  standalone: true,
  imports: [MatListModule],
  templateUrl: './my-clinics.component.html',
})
export class MyClinicsComponent implements OnInit {
  private readonly patientOnboardingService = inject(PatientOnboardingService);

  readonly clinics = signal<ClinicResponse[]>([]);

  ngOnInit(): void {
    this.patientOnboardingService.listMyClinics().subscribe((clinics) => this.clinics.set(clinics));
  }
}
