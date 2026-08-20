import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const TOAST_DURATION_MS = 4000;

/**
 * App-wide toast feedback (feature 004): a single success()/error() surface so any action, in any
 * screen, reports its outcome the same way rather than each screen inventing its own notification.
 * Uses MatSnackBar's built-in dismiss-on-new-open behavior, so a second call while a toast is still
 * showing replaces it rather than stacking (FR-010).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'app-toast-success');
  }

  error(message: string): void {
    this.show(message, 'app-toast-error');
  }

  private show(message: string, panelClass: string): void {
    this.snackBar.open(message, undefined, {
      duration: TOAST_DURATION_MS,
      panelClass: ['app-toast', panelClass],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
