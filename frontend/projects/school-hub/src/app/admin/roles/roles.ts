import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppRole, AppPermission } from 'shared/kinds';
import { ApiService } from '../../api.service';
import { AppRoleUpsertPayload } from './role.model';
import { RoleForm } from './role-form/role-form';
import { RoleList } from './role-list/role-list';

@Component({
  selector: 'app-roles',
  imports: [RoleForm, RoleList],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class Roles implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly roles = signal<AppRole[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly formMode = signal<'add' | 'edit' | null>(null);
  protected readonly editingRoleId = signal<string | null>(null);
  protected readonly formName = signal('');
  protected readonly formDescription = signal('');
  protected readonly formAppPermissions = signal<AppPermission[]>([]);

  ngOnInit(): void {
    this.loadRoles();
  }

  protected loadRoles(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .get<AppRole[]>('app-roles')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roles) => {
          this.roles.set(roles);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load roles. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  protected addRole(): void {
    this.formMode.set('add');
    this.editingRoleId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formAppPermissions.set([]);
    this.actionMessage.set(null);
  }

  protected updateRole(role: AppRole): void {
    this.formMode.set('edit');
    this.editingRoleId.set(role.id);
    this.formName.set(role.name);
    this.formDescription.set(role.description);
    this.formAppPermissions.set(role.appPermissions);
    this.actionMessage.set(null);
  }

  protected deleteRole(role: AppRole): void {
    const shouldDelete = confirm(`Delete role "${role.name}"?`);
    if (!shouldDelete) {
      return;
    }

    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .delete<void>(`app-roles/${role.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.roles.update((existing) =>
            existing.filter((current) => current.id !== role.id),
          );
          this.isSubmitting.set(false);
          this.actionMessage.set(`Deleted "${role.name}".`);
          if (this.editingRoleId() === role.id) {
            this.cancelRoleForm();
          }
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to delete role. Please try again.');
        },
      });
  }

  protected saveRole(formValue: AppRoleUpsertPayload): void {
    const name = formValue.name.trim();
    if (!name) {
      this.actionMessage.set('Role name is required.');
      return;
    }

    const mode = this.formMode();
    if (mode === 'add') {
      this.createRole({ ...formValue, name });
      return;
    }

    if (mode === 'edit') {
      const roleId = this.editingRoleId();
      if (!roleId) {
        this.actionMessage.set('Unable to update role. Missing role ID.');
        return;
      }
      this.editRole(roleId, { ...formValue, name });
    }
  }

  protected cancelRoleForm(): void {
    this.formMode.set(null);
    this.editingRoleId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formAppPermissions.set([]);
  }

  private createRole(payload: AppRoleUpsertPayload): void {
    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .post<AppRole>('app-roles', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (role) => {
          this.roles.update((existing) => [...existing, role]);
          this.isSubmitting.set(false);
          this.cancelRoleForm();
          this.actionMessage.set(`Added "${role.name}".`);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to add role. Please try again.');
        },
      });
  }

  private editRole(roleId: string, payload: AppRoleUpsertPayload): void {
    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .put<AppRole>(`app-roles/${roleId}`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (role) => {
          this.roles.update((existing) =>
            existing.map((current) =>
              current.id === role.id ? role : current,
            ),
          );
          this.isSubmitting.set(false);
          this.cancelRoleForm();
          this.actionMessage.set(`Updated "${role.name}".`);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to update role. Please try again.');
        },
      });
  }
}
