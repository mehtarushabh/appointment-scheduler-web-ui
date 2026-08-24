import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DoctorPatientListComponent } from './doctor-patient-list.component';
import { PatientOnboardingService } from '../../onboarding/patient-onboarding/patient-onboarding.service';
import { PatientProfileView, UserResponse } from '../../shared/models';

describe('DoctorPatientListComponent', () => {
  let listPatientsSpy: ReturnType<typeof vi.fn>;
  let getPatientProfileSpy: ReturnType<typeof vi.fn>;
  const patient = { id: 'p1', firstName: 'Pat', lastName: 'Ient', email: 'pat@example.com' } as UserResponse;

  beforeEach(() => {
    listPatientsSpy = vi.fn().mockReturnValue(of([patient]));
    getPatientProfileSpy = vi.fn().mockReturnValue(of({ firstName: 'Pat' } as PatientProfileView));
    TestBed.configureTestingModule({
      imports: [DoctorPatientListComponent],
      providers: [
        { provide: PatientOnboardingService, useValue: { listPatients: listPatientsSpy, getPatientProfile: getPatientProfileSpy } },
      ],
    });
  });

  it('lists the clinic\'s patients on init', () => {
    const fixture = TestBed.createComponent(DoctorPatientListComponent);

    fixture.detectChanges();

    expect(listPatientsSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.patients()).toEqual([patient]);
  });

  it('fetches and caches the full profile on first expand, and does not re-fetch on collapse/re-expand', () => {
    const fixture = TestBed.createComponent(DoctorPatientListComponent);
    fixture.detectChanges();

    fixture.componentInstance.toggle(patient);
    expect(getPatientProfileSpy).toHaveBeenCalledWith('p1');
    expect(fixture.componentInstance.isExpanded(patient)).toBe(true);
    expect(fixture.componentInstance.profileFor(patient)).toEqual({ firstName: 'Pat' });

    fixture.componentInstance.toggle(patient);
    expect(fixture.componentInstance.isExpanded(patient)).toBe(false);

    fixture.componentInstance.toggle(patient);
    expect(getPatientProfileSpy).toHaveBeenCalledTimes(1);
  });

  it('expands and collapses multiple rows independently', () => {
    const patient2 = { ...patient, id: 'p2' } as UserResponse;
    listPatientsSpy.mockReturnValue(of([patient, patient2]));
    const fixture = TestBed.createComponent(DoctorPatientListComponent);
    fixture.detectChanges();

    fixture.componentInstance.toggle(patient);
    fixture.componentInstance.toggle(patient2);

    expect(fixture.componentInstance.isExpanded(patient)).toBe(true);
    expect(fixture.componentInstance.isExpanded(patient2)).toBe(true);
  });

  it('marks each clickable row with the shared hover-cursor class (Feature 018 FR-002)', () => {
    const fixture = TestBed.createComponent(DoctorPatientListComponent);
    fixture.detectChanges();

    const row = (fixture.nativeElement as HTMLElement).querySelector('tr.app-clickable-row');

    expect(row).toBeTruthy();
  });
});
