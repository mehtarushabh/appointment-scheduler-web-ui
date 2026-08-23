import { Injectable, computed, signal } from '@angular/core';

/**
 * App-wide in-flight-request tracker (feature 009): a single counter so `isLoading()` stays `true`
 * across overlapping requests and only flips back to `false` once every one of them has finished,
 * whichever finishes last. Driven by `loadingInterceptor`, consumed by `LoadingOverlayComponent`.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly requestCount = signal(0);

  readonly isLoading = computed(() => this.requestCount() > 0);

  start(): void {
    this.requestCount.update((count) => count + 1);
  }

  end(): void {
    this.requestCount.update((count) => Math.max(0, count - 1));
  }
}
