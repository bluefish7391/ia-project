import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiService } from '../../api.service';
import { Organization } from '../../../../../../../shared/kinds';
import { OrganizationUpsertPayload } from './organization.model';
import { OrganizationForm } from './organization-form/organization-form';
import { OrganizationList } from './organization-list/organization-list';

@Component({
  selector: 'app-organizations',
  imports: [OrganizationForm, OrganizationList],
  templateUrl: './organizations.html',
  styleUrl: './organizations.scss',
})
export class Organizations {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly organizations = signal<Organization[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly formMode = signal<'add' | 'edit' | null>(null);
  protected readonly editingOrganizationId = signal<string | null>(null);
  protected readonly formName = signal('');
  protected readonly formDescription = signal('');
  protected readonly formParentOrganizationID = signal<string | null>(null);

  protected readonly availableParents = computed(() => {
    const editingId = this.editingOrganizationId();
    return this.organizations().filter((org) => org.id !== editingId);
  });

  ngOnInit(): void {
    this.loadOrganizations();
  }

  protected loadOrganizations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .get<Organization[]>('organizations')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (organizations) => {
          this.organizations.set(organizations);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load organizations. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  protected addOrganization(): void {
    this.formMode.set('add');
    this.editingOrganizationId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formParentOrganizationID.set(null);
    this.actionMessage.set(null);
  }

  protected addSubOrganization(parentId: string): void {
    this.formMode.set('add');
    this.editingOrganizationId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formParentOrganizationID.set(parentId);
    this.actionMessage.set(null);
  }

  protected updateOrganization(organization: Organization): void {
    this.formMode.set('edit');
    this.editingOrganizationId.set(organization.id);
    this.formName.set(organization.name);
    this.formDescription.set(organization.description ?? '');
    this.formParentOrganizationID.set(organization.parentOrganizationID ?? null);
    this.actionMessage.set(null);
  }

  protected deleteOrganization(organization: Organization): void {
    const shouldDelete = confirm(`Delete organization "${organization.name}"?`);
    if (!shouldDelete) {
      return;
    }

    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .delete<void>(`organizations/${organization.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.organizations.update((existing) =>
            existing.filter((current) => current.id !== organization.id),
          );
          this.isSubmitting.set(false);
          this.actionMessage.set(`Deleted ${organization.name}.`);
          if (this.editingOrganizationId() === organization.id) {
            this.cancelOrganizationForm();
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          if (err?.status === 409) {
            this.actionMessage.set(
              'Cannot delete an organization that has sub-organizations.',
            );
          } else {
            this.actionMessage.set('Unable to delete organization. Please try again.');
          }
        },
      });
  }

  protected saveOrganization(formValue: OrganizationUpsertPayload): void {
    const name = formValue.name.trim();
    const description = (formValue.description ?? '').trim();
    if (!name) {
      this.actionMessage.set('Organization name is required.');
      return;
    }

    const payload: OrganizationUpsertPayload = { name };
    if (description.length > 0) {
      payload.description = description;
    }

    const mode = this.formMode();
    if (mode === 'add') {
      this.createOrganization(payload);
      return;
    }

    if (mode === 'edit') {
      const organizationId = this.editingOrganizationId();
      if (!organizationId) {
        this.actionMessage.set('Unable to update organization. Missing organization id.');
        return;
      }
      this.editOrganization(organizationId, payload);
    }
  }

  protected cancelOrganizationForm(): void {
    this.formMode.set(null);
    this.editingOrganizationId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formParentOrganizationID.set(null);
  }

  private createOrganization(payload: OrganizationUpsertPayload): void {
    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    const parentId = this.formParentOrganizationID();
    if (parentId) {
      payload.parentOrganizationID = parentId;
    }

    this.apiService
      .post<Organization>('organizations', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (organization) => {
          this.organizations.update((existing) => [...existing, organization]);
          this.isSubmitting.set(false);
          this.cancelOrganizationForm();
          this.actionMessage.set(`Added ${organization.name}.`);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to add organization. Please try again.');
        },
      });
  }

  private editOrganization(
    organizationId: string,
    payload: OrganizationUpsertPayload,
  ): void {
    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.apiService
      .put<Organization>(`organizations/${organizationId}`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (organization) => {
          this.organizations.update((existing) =>
            existing.map((current) =>
              current.id === organization.id ? organization : current,
            ),
          );
          this.isSubmitting.set(false);
          this.cancelOrganizationForm();
          this.actionMessage.set(`Updated ${organization.name}.`);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Unable to update organization. Please try again.');
        },
      });
  }
}