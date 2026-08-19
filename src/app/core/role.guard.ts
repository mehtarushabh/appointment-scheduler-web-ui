import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService, UserRole } from './auth.service';

/** Route guard factory: only lets the route match if the current user holds one of `roles`. */
export function roleGuard(...roles: UserRole[]): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();
    if (user && roles.includes(user.role)) {
      return true;
    }
    return router.createUrlTree(['/login']);
  };
}

/** Route guard: only requires the user to be logged in, regardless of role. */
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
