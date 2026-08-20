import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ComingSoonComponent } from './coming-soon.component';

describe('ComingSoonComponent', () => {
  it('shows a "not yet available" message naming the feature from route data', () => {
    TestBed.configureTestingModule({
      imports: [ComingSoonComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { featureName: 'Appointments' } } } },
      ],
    });

    const fixture = TestBed.createComponent(ComingSoonComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Appointments');
    expect(text.toLowerCase()).toContain('not yet available');
  });
});
