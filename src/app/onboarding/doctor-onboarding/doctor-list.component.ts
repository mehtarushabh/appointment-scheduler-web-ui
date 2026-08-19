import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { UserResponse } from '../../shared/models';
import { AuthService } from '../../core/auth.service';

/** Clinic Admin's table of their own clinic's doctors (User Story 2, FR-010). */
@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements OnInit {
  private readonly doctorOnboardingService = inject(DoctorOnboardingService);
  private readonly auth = inject(AuthService);

  readonly doctors = signal<UserResponse[]>([]);
  readonly displayedColumns = ['name', 'email', 'specialty'];

  ngOnInit(): void {
    const clinicId = this.auth.currentUser()?.clinicId;
    if (!clinicId) {
      return;
    }
    this.doctorOnboardingService.listDoctors(clinicId).subscribe((doctors) => this.doctors.set(doctors));
  }
}
