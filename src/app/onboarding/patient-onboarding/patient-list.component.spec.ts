import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PatientListComponent } from './patient-list.component';
import { PatientOnboardingService } from './patient-onboarding.service';
import { AddPatientDialogComponent } from './add-patient-dialog/add-patient-dialog.component';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

function patient(overrides: Partial<UserResponse>): UserResponse {
  return {
    id: '1',
    firstName: 'Pat',
    lastName: 'Ient',
    email: 'pat@example.com',
    dateOfBirth: '1995-03-03',
    address: { addressLine1: '9 Oak St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    role: 'PATIENT',
    clinicId: 'clinic-1',
    specialty: null,
    ...overrides,
  };
}

describe('PatientListComponent', () => {
  function setup(patients: UserResponse[], dialogAfterClosedResult?: UserResponse) {
    const listPatientsSpy = vi.fn().mockReturnValue(of(patients));
    const dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(dialogAfterClosedResult) });
    TestBed.configureTestingModule({
      imports: [PatientListComponent],
      providers: [
        { provide: PatientOnboardingService, useValue: { listPatients: listPatientsSpy } },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
    });
    const fixture = TestBed.createComponent(PatientListComponent);
    fixture.detectChanges();
    return { fixture, listPatientsSpy, dialogOpenSpy };
  }

  it('loads only the current clinic patients on init', () => {
    const { fixture, listPatientsSpy } = setup([patient({ id: '1' })]);

    expect(listPatientsSpy).toHaveBeenCalledWith('clinic-1');
    expect(fixture.componentInstance.patients().length).toBe(1);
  });

  it('toggles a row expanded/collapsed, revealing full details (FR-003)', () => {
    const { fixture } = setup([patient({ id: '1', firstName: 'Pat', lastName: 'Ient' })]);
    const [p] = fixture.componentInstance.patients();
    expect(fixture.componentInstance.isExpanded(p)).toBe(false);

    fixture.componentInstance.toggle(p);
    expect(fixture.componentInstance.isExpanded(p)).toBe(true);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('pat@example.com');
    expect(text).toContain('1995-03-03');
    expect(text).toContain('9 Oak St');

    fixture.componentInstance.toggle(p);
    expect(fixture.componentInstance.isExpanded(p)).toBe(false);
  });

  it('expands two different rows independently at once (FR-003)', () => {
    const { fixture } = setup([patient({ id: '1' }), patient({ id: '2' })]);
    const [p1, p2] = fixture.componentInstance.patients();

    fixture.componentInstance.toggle(p1);
    fixture.componentInstance.toggle(p2);

    expect(fixture.componentInstance.isExpanded(p1)).toBe(true);
    expect(fixture.componentInstance.isExpanded(p2)).toBe(true);
  });

  it('opens AddPatientDialogComponent when "Add a new patient" is triggered (FR-005)', () => {
    const { fixture, dialogOpenSpy } = setup([]);

    fixture.componentInstance.openAddPatientDialog();

    expect(dialogOpenSpy).toHaveBeenCalledWith(AddPatientDialogComponent);
  });

  it('appends the created/linked patient to the list when the dialog closes with a result (FR-008)', () => {
    const created = patient({ id: 'new-1', firstName: 'New', lastName: 'Patient' });
    const { fixture } = setup([patient({ id: '1' })], created);

    fixture.componentInstance.openAddPatientDialog();

    expect(fixture.componentInstance.patients().map((p) => p.id)).toEqual(['1', 'new-1']);
  });

  it('leaves the list unchanged when the dialog closes with no result (FR-010)', () => {
    const { fixture } = setup([patient({ id: '1' })], undefined);

    fixture.componentInstance.openAddPatientDialog();

    expect(fixture.componentInstance.patients().map((p) => p.id)).toEqual(['1']);
  });

  it('shows a clear empty-state message when there are no patients onboarded yet (FR-011)', () => {
    const { fixture } = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no patients');
  });
});
