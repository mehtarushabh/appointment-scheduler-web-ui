import { TestBed } from '@angular/core/testing';
import { DoctorHomeComponent } from './doctor-home.component';

describe('DoctorHomeComponent', () => {
  it('renders', () => {
    TestBed.configureTestingModule({ imports: [DoctorHomeComponent] });
    const fixture = TestBed.createComponent(DoctorHomeComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
