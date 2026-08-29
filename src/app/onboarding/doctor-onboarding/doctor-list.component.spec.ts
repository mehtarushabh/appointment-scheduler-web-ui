import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DoctorListComponent } from './doctor-list.component';
import { DoctorOnboardingService } from './doctor-onboarding.service';
import { AddDoctorDialogComponent } from './add-doctor-dialog/add-doctor-dialog.component';
import { DoctorListResponse, UserResponse } from '../../shared/models';

function doctorRow(overrides: Partial<DoctorListResponse>): DoctorListResponse {
  return {
    id: '1',
    firstName: 'Dana',
    lastName: 'Doc',
    email: 'dana@example.com',
    specialty: 'Cardiology',
    ...overrides,
  };
}

function doctorProfile(overrides: Partial<UserResponse> = {}): UserResponse {
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
  function setup(doctors: DoctorListResponse[], dialogAfterClosedResult?: UserResponse) {
    const listDoctorsSpy = vi.fn().mockReturnValue(of(doctors));
    const getDoctorProfileSpy = vi.fn().mockReturnValue(of(doctorProfile()));
    const dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(dialogAfterClosedResult) });
    TestBed.configureTestingModule({
      imports: [DoctorListComponent],
      providers: [
        { provide: DoctorOnboardingService, useValue: { listDoctors: listDoctorsSpy, getDoctorProfile: getDoctorProfileSpy } },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
    });
    const fixture = TestBed.createComponent(DoctorListComponent);
    fixture.detectChanges();
    return { fixture, getDoctorProfileSpy, dialogOpenSpy };
  }

  it('toggles a row expanded/collapsed, fetching the full profile once (FR-003, 021-user-data-restructuring)', () => {
    const { fixture, getDoctorProfileSpy } = setup([doctorRow({ id: '1', firstName: 'Dana', lastName: 'Doc', specialty: 'Cardiology' })]);
    const [d] = fixture.componentInstance.doctors();
    expect(fixture.componentInstance.isExpanded(d)).toBe(false);

    fixture.componentInstance.toggle(d);
    expect(fixture.componentInstance.isExpanded(d)).toBe(true);
    expect(getDoctorProfileSpy).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.profileFor(d)).toEqual(doctorProfile());
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('dana@example.com');
    expect(text).toContain('1988-01-01');
    expect(text).toContain('1 Main St');

    fixture.componentInstance.toggle(d);
    expect(fixture.componentInstance.isExpanded(d)).toBe(false);

    fixture.componentInstance.toggle(d);
    expect(getDoctorProfileSpy).toHaveBeenCalledTimes(1);
  });

  it('expands two different rows independently at once (FR-003)', () => {
    const { fixture } = setup([doctorRow({ id: '1' }), doctorRow({ id: '2' })]);
    const [d1, d2] = fixture.componentInstance.doctors();

    fixture.componentInstance.toggle(d1);
    fixture.componentInstance.toggle(d2);

    expect(fixture.componentInstance.isExpanded(d1)).toBe(true);
    expect(fixture.componentInstance.isExpanded(d2)).toBe(true);
  });

  it('marks each clickable row with the shared hover-cursor class (Feature 018 FR-003)', () => {
    const { fixture } = setup([doctorRow({ id: '1' })]);

    const row = (fixture.nativeElement as HTMLElement).querySelector('tr.app-clickable-row');

    expect(row).toBeTruthy();
  });

  it('opens AddDoctorDialogComponent when "Add a new doctor" is triggered (FR-005)', () => {
    const { fixture, dialogOpenSpy } = setup([]);

    fixture.componentInstance.openAddDoctorDialog();

    expect(dialogOpenSpy).toHaveBeenCalledWith(AddDoctorDialogComponent);
  });

  it('appends the created doctor to the list when the dialog closes with a result (FR-008)', () => {
    const created = doctorProfile({ id: 'new-1', firstName: 'New', lastName: 'Doc' });
    const { fixture } = setup([doctorRow({ id: '1' })], created);

    fixture.componentInstance.openAddDoctorDialog();

    expect(fixture.componentInstance.doctors().map((d) => d.id)).toEqual(['1', 'new-1']);
  });

  it('leaves the list unchanged when the dialog closes with no result (FR-010)', () => {
    const { fixture } = setup([doctorRow({ id: '1' })], undefined);

    fixture.componentInstance.openAddDoctorDialog();

    expect(fixture.componentInstance.doctors().map((d) => d.id)).toEqual(['1']);
  });

  it('shows a clear empty-state message when there are no doctors onboarded yet (FR-011)', () => {
    const { fixture } = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no doctors');
  });
});
