import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AllergyCategory, AllergySeverity, ClinicalHistoryDetails, MyProfileResponse } from '../../shared/models';

/**
 * Section 4 (Clinical History &amp; Health Intake, FR-015) — a self-contained, independently-
 * saved panel. Medications/allergies are repeatable rows (add/remove); saving the section at all
 * — even with both lists empty — is how a Patient explicitly reviews/confirms "none" (research.md
 * #6), so the Save action is always enabled regardless of list contents, unlike the other
 * sections' required-field gating.
 */
@Component({
  selector: 'app-clinical-history-section',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  templateUrl: './clinical-history-section.component.html',
})
export class ClinicalHistorySectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly patientProfileService = inject(PatientProfileService);
  private readonly notification = inject(NotificationService);

  @Input() clinicalHistory: ClinicalHistoryDetails | null = null;
  @Output() readonly sectionSaved = new EventEmitter<MyProfileResponse>();

  readonly allergyCategoryOptions: AllergyCategory[] = ['MEDICATION', 'FOOD', 'ENVIRONMENTAL', 'LATEX'];
  readonly allergySeverityOptions: AllergySeverity[] = ['MILD', 'MODERATE', 'SEVERE_ANAPHYLAXIS'];

  readonly form = this.fb.group({
    personalMedicalHistory: [''],
    familyMedicalHistory: [''],
    preferredPharmacyName: [''],
    medications: this.fb.array<FormGroup>([]),
    allergies: this.fb.array<FormGroup>([]),
  });

  get medications() {
    return this.form.controls.medications;
  }

  get allergies() {
    return this.form.controls.allergies;
  }

  ngOnChanges(): void {
    if (!this.clinicalHistory) {
      return;
    }
    this.form.patchValue({
      personalMedicalHistory: this.clinicalHistory.personalMedicalHistory ?? '',
      familyMedicalHistory: this.clinicalHistory.familyMedicalHistory ?? '',
      preferredPharmacyName: this.clinicalHistory.preferredPharmacyName ?? '',
    });
    this.medications.clear();
    this.clinicalHistory.medications.forEach((m) => this.addMedication(m.name, m.dosage, m.frequency));
    this.allergies.clear();
    this.clinicalHistory.allergies.forEach((a) => this.addAllergy(a.category, a.description, a.severity));
  }

  addMedication(name = '', dosage = '', frequency = ''): void {
    this.medications.push(
      this.fb.group({
        name: [name, Validators.required],
        dosage: [dosage, Validators.required],
        frequency: [frequency, Validators.required],
      })
    );
  }

  removeMedication(index: number): void {
    this.medications.removeAt(index);
  }

  addAllergy(category: AllergyCategory | '' = '', description = '', severity: AllergySeverity | '' = ''): void {
    this.allergies.push(
      this.fb.group({
        category: [category || null, Validators.required],
        description: [description, Validators.required],
        severity: [severity || null, Validators.required],
      })
    );
  }

  removeAllergy(index: number): void {
    this.allergies.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.patientProfileService
      .updateClinicalHistory({
        medications: value.medications as { name: string; dosage: string; frequency: string }[],
        allergies: value.allergies as { category: AllergyCategory; description: string; severity: AllergySeverity }[],
        personalMedicalHistory: value.personalMedicalHistory || null,
        familyMedicalHistory: value.familyMedicalHistory || null,
        preferredPharmacyName: value.preferredPharmacyName || null,
      })
      .subscribe({
        next: (profile) => {
          this.notification.success('Clinical history saved.');
          this.sectionSaved.emit(profile);
        },
        error: (err) => this.notification.error(err?.error?.message ?? 'Failed to save clinical history.'),
      });
  }
}
