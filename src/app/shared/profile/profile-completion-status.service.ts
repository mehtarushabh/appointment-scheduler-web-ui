import { Injectable, signal } from '@angular/core';

/**
 * Shared client-side cache of whether the current Patient's profile is complete (Feature 016
 * FR-019/FR-020), so the shell's "Schedule appointment" nav link and the Patient home page banner
 * agree without each independently re-fetching GET /me/profile — and so finishing the last
 * required section in Edit Profile unlocks scheduling everywhere immediately, with no page
 * reload. `null` means not yet known (e.g. the initial fetch hasn't resolved); callers should
 * treat that as "don't block yet" — the server remains the actual enforcement point regardless of
 * this cache's state.
 */
@Injectable({ providedIn: 'root' })
export class ProfileCompletionStatusService {
  private readonly complete = signal<boolean | null>(null);

  readonly profileComplete = this.complete.asReadonly();

  set(value: boolean): void {
    this.complete.set(value);
  }

  reset(): void {
    this.complete.set(null);
  }
}
