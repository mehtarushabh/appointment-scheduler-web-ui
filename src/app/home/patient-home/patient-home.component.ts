import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AppointmentService } from '../../scheduling/appointments/appointment.service';
import { AppointmentResponse } from '../../shared/models';
import { compareBySoonest, isWithinNextDays, toDateOnlyString } from '../../shared/date-utils';
import { ProfileCompletionStatusService } from '../../shared/profile/profile-completion-status.service';

/**
 * How many days ahead (inclusive of today) the Patient home dashboard previews (feature 010). Kept
 * as a single named constant — not inlined — per spec FR-008, so a future profile-editing feature
 * can source this from a per-user preference instead of this fixed default without reworking the
 * filtering logic itself.
 */
const PATIENT_HOME_WINDOW_DAYS = 7;

/**
 * Patient's Home page ("upcoming week," feature 010): every SCHEDULED appointment within the next
 * `PATIENT_HOME_WINDOW_DAYS` days (today through 6 days from now, inclusive) as cards — past/
 * completed/cancelled appointments, and anything further out, belong on the Appointments tab, not
 * the "Welcome back" screen, so they are deliberately not shown here at all.
 *
 * Feature 013: requests exactly that window directly from the server (resolved via clarification
 * to stay forward-looking, unlike Clinic Admin/Doctor — a Patient has no Complete/Cancel actions
 * to use on an overdue view) instead of fetching the patient's entire appointment history and
 * filtering it here.
 */
@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './patient-home.component.html',
})
export class PatientHomeComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);
  private readonly profileCompletionStatus = inject(ProfileCompletionStatusService);

  private readonly appointments = signal<AppointmentResponse[]>([]);

  readonly upcoming = computed(() =>
    this.appointments()
      .filter((a) => a.state === 'SCHEDULED' && isWithinNextDays(a.date, PATIENT_HOME_WINDOW_DAYS))
      .sort(compareBySoonest)
  );

  /**
   * Feature 016 FR-019: the shell already fetches this Patient's completion status (to gate the
   * Schedule appointment nav link) into the same shared cache, so this reads it rather than
   * fetching GET /me/profile a second time. `null` (not yet known) never shows the banner.
   */
  readonly profileIncomplete = computed(() => this.profileCompletionStatus.profileComplete() === false);

  ngOnInit(): void {
    const today = new Date();
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + PATIENT_HOME_WINDOW_DAYS - 1);

    this.appointmentService
      .searchMyAppointments({
        criteria: { states: ['SCHEDULED'], dateOnOrAfter: toDateOnlyString(today), dateOnOrBefore: toDateOnlyString(windowEnd) },
        page: 0,
        size: 100,
      })
      .subscribe((response) => this.appointments.set(response.items));
  }

  goToEditProfile(): void {
    this.router.navigateByUrl('/edit-profile');
  }
}
