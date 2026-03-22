import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';
import { SessionService } from './session.service';

/** Full session guard: requires both a Firebase user and an active AppUserSession.
 *  No Firebase user → /login. Firebase user but no session → /select-tenant. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const sessionService = inject(SessionService);

  return authState(auth).pipe(
    take(1),
    map((user) => {
      if (!user) return router.createUrlTree(['/login']);
      if (!sessionService.session()) return router.createUrlTree(['/select-tenant']);
      return true;
    }),
  );
};
