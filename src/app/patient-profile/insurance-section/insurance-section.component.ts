import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { BiologicalSex, InsuranceDetails, MyProfileResponse, PolicyholderRelationship } from '../../shared/models';

/**
 * Section 3 (Insurance &amp; Financial Responsibility, FR-014) — a self-contained, independently-
 * saved panel. When Policyholder Relationship is set to "Self", Policyholder Name/Date of Birth/
 * Biological Sex are pre-filled from the patient's own Section 1 values — a one-time copy at the
 * moment of selection, not a live link (spec Assumptions; if the patient's own values change
 * later, this section is not silently rewritten). Group Number is disabled whenever "My plan has
 * no group number" is checked (research.md #6's not-applicable flag) — Reactive Forms owns a
 * form-control-bound field's disabled state via the control itself, not a template attribute
 * binding, so this is done with `.disable()`/`.enable()`, not `[attr.disabled]`.
 */
@Component({
  selector: 'app-insurance-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './insurance-section.component.html',
})
export class InsuranceSectionComponent implements OnChanges, OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patientProfileService = inject(PatientProfileService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() insurance: InsuranceDetails | null = null;
  @Input() patientName: string | null = null;
  @Input() patientDateOfBirth: string | null = null;
  @Input() patientBiologicalSex: BiologicalSex | null = null;
  @Output() readonly sectionSaved = new EventEmitter<MyProfileResponse>();

  readonly relationshipOptions: PolicyholderRelationship[] = ['SELF', 'SPOUSE', 'CHILD'];
  readonly biologicalSexOptions: BiologicalSex[] = ['MALE', 'FEMALE', 'INTERSEX', 'PREFER_NOT_TO_SAY'];

  readonly form = this.fb.group({
    insuranceName: ['', Validators.required],
    memberId: ['', Validators.required],
    groupId: [''],
    hasNoGroupNumber: [false],
    policyholderName: ['', Validators.required],
    policyholderRelationship: [null as PolicyholderRelationship | null, Validators.required],
    policyholderDateOfBirth: ['', Validators.required],
    policyholderBiologicalSex: [null as BiologicalSex | null, Validators.required],
  });

  ngOnInit(): void {
    this.form.controls.hasNoGroupNumber.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((hasNoGroupNumber) => this.applyGroupNumberDisabledState(!!hasNoGroupNumber));
  }

  ngOnChanges(): void {
    if (this.insurance) {
      this.form.patchValue({
        insuranceName: this.insurance.insuranceName ?? '',
        memberId: this.insurance.memberId ?? '',
        groupId: this.insurance.groupId ?? '',
        hasNoGroupNumber: this.insurance.hasNoGroupNumber,
        policyholderName: this.insurance.policyholderName ?? '',
        policyholderRelationship: this.insurance.policyholderRelationship,
        policyholderDateOfBirth: this.insurance.policyholderDateOfBirth ?? '',
        policyholderBiologicalSex: this.insurance.policyholderBiologicalSex,
      });
      this.applyGroupNumberDisabledState(this.insurance.hasNoGroupNumber);
    }
  }

  onRelationshipChange(relationship: PolicyholderRelationship | null): void {
    if (relationship === 'SELF') {
      this.form.patchValue({
        policyholderName: this.patientName,
        policyholderDateOfBirth: this.patientDateOfBirth,
        policyholderBiologicalSex: this.patientBiologicalSex,
      });
    }
  }

  private applyGroupNumberDisabledState(hasNoGroupNumber: boolean): void {
    if (hasNoGroupNumber) {
      this.form.controls.groupId.disable({ emitEvent: false });
    } else {
      this.form.controls.groupId.enable({ emitEvent: false });
    }
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.patientProfileService
      .updateInsurance({
        insuranceName: value.insuranceName || null,
        memberId: value.memberId || null,
        groupId: value.hasNoGroupNumber ? null : value.groupId || null,
        hasNoGroupNumber: value.hasNoGroupNumber ?? false,
        policyholderName: value.policyholderName || null,
        policyholderRelationship: value.policyholderRelationship,
        policyholderDateOfBirth: value.policyholderDateOfBirth || null,
        policyholderBiologicalSex: value.policyholderBiologicalSex,
      })
      .subscribe({
        next: (profile) => {
          this.notification.success('Insurance information saved.');
          this.sectionSaved.emit(profile);
        },
        error: (err) => this.notification.error(err?.error?.message ?? 'Failed to save insurance information.'),
      });
  }
}
