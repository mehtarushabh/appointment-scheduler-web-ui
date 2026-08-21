import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { DoctorLeaveService } from '../doctor-leave.service';
import { NotificationService } from '../../../shared/notification/notification.service';
import { toDateOnlyString } from '../../../shared/date-utils';
import { AppointmentResponse, LeaveRequest, LeaveResponse } from '../../../shared/models';

/**
 * "Add leave" pop-up (User Story 3): a fields step (date via MatCalendar, "Full day" default
 * checked, a 30-minute-increment time range when unchecked), then — only if the leave conflicts
 * with SCHEDULED appointments and hasn't been confirmed yet — a conflict step offering "cancel all
 * conflicting appointments and add the leave" or "abandon the leave" (FR-028, research.md #7).
 */
@Component({
  selector: 'app-add-leave-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './add-leave-dialog.component.html',
  // See AddDoctorDialogComponent: MatDialog-created components need this provided explicitly for
  // the inline calendar's DateAdapter to resolve (NG0201 fix).
  providers: [provideNativeDateAdapter()],
})
export class AddLeaveDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly doctorLeaveService = inject(DoctorLeaveService);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<AddLeaveDialogComponent, LeaveResponse>);

  readonly step = signal<'fields' | 'conflict'>('fields');
  readonly selectedDate = signal<Date | null>(null);
  readonly showTimeRange = signal(false);
  readonly conflictingAppointments = signal<AppointmentResponse[]>([]);

  private pendingRequest: LeaveRequest | null = null;

  readonly form = this.fb.group({
    fullDay: [true],
    startTime: [''],
    endTime: [''],
  });

  constructor() {
    this.form.controls.fullDay.valueChanges.subscribe((fullDay) => this.showTimeRange.set(!fullDay));
  }

  selectDate(date: Date | null): void {
    this.selectedDate.set(date);
  }

  confirm(): void {
    const date = this.selectedDate();
    if (!date || this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    const request: LeaveRequest = {
      date: toDateOnlyString(date),
      fullDay: value.fullDay!,
      startTime: value.fullDay ? null : value.startTime,
      endTime: value.fullDay ? null : value.endTime,
    };
    this.submit(request);
  }

  cancelAllAndAdd(): void {
    if (!this.pendingRequest) {
      return;
    }
    this.submit({ ...this.pendingRequest, confirmCancelConflicts: true });
  }

  abandon(): void {
    this.dialogRef.close();
  }

  private submit(request: LeaveRequest): void {
    this.pendingRequest = request;
    this.doctorLeaveService.addLeave(request).subscribe({
      next: (leave) => {
        this.notification.success('Leave added successfully.');
        this.dialogRef.close(leave);
      },
      error: (err) => {
        const conflicts = err?.error?.conflictingAppointments;
        if (conflicts) {
          this.conflictingAppointments.set(conflicts);
          this.step.set('conflict');
        } else {
          this.notification.error(err?.error?.message ?? 'Failed to add leave.');
        }
      },
    });
  }
}
