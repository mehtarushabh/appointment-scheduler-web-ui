import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { PatientDetailsResponse } from '../../shared/models';

/**
 * A Patient's personal phone (022-role-details-endpoints) — moved off Basic Information, its own
 * self-contained, independently-saved panel matching the other Patient sections' structure.
 */
@Component({
  selector: 'app-personal-phone-section',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  templateUrl: './personal-phone-section.component.html',
})
export class PersonalPhoneSectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly patientProfileService = inject(PatientProfileService);
  private readonly notification = inject(NotificationService);

  @Input() personalPhone: string | null = null;
  @Output() readonly sectionSaved = new EventEmitter<PatientDetailsResponse>();

  readonly form = this.fb.group({
    personalPhone: ['', Validators.required],
  });

  ngOnChanges(): void {
    this.form.patchValue({ personalPhone: this.personalPhone ?? '' });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.patientProfileService.updatePersonalPhone({ personalPhone: value.personalPhone || null }).subscribe({
      next: (details) => {
        this.notification.success('Personal phone saved.');
        this.sectionSaved.emit(details);
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to save personal phone.'),
    });
  }
}
