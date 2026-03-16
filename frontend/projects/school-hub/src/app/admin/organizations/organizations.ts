import { Component, signal } from '@angular/core';

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
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly formMode = signal<'add' | 'edit' | null>(null);
  protected readonly editingOrganizationId = signal<string | null>(null);
  protected readonly formName = signal('');
  protected readonly formDescription = signal('');

  protected loadOrganizations(): void {}

  protected addOrganization(): void {}

  protected updateOrganization(_organization: Organization): void {}

  protected deleteOrganization(_organization: Organization): void {}

  protected saveOrganization(_formValue: OrganizationUpsertPayload): void {}

  protected cancelOrganizationForm(): void {}
}