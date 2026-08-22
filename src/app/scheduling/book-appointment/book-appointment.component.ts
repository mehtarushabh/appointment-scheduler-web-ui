import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { AppointmentService } from '../appointments/appointment.service';
import { PatientOnboardingService } from '../../onboarding/patient-onboarding/patient-onboarding.service';
import { ClinicSettingsService } from '../../onboarding/clinic-onboarding/clinic-settings/clinic-settings.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { ClinicResponse, DayOfWeek, DoctorSummaryResponse } from '../../shared/models';
import { toDateOnlyString } from '../../shared/date-utils';

const DAY_OF_WEEK_BY_JS_INDEX: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/**
 * A Patient's booking flow (User Story 2): clinic (skipped if only one) -> doctor -> day ->
 * duration -> available start time -> confirm.
 */
@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    FaIconComponent,
  ],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.scss',
})
export class BookAppointmentComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientOnboardingService = inject(PatientOnboardingService);
  private readonly clinicSettingsService = inject(ClinicSettingsService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly faCircleCheck = faCircleCheck;

  readonly clinics = signal<ClinicResponse[]>([]);
  readonly selectedClinicId = signal<string | null>(null);
  readonly showClinicDropdown = computed(() => this.clinics().length > 1);

  readonly doctors = signal<DoctorSummaryResponse[]>([]);
  readonly selectedDoctorId = signal<string | null>(null);

  private readonly closedDaysOfWeek = signal<ReadonlySet<DayOfWeek>>(new Set());

  readonly selectedDuration = signal<30 | 60>(30);
  readonly selectedDate = signal<Date | null>(null);
  readonly availableStartTimes = signal<string[]>([]);
  readonly selectedStartTime = signal<string | null>(null);

  readonly dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return false;
    }
    return !this.closedDaysOfWeek().has(DAY_OF_WEEK_BY_JS_INDEX[date.getDay()]);
  };

  ngOnInit(): void {
    this.patientOnboardingService.listMyClinics().subscribe((clinics) => {
      this.clinics.set(clinics);
      if (clinics.length === 1) {
        this.selectClinic(clinics[0].id);
      }
    });
  }

  doctorLabel(doctor: DoctorSummaryResponse): string {
    return `${doctor.firstName} ${doctor.lastName} - ${doctor.specialty}`;
  }

  selectClinic(clinicId: string): void {
    this.selectedClinicId.set(clinicId);
    this.selectedDoctorId.set(null);
    this.resetDateAndTime();
    this.appointmentService.listBookableDoctors(clinicId).subscribe((doctors) => this.doctors.set(doctors));
    this.clinicSettingsService.getWorkingHours(clinicId).subscribe((hours) => {
      const closed = hours.filter((h) => !h.isOpen).map((h) => h.dayOfWeek);
      this.closedDaysOfWeek.set(new Set(closed));
    });
  }

  selectDoctor(doctorId: string): void {
    this.selectedDoctorId.set(doctorId);
    this.resetDateAndTime();
  }

  selectDuration(duration: 30 | 60): void {
    this.selectedDuration.set(duration);
    this.refreshAvailableSlots();
  }

  selectDate(date: Date | null): void {
    if (!date) {
      return;
    }
    this.selectedDate.set(date);
    this.refreshAvailableSlots();
  }

  selectStartTime(startTime: string): void {
    this.selectedStartTime.set(startTime);
  }

  confirm(): void {
    const clinicId = this.selectedClinicId();
    const doctorId = this.selectedDoctorId();
    const date = this.selectedDate();
    const startTime = this.selectedStartTime();
    if (!clinicId || !doctorId || !date || !startTime) {
      return;
    }

    this.appointmentService
      .bookAppointment({ clinicId, doctorId, date: toDateOnlyString(date), startTime, durationMinutes: this.selectedDuration() })
      .subscribe({
        next: () => {
          this.notification.success('Appointment booked successfully.');
          this.router.navigateByUrl('/home');
        },
        error: (err) => this.notification.error(err?.error?.message ?? 'Failed to book appointment.'),
      });
  }

  private resetDateAndTime(): void {
    this.selectedDate.set(null);
    this.availableStartTimes.set([]);
    this.selectedStartTime.set(null);
  }

  private refreshAvailableSlots(): void {
    const clinicId = this.selectedClinicId();
    const doctorId = this.selectedDoctorId();
    const date = this.selectedDate();
    if (!clinicId || !doctorId || !date) {
      return;
    }
    this.selectedStartTime.set(null);
    this.appointmentService
      .getAvailableSlots(clinicId, doctorId, toDateOnlyString(date), this.selectedDuration())
      .subscribe((response) => this.availableStartTimes.set(response.startTimes));
  }
}
