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

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.error.set(null);
    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.signIn(email, password);
      await this.router.navigate(['/select-tenant']);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
