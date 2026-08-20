import { TestBed } from '@angular/core/testing';
import { ClinicAdminHomeComponent } from './clinic-admin-home.component';

describe('ClinicAdminHomeComponent', () => {
  it('renders', () => {
    TestBed.configureTestingModule({ imports: [ClinicAdminHomeComponent] });
    const fixture = TestBed.createComponent(ClinicAdminHomeComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
