import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from './session.service';

/** Injects the AppUserSession ID as the Bearer token for all /api/* requests.
 *  Requests to /api/security/* are excluded — they pass the Firebase token in the request body. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  // Security endpoints (tenant list + session creation) carry the token in the body.
  if (req.url.startsWith('/api/security/')) {
    return next(req);
  }

  const sessionService = inject(SessionService);
  const sessionID = sessionService.session()?.sessionID;

  if (!sessionID) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${sessionID}` } }),
  );
};
