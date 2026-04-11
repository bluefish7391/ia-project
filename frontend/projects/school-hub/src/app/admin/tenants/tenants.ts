import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../api.service';
import { TenantForm } from './tenant-form/tenant-form';
import { TenantList } from './tenant-list/tenant-list';
import { TenantUpsertPayload } from './tenant.model';
import { Tenant } from 'shared/kinds';

@Component({
  selector: 'app-tenants',
  imports: [TenantForm, TenantList],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})
export class Tenants implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tenants = signal<Tenant[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly formMode = signal<'add' | 'edit' | null>(null);
  protected readonly editingTenantId = signal<string | null>(null);
  protected readonly formName = signal('');
  protected readonly formDescription = signal('');

  ngOnInit(): void {
    this.loadTenants();
  }

  protected loadTenants(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .get<Tenant[]>('tenants')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tenants) => {
          this.tenants.set(tenants);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load tenants. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  protected addTenant(): void {
    this.formMode.set('add');
    this.editingTenantId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.actionMessage.set(null);
  }

  protected updateTenant(tenant: Tenant): void {
    this.formMode.set('edit');
    this.editingTenantId.set(tenant.id);
    this.formName.set(tenant.name);
    this.formDescription.set(tenant.description ?? '');
    this.actionMessage.set(null);
  }

  protected deleteTenant(tenant: Tenant): void {
    const shouldDelete = confirm(`Delete tenant "${tenant.name}"?`);
    if (!shouldDelete) {
      return;
    }

    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .delete<void>(`tenants/${tenant.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.tenants.update((existing) =>
            existing.filter((current) => current.id !== tenant.id),
          );
          this.isSubmitting.set(false);
          this.actionMessage.set(`Deleted ${tenant.name}.`);
          if (this.editingTenantId() === tenant.id) {
            this.cancelTenantForm();
          }
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to delete tenant. Please try again.');
        },
      });
  }

  protected saveTenant(formValue: TenantUpsertPayload): void {
    const name = formValue.name.trim();
    const description = (formValue.description ?? '').trim();
    if (!name) {
      this.actionMessage.set('Tenant name is required.');
      return;
    }

    const payload: TenantUpsertPayload = { name };
    if (description.length > 0) {
      payload.description = description;
    }

    const mode = this.formMode();
    if (mode === 'add') {
      this.createTenant(payload);
      return;
    }

    if (mode === 'edit') {
      const tenantId = this.editingTenantId();
      if (!tenantId) {
        this.actionMessage.set('Unable to update tenant. Missing tenant id.');
        return;
      }
      this.editTenant(tenantId, payload);
    }
  }

  protected cancelTenantForm(): void {
    this.formMode.set(null);
    this.editingTenantId.set(null);
    this.formName.set('');
    this.formDescription.set('');
  }

  private createTenant(payload: TenantUpsertPayload): void {
    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .post<Tenant>('tenants', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tenant) => {
          this.tenants.update((existing) => [...existing, tenant]);
          this.isSubmitting.set(false);
          this.cancelTenantForm();
          this.actionMessage.set(`Added ${tenant.name}.`);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to add tenant. Please try again.');
        },
      });
  }

  private editTenant(
    tenantId: string,
    payload: TenantUpsertPayload,
  ): void {
    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .put<Tenant>(`tenants/${tenantId}`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tenant) => {
          this.tenants.update((existing) =>
            existing.map((current) =>
              current.id === tenant.id ? tenant : current,
            ),
          );
          this.isSubmitting.set(false);
          this.cancelTenantForm();
          this.actionMessage.set(`Updated ${tenant.name}.`);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to update tenant. Please try again.');
        },
      });
  }
}
