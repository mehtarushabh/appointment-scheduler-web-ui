import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { DoctorLeaveService } from './doctor-leave.service';
import { AddLeaveDialogComponent } from './add-leave-dialog/add-leave-dialog.component';
import { LeaveResponse } from '../../shared/models';
import { toDateOnlyString } from '../../shared/date-utils';

/** A Doctor's "My schedule" page (User Story 3): "Add leave" plus future/past leave tables. */
@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './doctor-schedule.component.html',
  styleUrl: './doctor-schedule.component.scss',
})
export class DoctorScheduleComponent implements OnInit {
  private readonly doctorLeaveService = inject(DoctorLeaveService);
  private readonly dialog = inject(MatDialog);

  private readonly leaves = signal<LeaveResponse[]>([]);
  readonly displayedColumns = ['date', 'fullDay', 'startTime', 'endTime'];

  readonly future = computed(() => this.leaves().filter((l) => l.date >= this.today()));
  readonly past = computed(() => this.leaves().filter((l) => l.date < this.today()));

  ngOnInit(): void {
    this.doctorLeaveService.listMyLeaves().subscribe((leaves) => this.leaves.set(leaves));
  }

  openAddLeaveDialog(): void {
    this.dialog
      .open(AddLeaveDialogComponent)
      .afterClosed()
      .subscribe((leave) => {
        if (leave) {
          this.leaves.update((leaves) => [...leaves, leave]);
        }
      });
  }

  private today(): string {
    return toDateOnlyString(new Date());
  }
}
