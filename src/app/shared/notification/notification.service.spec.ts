import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: { open: openSpy } }],
    });
  });

  it('opens a green success toast that auto-dismisses (FR-002, FR-003, FR-006)', () => {
    const service = TestBed.inject(NotificationService);

    service.success('Clinic Riverside Clinic onboarded successfully.');

    expect(openSpy).toHaveBeenCalledWith(
      'Clinic Riverside Clinic onboarded successfully.',
      undefined,
      expect.objectContaining({ panelClass: ['app-toast', 'app-toast-success'], duration: expect.any(Number) })
    );
  });

  it('opens a red failure toast that auto-dismisses (FR-004, FR-005, FR-006)', () => {
    const service = TestBed.inject(NotificationService);

    service.error('Same clinic ID already exists.');

    expect(openSpy).toHaveBeenCalledWith(
      'Same clinic ID already exists.',
      undefined,
      expect.objectContaining({ panelClass: ['app-toast', 'app-toast-error'], duration: expect.any(Number) })
    );
  });
});
