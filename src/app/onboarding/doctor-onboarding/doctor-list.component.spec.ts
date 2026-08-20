import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DoctorListComponent } from './doctor-list.component';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { AddDoctorDialogComponent } from './add-doctor-dialog/add-doctor-dialog.component';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

function doctor(overrides: Partial<UserResponse>): UserResponse {
  return {
    id: '1',
    firstName: 'Dana',
    lastName: 'Doc',
    email: 'dana@example.com',
    dateOfBirth: '1988-01-01',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    role: 'DOCTOR',
    clinicId: 'clinic-1',
    specialty: 'Cardiology',
    ...overrides,
  };
}

describe('DoctorListComponent', () => {
  function setup(doctors: UserResponse[], dialogAfterClosedResult?: UserResponse) {
    const listDoctorsSpy = vi.fn().mockReturnValue(of(doctors));
    const dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(dialogAfterClosedResult) });
    TestBed.configureTestingModule({
      imports: [DoctorListComponent],
      providers: [
        { provide: DoctorOnboardingService, useValue: { listDoctors: listDoctorsSpy } },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
    });
    const fixture = TestBed.createComponent(DoctorListComponent);
    fixture.detectChanges();
    return { fixture, dialogOpenSpy };
  }

  it('toggles a row expanded/collapsed, revealing full details (FR-003)', () => {
    const { fixture } = setup([doctor({ id: '1', firstName: 'Dana', lastName: 'Doc', specialty: 'Cardiology' })]);
    const [d] = fixture.componentInstance.doctors();
    expect(fixture.componentInstance.isExpanded(d)).toBe(false);

    fixture.componentInstance.toggle(d);
    expect(fixture.componentInstance.isExpanded(d)).toBe(true);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('dana@example.com');
    expect(text).toContain('1988-01-01');
    expect(text).toContain('1 Main St');

    fixture.componentInstance.toggle(d);
    expect(fixture.componentInstance.isExpanded(d)).toBe(false);
  });

  it('expands two different rows independently at once (FR-003)', () => {
    const { fixture } = setup([doctor({ id: '1' }), doctor({ id: '2' })]);
    const [d1, d2] = fixture.componentInstance.doctors();

    fixture.componentInstance.toggle(d1);
    fixture.componentInstance.toggle(d2);

    expect(fixture.componentInstance.isExpanded(d1)).toBe(true);
    expect(fixture.componentInstance.isExpanded(d2)).toBe(true);
  });

  it('opens AddDoctorDialogComponent when "Add a new doctor" is triggered (FR-005)', () => {
    const { fixture, dialogOpenSpy } = setup([]);

    fixture.componentInstance.openAddDoctorDialog();

    expect(dialogOpenSpy).toHaveBeenCalledWith(AddDoctorDialogComponent);
  });

  it('appends the created doctor to the list when the dialog closes with a result (FR-008)', () => {
    const created = doctor({ id: 'new-1', firstName: 'New', lastName: 'Doc' });
    const { fixture } = setup([doctor({ id: '1' })], created);

    fixture.componentInstance.openAddDoctorDialog();

    expect(fixture.componentInstance.doctors().map((d) => d.id)).toEqual(['1', 'new-1']);
  });

  it('leaves the list unchanged when the dialog closes with no result (FR-010)', () => {
    const { fixture } = setup([doctor({ id: '1' })], undefined);

    fixture.componentInstance.openAddDoctorDialog();

    expect(fixture.componentInstance.doctors().map((d) => d.id)).toEqual(['1']);
  });

  it('shows a clear empty-state message when there are no doctors onboarded yet (FR-011)', () => {
    const { fixture } = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no doctors');
  });
});
