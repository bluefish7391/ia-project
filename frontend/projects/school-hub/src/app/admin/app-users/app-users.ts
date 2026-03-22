import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../api.service';
import { AppUserForm } from './app-user-form/app-user-form';
import { AppUserList } from './app-user-list/app-user-list';
import { AppUserUpsertPayload } from './app-user.model';
import { AppUser } from '../../../../../../../shared/kinds';

@Component({
  selector: 'app-app-users',
  imports: [AppUserForm, AppUserList],
  templateUrl: './app-users.html',
  styleUrl: './app-users.scss',
})
export class AppUsers implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly appUsers = signal<AppUser[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly formMode = signal<'add' | 'edit' | null>(null);
  protected readonly editingAppUserId = signal<string | null>(null);
  protected readonly formEmail = signal('');

  ngOnInit(): void {
    this.loadAppUsers();
  }

  protected loadAppUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .get<AppUser[]>('app-users')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appUsers) => {
          this.appUsers.set(appUsers);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load app users. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  protected addAppUser(): void {
    this.formMode.set('add');
    this.editingAppUserId.set(null);
    this.formEmail.set('');
    this.actionMessage.set(null);
  }

  protected updateAppUser(appUser: AppUser): void {
    this.formMode.set('edit');
    this.editingAppUserId.set(appUser.id);
    this.formEmail.set(appUser.email);
    this.actionMessage.set(null);
  }

  protected deleteAppUser(appUser: AppUser): void {
    const shouldDelete = confirm(`Delete app user "${appUser.email}"?`);
    if (!shouldDelete) {
      return;
    }

    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .delete<void>(`app-users/${appUser.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.appUsers.update((existing) =>
            existing.filter((current) => current.id !== appUser.id),
          );
          this.isSubmitting.set(false);
          this.actionMessage.set(`Deleted ${appUser.email}.`);
          if (this.editingAppUserId() === appUser.id) {
            this.cancelAppUserForm();
          }
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to delete app user. Please try again.');
        },
      });
  }

  protected saveAppUser(formValue: AppUserUpsertPayload): void {
    const email = formValue.email.trim();
    if (!email) {
      this.actionMessage.set('Email is required.');
      return;
    }

    const payload: AppUserUpsertPayload = { email };

    const mode = this.formMode();
    if (mode === 'add') {
      this.createAppUser(payload);
      return;
    }

    if (mode === 'edit') {
      const appUserId = this.editingAppUserId();
      if (!appUserId) {
        this.actionMessage.set('Unable to update app user. Missing app user id.');
        return;
      }
      this.editAppUser(appUserId, payload);
    }
  }

  protected cancelAppUserForm(): void {
    this.formMode.set(null);
    this.editingAppUserId.set(null);
    this.formEmail.set('');
  }

  private createAppUser(payload: AppUserUpsertPayload): void {
    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .post<AppUser>('app-users', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appUser) => {
          this.appUsers.update((existing) => [...existing, appUser]);
          this.isSubmitting.set(false);
          this.cancelAppUserForm();
          this.actionMessage.set(`Added ${appUser.email}.`);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to add app user. Please try again.');
        },
      });
  }

  private editAppUser(appUserId: string, payload: AppUserUpsertPayload): void {
    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .put<AppUser>(`app-users/${appUserId}`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appUser) => {
          this.appUsers.update((existing) =>
            existing.map((current) =>
              current.id === appUser.id ? appUser : current,
            ),
          );
          this.isSubmitting.set(false);
          this.cancelAppUserForm();
          this.actionMessage.set(`Updated ${appUser.email}.`);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to update app user. Please try again.');
        },
      });
  }
}
