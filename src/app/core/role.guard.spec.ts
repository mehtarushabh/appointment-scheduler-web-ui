import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { guestGuard, rootRedirectGuard } from './role.guard';

describe('guestGuard', () => {
  function setup(isAuthenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } },
      ],
    });
    return TestBed.inject(Router);
  }

  it('allows access to /login when no session exists', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, [] as never));
    expect(result).toBe(true);
  });

  it('redirects an already-authenticated user away from /login, to /home', () => {
    const router = setup(true);
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, [] as never));
    expect(result).toEqual(router.createUrlTree(['/home']));
  });
});

describe('rootRedirectGuard', () => {
  function setup(isAuthenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } },
      ],
    });
    return TestBed.inject(Router);
  }

  it('redirects the bare root to /login when no session exists', () => {
    const router = setup(false);
    const result = TestBed.runInInjectionContext(() => rootRedirectGuard({} as never, [] as never));
    expect(result).toEqual(router.createUrlTree(['/login']));
  });

  it('redirects the bare root to /home when a session exists', () => {
    const router = setup(true);
    const result = TestBed.runInInjectionContext(() => rootRedirectGuard({} as never, [] as never));
    expect(result).toEqual(router.createUrlTree(['/home']));
  });
});
