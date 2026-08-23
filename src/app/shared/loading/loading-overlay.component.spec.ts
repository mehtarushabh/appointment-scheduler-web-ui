import { TestBed } from '@angular/core/testing';
import { LoadingOverlayComponent } from './loading-overlay.component';
import { LoadingService } from './loading.service';

describe('LoadingOverlayComponent', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [LoadingOverlayComponent] });
    const fixture = TestBed.createComponent(LoadingOverlayComponent);
    const loadingService = TestBed.inject(LoadingService);
    fixture.detectChanges();
    return { fixture, loadingService };
  }

  it('renders no overlay when nothing is loading', () => {
    const { fixture } = setup();
    const overlay = (fixture.nativeElement as HTMLElement).querySelector('.app-loading-overlay');
    expect(overlay).toBeNull();
  });

  it('renders the overlay with a spinner icon while loading', () => {
    const { fixture, loadingService } = setup();

    loadingService.start();
    fixture.detectChanges();

    const overlay = (fixture.nativeElement as HTMLElement).querySelector('.app-loading-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.querySelector('fa-icon')).not.toBeNull();
  });

  it('removes the overlay again once loading ends', () => {
    const { fixture, loadingService } = setup();

    loadingService.start();
    fixture.detectChanges();
    loadingService.end();
    fixture.detectChanges();

    const overlay = (fixture.nativeElement as HTMLElement).querySelector('.app-loading-overlay');
    expect(overlay).toBeNull();
  });
});
