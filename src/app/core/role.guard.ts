import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService, UserRole } from './auth.service';

/**
 * Route guard factory: only lets the route match if the current user holds one of `roles`.
 *
 * Must return `false` (not a UrlTree) on mismatch: several paths (e.g. `home`) are registered as
 * multiple sibling route configs, one per role, and Angular only tries the next sibling when
 * canMatch returns `false`. A UrlTree here would short-circuit that fallback and redirect
 * immediately on the first non-matching role, before the correct sibling is ever tried. Falling
 * through all siblings still lands on the `**` -> login redirect for a genuinely unmatched user.
 */
export function roleGuard(...roles: UserRole[]): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const user = auth.currentUser();
    return !!user && roles.includes(user.role);
  };
}

/** Route guard: only requires the user to be logged in, regardless of role. */
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

/** Route guard for `login`: an already-authenticated user is sent to /home instead (feature 003, research.md #7). */
export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/home']) : true;
};

/**
 * Always redirects the bare `''` path: to `/home` if a session exists, else `/login` (research.md
 * #8). Now that the shell wraps `login` too — so it can no longer gate itself with `authGuard` —
 * this replaces that guard's old job of sending an unauthenticated bare-root visitor onward.
 */
export const rootRedirectGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return router.createUrlTree([auth.isAuthenticated() ? '/home' : '/login']);
};
