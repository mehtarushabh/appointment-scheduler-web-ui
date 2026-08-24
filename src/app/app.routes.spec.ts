import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { AuthService, AuthSession, UserRole } from './core/auth.service';

/**
 * Angular validates route config shape (e.g. every route needs one of component/loadComponent/
 * redirectTo/children/loadChildren) only when the Router is actually constructed — a guard-level
 * unit test calling a CanMatchFn directly never exercises this, so a malformed route can pass
 * every other test and still crash the app at startup (NG04014). This test builds the real
 * Router with the real route config to catch that class of bug.
 */
describe('routes', () => {
  it('is a valid route configuration', () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    expect(() => TestBed.inject(Router)).not.toThrow();
  });
});

/**
 * `home` (and every role-restricted path) is registered as several sibling route configs sharing
 * the same path, one per role, distinguished only by canMatch. Guard-level unit tests can't catch
 * a guard that breaks this fallback — they call the guard directly, not through the Router — so
 * this exercises real navigation through the real route config for every role, the way a login
 * redirect actually does. Regression test for the bug where roleGuard returned a UrlTree instead
 * of `false` on mismatch, which made Angular redirect on the first non-matching sibling instead of
 * trying the rest, bouncing every non-SYSTEM_ADMIN role back to /login after a successful login.
 */
describe('role-based /home dispatch', () => {
  function sessionFor(role: UserRole): AuthSession {
    return { token: 'jwt', role, clinicId: null, firstName: 'Ada', lastName: 'Admin', clinicName: null };
  }

  function setup(role: UserRole) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: { currentUser: () => sessionFor(role), isAuthenticated: () => true },
        },
      ],
    });
    return TestBed.inject(Router);
  }

  it.each<UserRole>(['SYSTEM_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'PATIENT'])(
    'lands a logged-in %s on /home instead of bouncing back to /login',
    async (role) => {
      const router = setup(role);
      await router.navigateByUrl('/home');
      expect(router.url).toBe('/home');
    }
  );
});

/**
 * Feature 016: `doctor/patients` moved from a `ComingSoonComponent` placeholder to a real,
 * role-guarded screen, and there is deliberately no separate "patient-profile" route — Sections
 * 2-5 live on `edit-profile` instead (see edit-profile.component.spec.ts). Guard-level unit tests
 * alone wouldn't catch a route wired to the wrong component or missing a guard entirely — this
 * exercises real navigation through the real route config, the same regression class as the /home
 * suite above.
 */
describe('Feature 016 routes', () => {
  function sessionFor(role: UserRole): AuthSession {
    return { token: 'jwt', role, clinicId: null, firstName: 'Ada', lastName: 'Admin', clinicName: null };
  }

  function setup(role: UserRole) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: { currentUser: () => sessionFor(role), isAuthenticated: () => true },
        },
      ],
    });
    return TestBed.inject(Router);
  }

  it('lets a Doctor reach /doctor/patients now that it is a real screen, not the coming-soon placeholder', async () => {
    const router = setup('DOCTOR');
    await router.navigateByUrl('/doctor/patients');
    expect(router.url).toBe('/doctor/patients');
  });

  it('no longer registers a separate /patient-profile route — a Patient falls through to the wildcard redirect', async () => {
    const router = setup('PATIENT');
    await router.navigateByUrl('/patient-profile');
    expect(router.url).not.toBe('/patient-profile');
  });
});
