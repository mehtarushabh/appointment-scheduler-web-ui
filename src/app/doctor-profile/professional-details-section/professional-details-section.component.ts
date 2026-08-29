import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DoctorProfileService } from '../doctor-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { DoctorDetailsResponse } from '../../shared/models';

/**
 * A Doctor's professional/credentialing details — a self-contained, independently-saved panel, a
 * second panel below Basic Information rather than a section-list entry (022-role-details-
 * endpoints research.md #8 — a Doctor has few extra fields, unlike a Patient's five sections).
 * 023-doctor-professional-details: renamed from SpecialtySectionComponent and extended with
 * Professional Bio, NPI Number, and State License Number (research.md #6) — all four fields share
 * one whole-section-replace save, so updating just one (e.g. NPI Number) naturally resends the
 * other three's already-pre-filled values unchanged (research.md #2).
 */
@Component({
  selector: 'app-professional-details-section',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  templateUrl: './professional-details-section.component.html',
})
export class ProfessionalDetailsSectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly doctorProfileService = inject(DoctorProfileService);
  private readonly notification = inject(NotificationService);

  @Input() doctorDetails: DoctorDetailsResponse | null = null;
  @Output() readonly sectionSaved = new EventEmitter<DoctorDetailsResponse>();

  readonly form = this.fb.group({
    specialty: ['', Validators.required],
    professionalBio: ['', Validators.maxLength(2000)],
    npiNumber: ['', Validators.pattern(/^\d{10}$/)],
    stateLicenseNumber: ['', Validators.maxLength(50)],
  });

  ngOnChanges(): void {
    if (this.doctorDetails) {
      this.form.patchValue({
        specialty: this.doctorDetails.specialty ?? '',
        professionalBio: this.doctorDetails.professionalBio ?? '',
        npiNumber: this.doctorDetails.npiNumber ?? '',
        stateLicenseNumber: this.doctorDetails.stateLicenseNumber ?? '',
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.doctorProfileService
      .updateDoctorDetails({
        specialty: value.specialty!,
        professionalBio: value.professionalBio || null,
        npiNumber: value.npiNumber || null,
        stateLicenseNumber: value.stateLicenseNumber || null,
      })
      .subscribe({
        next: (details) => {
          this.notification.success('Professional details saved.');
          this.sectionSaved.emit(details);
        },
        error: (err) => this.notification.error(err?.error?.message ?? 'Failed to save professional details.'),
      });
  }
}
