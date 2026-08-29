import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PreferencesSectionComponent } from './preferences-section.component';
import { UserPreferencesService } from '../user-preferences.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../notification/notification.service';
import { UserPreferencesResponse } from '../../models';

describe('PreferencesSectionComponent', () => {
  let updatePreferencesSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let authServiceStub: { currentUser: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    updatePreferencesSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    authServiceStub = { currentUser: vi.fn().mockReturnValue({ role: 'CLINIC_ADMIN' }) };
    TestBed.configureTestingModule({
      imports: [PreferencesSectionComponent],
      providers: [
        { provide: UserPreferencesService, useValue: { updatePreferences: updatePreferencesSpy } },
        { provide: AuthService, useValue: authServiceStub },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
  });

  it('defaults to Home page when no preferences input is given', () => {
    const fixture = TestBed.createComponent(PreferencesSectionComponent);

    expect(fixture.componentInstance.form.getRawValue().defaultLandingPage).toBe('/home');
  });

  it('pre-fills the form from the preferences input', () => {
    const fixture = TestBed.createComponent(PreferencesSectionComponent);

    fixture.componentInstance.preferences = { defaultLandingPage: '/appointments' };

    expect(fixture.componentInstance.form.getRawValue().defaultLandingPage).toBe('/appointments');
  });

  it("lists Home page plus the caller's own role's nav pages", () => {
    const fixture = TestBed.createComponent(PreferencesSectionComponent);

    const paths = fixture.componentInstance.landingPageOptions().map((o) => o.path);

    expect(paths).toEqual(['/home', '/clinic-settings', '/doctors', '/patients', '/appointments']);
  });

  it('saves the section and emits the updated preferences on success', () => {
    const updated: UserPreferencesResponse = { defaultLandingPage: '/appointments' };
    updatePreferencesSpy.mockReturnValue(of(updated));
    const fixture = TestBed.createComponent(PreferencesSectionComponent);
    fixture.componentInstance.form.setValue({ defaultLandingPage: '/appointments' });
    const emitted: UserPreferencesResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.save();

    expect(updatePreferencesSpy).toHaveBeenCalledWith({ defaultLandingPage: '/appointments' });
    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(emitted).toEqual([updated]);
  });

  it('shows an error toast and does not emit on failure', () => {
    updatePreferencesSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed.' } })));
    const fixture = TestBed.createComponent(PreferencesSectionComponent);
    const emitted: UserPreferencesResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.save();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed.');
    expect(emitted).toEqual([]);
  });
});
