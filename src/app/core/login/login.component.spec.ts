import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { UserPreferencesService } from '../../shared/preferences/user-preferences.service';

describe('LoginComponent', () => {
  let loginSpy: ReturnType<typeof vi.fn>;
  let getPreferencesSpy: ReturnType<typeof vi.fn>;
  let navigateByUrlSpy: ReturnType<typeof vi.fn>;

  function setup() {
    loginSpy = vi.fn().mockReturnValue(of({}));
    getPreferencesSpy = vi.fn().mockReturnValue(of({ defaultLandingPage: '/home' }));
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login: loginSpy } },
        { provide: UserPreferencesService, useValue: { getPreferences: getPreferencesSpy } },
      ],
    });
    const fixture = TestBed.createComponent(LoginComponent);
    navigateByUrlSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true) as unknown as ReturnType<
      typeof vi.fn
    >;
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ email: 'pat@example.com', password: 'password' });
    return fixture;
  }

  it('renders the password field masked by default (feature 008)', () => {
    const fixture = setup();
    expect(fixture.componentInstance.passwordVisible()).toBe(false);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[formcontrolname="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('toggling password visibility reveals it as plain text, and toggling again re-masks it (feature 008)', () => {
    const fixture = setup();

    fixture.componentInstance.togglePasswordVisibility();
    fixture.detectChanges();
    expect(fixture.componentInstance.passwordVisible()).toBe(true);
    let input = (fixture.nativeElement as HTMLElement).querySelector('input[formcontrolname="password"]') as HTMLInputElement;
    expect(input.type).toBe('text');

    fixture.componentInstance.togglePasswordVisibility();
    fixture.detectChanges();
    expect(fixture.componentInstance.passwordVisible()).toBe(false);
    input = (fixture.nativeElement as HTMLElement).querySelector('input[formcontrolname="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  // 026-user-preferences: after a successful login, redirect to the saved default landing page
  // instead of always going to Home.
  describe('post-login redirect (026-user-preferences)', () => {
    it('navigates to the saved default landing page on successful login', () => {
      const fixture = setup();
      getPreferencesSpy.mockReturnValue(of({ defaultLandingPage: '/appointments' }));

      fixture.componentInstance.submit();

      expect(getPreferencesSpy).toHaveBeenCalled();
      expect(navigateByUrlSpy).toHaveBeenCalledWith('/appointments');
    });

    it('navigates to Home when no preference has ever been saved', () => {
      const fixture = setup();
      getPreferencesSpy.mockReturnValue(of({ defaultLandingPage: '/home' }));

      fixture.componentInstance.submit();

      expect(navigateByUrlSpy).toHaveBeenCalledWith('/home');
    });

    it('falls back to Home, without blocking the already-successful login, if the preferences fetch errors', () => {
      const fixture = setup();
      getPreferencesSpy.mockReturnValue(throwError(() => new Error('network error')));

      fixture.componentInstance.submit();

      expect(navigateByUrlSpy).toHaveBeenCalledWith('/home');
    });
  });
});
