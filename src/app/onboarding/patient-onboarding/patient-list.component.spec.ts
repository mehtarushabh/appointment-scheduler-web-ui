import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientListComponent } from './patient-list.component';
import { PatientOnboardingService } from './patient-onboarding.service';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../shared/models';

describe('PatientListComponent', () => {
  it('loads only the current clinic patients on init', () => {
    const listPatientsSpy = vi.fn().mockReturnValue(of([{ id: '1' } as UserResponse]));
    TestBed.configureTestingModule({
      imports: [PatientListComponent],
      providers: [
        { provide: PatientOnboardingService, useValue: { listPatients: listPatientsSpy } },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
      ],
    });

    const fixture = TestBed.createComponent(PatientListComponent);
    fixture.detectChanges();

    expect(listPatientsSpy).toHaveBeenCalledWith('clinic-1');
    expect(fixture.componentInstance.patients().length).toBe(1);
  });
});
