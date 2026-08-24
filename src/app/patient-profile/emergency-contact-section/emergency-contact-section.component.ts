import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { EmergencyContactDetails, EmergencyContactRelationship, MyProfileResponse } from '../../shared/models';

/** Section 2 (Emergency Contact Information, FR-013) — a self-contained, independently-saved panel. */
@Component({
  selector: 'app-emergency-contact-section',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  templateUrl: './emergency-contact-section.component.html',
})
export class EmergencyContactSectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly patientProfileService = inject(PatientProfileService);
  private readonly notification = inject(NotificationService);

  @Input() emergencyContact: EmergencyContactDetails | null = null;
  @Output() readonly sectionSaved = new EventEmitter<MyProfileResponse>();

  readonly relationshipOptions: EmergencyContactRelationship[] = ['SPOUSAL', 'PARENT', 'SIBLING', 'FRIEND', 'GUARDIAN', 'OTHER'];

  readonly form = this.fb.group({
    contactFullName: ['', Validators.required],
    relationship: [null as EmergencyContactRelationship | null, Validators.required],
    primaryPhone: ['', Validators.required],
    secondaryPhone: [''],
  });

  ngOnChanges(): void {
    if (this.emergencyContact) {
      this.form.patchValue({
        contactFullName: this.emergencyContact.contactFullName ?? '',
        relationship: this.emergencyContact.relationship,
        primaryPhone: this.emergencyContact.primaryPhone ?? '',
        secondaryPhone: this.emergencyContact.secondaryPhone ?? '',
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.patientProfileService
      .updateEmergencyContact({
        contactFullName: value.contactFullName || null,
        relationship: value.relationship,
        primaryPhone: value.primaryPhone || null,
        secondaryPhone: value.secondaryPhone || null,
      })
      .subscribe({
        next: (profile) => {
          this.notification.success('Emergency contact saved.');
          this.sectionSaved.emit(profile);
        },
        error: (err) => this.notification.error(err?.error?.message ?? 'Failed to save emergency contact.'),
      });
  }
}
