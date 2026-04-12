import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, User, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, ActionCodeSettings } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  readonly currentUser: Signal<User | null | undefined> = toSignal(authState(this.auth));

  signIn(email: string, password: string): Promise<User> {
    return signInWithEmailAndPassword(this.auth, email, password).then((cred) => cred.user);
  }

  signUp(email: string, password: string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, email, password).then(() => undefined);
  }

  sendVerificationEmail(): Promise<void> {
    const actionCodeSettings: ActionCodeSettings = {
      url: window.location.origin + '/login',
    };
    return sendEmailVerification(this.auth.currentUser!, actionCodeSettings);
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }
}
