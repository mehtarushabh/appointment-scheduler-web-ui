import { Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { LoadingService } from './loading.service';

/**
 * App-wide, full-screen blocking overlay (feature 009, spec FR-006): rendered once at the true
 * application root (see app.html) so it covers every page, not just those wired up individually.
 * Present in the DOM only while `LoadingService.isLoading()` is true, so it never intercepts clicks
 * the rest of the time.
 */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss',
})
export class LoadingOverlayComponent {
  private readonly loadingService = inject(LoadingService);

  protected readonly faSpinner = faSpinner;
  protected readonly isLoading = this.loadingService.isLoading;
}
