import { TestBed } from '@angular/core/testing';
import { PatientHomeComponent } from './patient-home.component';

describe('PatientHomeComponent', () => {
  it('renders', () => {
    TestBed.configureTestingModule({ imports: [PatientHomeComponent] });
    const fixture = TestBed.createComponent(PatientHomeComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
