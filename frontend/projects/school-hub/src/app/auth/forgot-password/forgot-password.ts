import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);
  protected readonly loading = signal(false);

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.error.set(null);
    this.loading.set(true);
    try {
      await sendPasswordResetEmail(this.auth, this.form.getRawValue().email);
      this.success.set(true);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      this.loading.set(false);
    }
  }
}
