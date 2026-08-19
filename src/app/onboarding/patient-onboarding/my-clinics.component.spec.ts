import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MyClinicsComponent } from './my-clinics.component';
import { PatientOnboardingService } from './patient-onboarding.service';
import { ClinicResponse } from '../../shared/models';

describe('MyClinicsComponent', () => {
  it('loads every clinic the current patient is associated with', () => {
    const listMyClinicsSpy = vi.fn().mockReturnValue(of([{ id: '1' } as ClinicResponse, { id: '2' } as ClinicResponse]));
    TestBed.configureTestingModule({
      imports: [MyClinicsComponent],
      providers: [{ provide: PatientOnboardingService, useValue: { listMyClinics: listMyClinicsSpy } }],
    });

    const fixture = TestBed.createComponent(MyClinicsComponent);
    fixture.detectChanges();

    expect(listMyClinicsSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.clinics().length).toBe(2);
  });
});
