import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../api.service';
import { AppUserForm } from './app-user-form/app-user-form';
import { AppUserList } from './app-user-list/app-user-list';
import { AppRole, AppUser, AppUserDetail, Organization, AppUserUpsertPayload } from 'shared/kinds';

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
  protected readonly appRoles = signal<AppRole[]>([]);
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly formMode = signal<'add' | 'edit' | null>(null);
  protected readonly editingAppUserId = signal<string | null>(null);
  protected readonly formEmail = signal('');
  protected readonly formOrganizationId = signal('');
  protected readonly formRoleIDs = signal<string[]>([]);

  ngOnInit(): void {
    this.loadAppUsers();
    this.loadOrganizations();
	this.loadAppRoles();
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

  private loadAppRoles(): void {
	this.apiService
		.get<AppRole[]>('app-roles')
		.pipe(takeUntilDestroyed(this.destroyRef))
		.subscribe({
			next: (appRoles) => {
				this.appRoles.set(appRoles);
			},
			error: () => {
				// app roles list is non-critical for page load; silently fail
			},
		});
  }

  private loadOrganizations(): void {
    this.apiService
      .get<Organization[]>('organizations')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (organizations) => {
          this.organizations.set(organizations);
        },
        error: () => {
          // organizations list is non-critical for page load; silently fail
        },
      });
  }

  protected addAppUser(): void {
    this.formMode.set('add');
    this.editingAppUserId.set(null);
    this.formEmail.set('');
    this.formOrganizationId.set('');
    this.formRoleIDs.set([]);
    this.actionMessage.set(null);
  }

  protected updateAppUser(appUser: AppUser): void {
	this.apiService
		.get<AppUserDetail>(`app-users/${appUser.id}`)
		.pipe(takeUntilDestroyed(this.destroyRef))
		.subscribe({
			next: (appUserDetail) => {
				const { roleIDs, ...appUserFields } = appUserDetail;

				// Refresh the list entry with any updated fields from the fetch
				this.appUsers.update((existing) => 
					existing.map((u) => u.id === appUser.id ? { ...u, ...appUserFields } : u)
				);

				this.formMode.set('edit');
				this.editingAppUserId.set(appUserFields.id);
				this.formEmail.set(appUserFields.email);
				this.formOrganizationId.set(appUserFields.organizationID);
				this.formRoleIDs.set(roleIDs);
				this.actionMessage.set(null);
			},
			error: () => {
				this.actionMessage.set('Unable to load app user details. Please try again.');
			}
		});	
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

    const organizationID = formValue.organizationID;
    if (!organizationID) {
      this.actionMessage.set('Organization is required.');
      return;
    }

    const payload: AppUserUpsertPayload = { email, organizationID, roleIDs: formValue.roleIDs };

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
    this.formOrganizationId.set('');
    this.formRoleIDs.set([]);
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
