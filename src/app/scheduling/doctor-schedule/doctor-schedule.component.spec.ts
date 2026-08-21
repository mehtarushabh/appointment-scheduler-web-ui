import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DoctorScheduleComponent } from './doctor-schedule.component';
import { DoctorLeaveService } from './doctor-leave.service';
import { AddLeaveDialogComponent } from './add-leave-dialog/add-leave-dialog.component';
import { LeaveResponse } from '../../shared/models';

function leave(overrides: Partial<LeaveResponse>): LeaveResponse {
  return { id: '1', date: '2026-08-24', fullDay: true, startTime: null, endTime: null, ...overrides };
}

describe('DoctorScheduleComponent', () => {
  function setup(leaves: LeaveResponse[], dialogAfterClosedResult?: LeaveResponse) {
    const listMyLeavesSpy = vi.fn().mockReturnValue(of(leaves));
    const dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(dialogAfterClosedResult) });
    TestBed.configureTestingModule({
      imports: [DoctorScheduleComponent],
      providers: [
        { provide: DoctorLeaveService, useValue: { listMyLeaves: listMyLeavesSpy } },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
    });
    const fixture = TestBed.createComponent(DoctorScheduleComponent);
    fixture.detectChanges();
    return { fixture, dialogOpenSpy };
  }

  it('splits leave entries into future (date >= today) and past (date < today) tables', () => {
    const future = leave({ id: 'f1', date: '2999-01-01' });
    const past = leave({ id: 'p1', date: '2000-01-01' });
    const { fixture } = setup([future, past]);

    expect(fixture.componentInstance.future().map((l) => l.id)).toEqual(['f1']);
    expect(fixture.componentInstance.past().map((l) => l.id)).toEqual(['p1']);
  });

  it('opens AddLeaveDialogComponent when "Add leave" is triggered', () => {
    const { fixture, dialogOpenSpy } = setup([]);

    fixture.componentInstance.openAddLeaveDialog();

    expect(dialogOpenSpy).toHaveBeenCalledWith(AddLeaveDialogComponent);
  });

  it('appends a returned leave to the future table without a full refetch', () => {
    const created = leave({ id: 'new-1', date: '2999-01-01' });
    const { fixture, dialogOpenSpy } = setup([], created);
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(created) });

    fixture.componentInstance.openAddLeaveDialog();

    expect(fixture.componentInstance.future().map((l) => l.id)).toEqual(['new-1']);
  });

  it('shows empty-state messages when a table has no rows', () => {
    const { fixture } = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no upcoming leave');
    expect(text.toLowerCase()).toContain('no past leave');
  });
});
