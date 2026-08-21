import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AddLeaveDialogComponent } from './add-leave-dialog.component';
import { DoctorLeaveService } from '../doctor-leave.service';
import { NotificationService } from '../../../shared/notification/notification.service';
import { AppointmentResponse, LeaveResponse } from '../../../shared/models';

describe('AddLeaveDialogComponent', () => {
  let addLeaveSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRefStub: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    addLeaveSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    dialogRefStub = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AddLeaveDialogComponent],
      providers: [
        { provide: DoctorLeaveService, useValue: { addLeave: addLeaveSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
      ],
    });
  });

  it('has "Full day" checked by default', () => {
    const fixture = TestBed.createComponent(AddLeaveDialogComponent);
    expect(fixture.componentInstance.form.controls.fullDay.value).toBe(true);
  });

  it('reveals the time-range selector when "Full day" is unchecked', () => {
    const fixture = TestBed.createComponent(AddLeaveDialogComponent);
    expect(fixture.componentInstance.showTimeRange()).toBe(false);

    fixture.componentInstance.form.controls.fullDay.setValue(false);

    expect(fixture.componentInstance.showTimeRange()).toBe(true);
  });

  it('closes the dialog with the created leave when there are no conflicts', () => {
    const created: LeaveResponse = { id: 'leave-1', date: '2026-08-24', fullDay: true, startTime: null, endTime: null };
    addLeaveSpy.mockReturnValue(of(created));
    const fixture = TestBed.createComponent(AddLeaveDialogComponent);
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));

    fixture.componentInstance.confirm();

    expect(addLeaveSpy).toHaveBeenCalledWith({ date: '2026-08-24', fullDay: true, startTime: null, endTime: null });
    expect(dialogRefStub.close).toHaveBeenCalledWith(created);
  });

  it('shows the conflicting appointments and offers cancel-all/abandon on a 409 conflict', () => {
    const conflicting = [{ id: 'appt-1', patientName: 'Pat Ient' } as AppointmentResponse];
    addLeaveSpy.mockReturnValue(
      throwError(() => ({ error: { message: 'Conflicts exist.', conflictingAppointments: conflicting } }))
    );
    const fixture = TestBed.createComponent(AddLeaveDialogComponent);
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));

    fixture.componentInstance.confirm();

    expect(fixture.componentInstance.step()).toBe('conflict');
    expect(fixture.componentInstance.conflictingAppointments()).toEqual(conflicting);
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('resubmits with confirmCancelConflicts: true when "cancel all and add the leave" is chosen', () => {
    const created: LeaveResponse = { id: 'leave-1', date: '2026-08-24', fullDay: true, startTime: null, endTime: null };
    addLeaveSpy.mockReturnValue(
      throwError(() => ({ error: { message: 'Conflicts exist.', conflictingAppointments: [{ id: 'appt-1' } as AppointmentResponse] } }))
    );
    const fixture = TestBed.createComponent(AddLeaveDialogComponent);
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));
    fixture.componentInstance.confirm();
    addLeaveSpy.mockReturnValue(of(created));

    fixture.componentInstance.cancelAllAndAdd();

    expect(addLeaveSpy).toHaveBeenCalledWith({ date: '2026-08-24', fullDay: true, startTime: null, endTime: null, confirmCancelConflicts: true });
    expect(dialogRefStub.close).toHaveBeenCalledWith(created);
  });

  it('closes with no result when "abandon" is chosen', () => {
    const fixture = TestBed.createComponent(AddLeaveDialogComponent);

    fixture.componentInstance.abandon();

    expect(dialogRefStub.close).toHaveBeenCalledWith();
    expect(addLeaveSpy).not.toHaveBeenCalled();
  });
});
