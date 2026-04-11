import { Injectable, signal } from '@angular/core';
import { AppUserSession } from 'shared/kinds';

const SESSION_KEY = 'app-session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly session = signal<AppUserSession | null>(this.loadFromStorage());

  setSession(session: AppUserSession): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.session.set(null);
  }

  private loadFromStorage(): AppUserSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AppUserSession) : null;
    } catch {
      return null;
    }
  }
}
