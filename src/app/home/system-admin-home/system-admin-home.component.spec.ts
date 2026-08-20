import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SystemAdminHomeComponent } from './system-admin-home.component';
import { ClinicOnboardingService } from '../../onboarding/clinic-onboarding/clinic-onboarding.service';
import { ClinicResponse } from '../../shared/models';

function clinic(overrides: Partial<ClinicResponse>): ClinicResponse {
  return {
    id: '1',
    name: 'Riverside Clinic',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    registeredId: 'REG-1',
    firstClinicAdmin: {
      id: 'a1',
      firstName: 'Cara',
      lastName: 'Admin',
      email: 'cara@example.com',
      dateOfBirth: '1985-01-01',
      address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
      role: 'CLINIC_ADMIN',
      clinicId: '1',
      specialty: null,
    },
    ...overrides,
  };
}

describe('SystemAdminHomeComponent', () => {
  function setup(clinics: ClinicResponse[]) {
    const listClinicsSpy = vi.fn().mockReturnValue(of(clinics));
    TestBed.configureTestingModule({
      imports: [SystemAdminHomeComponent],
      providers: [{ provide: ClinicOnboardingService, useValue: { listClinics: listClinicsSpy } }],
    });
    const fixture = TestBed.createComponent(SystemAdminHomeComponent);
    fixture.detectChanges();
    return fixture;
  }

  it("loads and renders every clinic's name/city/state (FR-009)", () => {
    const fixture = setup([clinic({ id: '1', name: 'Riverside Clinic' }), clinic({ id: '2', name: 'Lakeside Clinic' })]);

    expect(fixture.componentInstance.clinics().length).toBe(2);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Riverside Clinic');
    expect(text).toContain('Lakeside Clinic');
    expect(text).toContain('Metropolis');
    expect(text).toContain('NY');
  });

  it('toggles a row expanded/collapsed, revealing full address, registered ID, and clinic admin info (FR-010)', () => {
    const fixture = setup([clinic({ id: '1' })]);
    const [c] = fixture.componentInstance.clinics();
    expect(fixture.componentInstance.isExpanded(c)).toBe(false);

    fixture.componentInstance.toggle(c);
    expect(fixture.componentInstance.isExpanded(c)).toBe(true);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('REG-1');
    expect(text).toContain('Cara Admin');

    fixture.componentInstance.toggle(c);
    expect(fixture.componentInstance.isExpanded(c)).toBe(false);
  });

  it('expands two different rows independently at once (FR-010)', () => {
    const fixture = setup([clinic({ id: '1' }), clinic({ id: '2' })]);
    const [c1, c2] = fixture.componentInstance.clinics();

    fixture.componentInstance.toggle(c1);
    fixture.componentInstance.toggle(c2);

    expect(fixture.componentInstance.isExpanded(c1)).toBe(true);
    expect(fixture.componentInstance.isExpanded(c2)).toBe(true);
  });

  it('shows a clear empty-state message when there are no clinics registered yet', () => {
    const fixture = setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no clinics');
  });
});
