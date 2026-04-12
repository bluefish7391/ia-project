import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly showResendVerification = signal(false);
  protected readonly resendLoading = signal(false);
  protected readonly resendSent = signal(false);

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.error.set(null);
    this.showResendVerification.set(false);
    this.resendSent.set(false);
    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      const user = await this.authService.signIn(email, password);

      if (!user.emailVerified) {
        this.error.set('Your email address has not been verified. Please check your inbox for the verification link.');
        this.showResendVerification.set(true);
        return;
      }

      await this.router.navigate(['/select-tenant']);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async resendVerificationEmail(): Promise<void> {
    this.error.set(null);
    this.resendLoading.set(true);
    try {
      await this.authService.sendVerificationEmail();
      await this.authService.signOut();
      this.showResendVerification.set(false);
      this.resendSent.set(true);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Failed to send verification email.');
    } finally {
      this.resendLoading.set(false);
    }
  }
}
