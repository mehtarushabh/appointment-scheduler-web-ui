import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PatientOnboardingService } from './patient-onboarding.service';
import { UserResponse } from '../../shared/models';
import { AuthService } from '../../core/auth.service';

/** Clinic Admin's table of their own clinic's patients (User Story 3, FR-010). */
@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './patient-list.component.html',
})
export class PatientListComponent implements OnInit {
  private readonly patientOnboardingService = inject(PatientOnboardingService);
  private readonly auth = inject(AuthService);

  readonly patients = signal<UserResponse[]>([]);
  readonly displayedColumns = ['name', 'email'];

  ngOnInit(): void {
    const clinicId = this.auth.currentUser()?.clinicId;
    if (!clinicId) {
      return;
    }
    this.patientOnboardingService.listPatients(clinicId).subscribe((patients) => this.patients.set(patients));
  }
}
