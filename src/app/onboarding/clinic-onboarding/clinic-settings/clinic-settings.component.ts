import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AddressFormComponent, AddressFormValue, createAddressFormGroup } from '../../../shared/address-form/address-form.component';
import { NotificationService } from '../../../shared/notification/notification.service';
import { AuthService } from '../../../core/auth.service';
import { ClinicSettingsService } from './clinic-settings.service';
import { DayOfWeek, WorkingHoursEntry } from '../../../shared/models';

const DAY_ORDER: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * A Clinic Admin's own clinic profile (name/address, never the Registered ID, FR-003) and 7-day
 * working-hours table (FR-004–FR-007), User Story 1.
 */
@Component({
  selector: 'app-clinic-settings',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, AddressFormComponent],
  templateUrl: './clinic-settings.component.html',
  styleUrl: './clinic-settings.component.scss',
})
export class ClinicSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clinicSettingsService = inject(ClinicSettingsService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly registeredId = signal('');

  readonly profileForm = this.fb.group({
    name: ['', Validators.required],
    address: createAddressFormGroup(this.fb),
  });

  private readonly days = this.fb.array(DAY_ORDER.map((day) => this.createDayGroup(day)));
  readonly hoursForm = this.fb.group({ days: this.days });

  get dayGroups(): FormGroup[] {
    return this.days.controls as FormGroup[];
  }

  ngOnInit(): void {
    const clinicId = this.auth.currentUser()?.clinicId;
    if (!clinicId) {
      return;
    }
    this.clinicSettingsService.getProfile().subscribe((clinic) => {
      this.registeredId.set(clinic.registeredId);
      this.profileForm.patchValue({ name: clinic.name, address: clinic.address });
    });
    this.clinicSettingsService.getWorkingHours(clinicId).subscribe((hours) => this.applyHours(hours));
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }
    const value = this.profileForm.getRawValue();
    this.clinicSettingsService.updateProfile({ name: value.name!, address: value.address as AddressFormValue }).subscribe({
      next: () => this.notification.success('Clinic profile updated.'),
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to update clinic profile.'),
    });
  }

  saveHours(): void {
    const days: WorkingHoursEntry[] = this.dayGroups.map((group) => {
      const value = group.getRawValue();
      return {
        dayOfWeek: value.dayOfWeek,
        isOpen: value.isOpen,
        startTime: value.isOpen ? value.startTime : null,
        endTime: value.isOpen ? value.endTime : null,
      };
    });

    this.clinicSettingsService.updateWorkingHours({ days }).subscribe({
      next: (hours) => {
        this.applyHours(hours);
        this.notification.success('Working hours updated.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to update working hours.'),
    });
  }

  private createDayGroup(day: DayOfWeek): FormGroup {
    const group = this.fb.group({
      dayOfWeek: [day],
      isOpen: [false],
      startTime: [{ value: '', disabled: true }],
      endTime: [{ value: '', disabled: true }],
    });
    group.get('isOpen')!.valueChanges.subscribe((isOpen) => this.applyOpenState(group, !!isOpen));
    return group;
  }

  /** FR-006: a closed day's time inputs are inactive, matching quickstart Scenario 1 step 2. */
  private applyOpenState(group: FormGroup, isOpen: boolean): void {
    const startTime = group.get('startTime')!;
    const endTime = group.get('endTime')!;
    if (isOpen) {
      startTime.enable({ emitEvent: false });
      endTime.enable({ emitEvent: false });
    } else {
      startTime.disable({ emitEvent: false });
      endTime.disable({ emitEvent: false });
    }
  }

  private applyHours(hours: WorkingHoursEntry[]): void {
    const byDay = new Map(hours.map((entry) => [entry.dayOfWeek, entry]));
    DAY_ORDER.forEach((day, index) => {
      const entry = byDay.get(day);
      const group = this.days.at(index) as FormGroup;
      group.patchValue({
        isOpen: entry?.isOpen ?? false,
        startTime: entry?.startTime ?? '',
        endTime: entry?.endTime ?? '',
      });
      this.applyOpenState(group, entry?.isOpen ?? false);
    });
  }
}
