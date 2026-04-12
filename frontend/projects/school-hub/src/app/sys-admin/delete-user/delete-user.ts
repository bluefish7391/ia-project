import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../api.service';
import { GeneralAPIResponse } from 'shared/kinds';

@Component({
  selector: 'app-delete-user',
  imports: [FormsModule],
  templateUrl: './delete-user.html',
  styleUrl: './delete-user.scss',
})
export class DeleteUser {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected email = '';
  protected readonly isSubmitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected deleteUser(): void {
    const email = this.email.trim();
    if (!email) return;

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.apiService
      .delete<GeneralAPIResponse>(`sys-admin/users/${encodeURIComponent(email)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage.set(`User "${email}" was deleted successfully.`);
            this.email = '';
          } else {
            this.errorMessage.set(response.message || 'Failed to delete user. Please verify the email and try again.');
          }
          this.isSubmitting.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to delete user. Please verify the email and try again.');
          this.isSubmitting.set(false);
        },
      });
  }
}
