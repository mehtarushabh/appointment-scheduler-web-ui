import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

/**
 * Tracks every request through the app's shared HttpClient in `LoadingService` (feature 009), so
 * `LoadingOverlayComponent` can show a spinner without any screen/service opting in individually.
 * `finalize()` guarantees `end()` fires exactly once per request whether it succeeds, errors, or is
 * unsubscribed (e.g., the user navigates away mid-request) — the overlay can never get stuck.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  loadingService.start();
  return next(req).pipe(finalize(() => loadingService.end()));
};
