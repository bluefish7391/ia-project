import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Organization } from 'shared/kinds';
import { OrganizationUpsertPayload } from '../organization.model';

@Component({
  selector: 'app-organization-form',
  imports: [FormsModule],
  templateUrl: './organization-form.html',
  styleUrl: './organization-form.scss',
})
export class OrganizationForm implements OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() isSubmitting = false;
  @Input() initialName = '';
  @Input() initialDescription = '';
  @Input() initialParentOrganizationID: string | null = null;
  @Input() availableParents: Organization[] = [];

  @Output() save = new EventEmitter<OrganizationUpsertPayload>();
  @Output() cancel = new EventEmitter<void>();

  protected organizationName = '';
  protected organizationDescription = '';
  protected selectedParentId: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialName'] ||
      changes['initialDescription'] ||
      changes['initialParentOrganizationID'] ||
      changes['mode']
    ) {
      this.organizationName = this.initialName;
      this.organizationDescription = this.initialDescription;
      this.selectedParentId = this.initialParentOrganizationID ?? '';
    }
  }

  get parentOrganizationName(): string {
    if (!this.initialParentOrganizationID) return 'None (root organization)';
    return (
      this.availableParents.find((p) => p.id === this.initialParentOrganizationID)?.name ??
      'Unknown'
    );
  }

  protected submitOrganization(): void {
    const payload: OrganizationUpsertPayload = {
      name: this.organizationName,
      description: this.organizationDescription,
    };
    if (this.mode === 'add' && this.selectedParentId) {
      payload.parentOrganizationID = this.selectedParentId;
    }
    this.save.emit(payload);
  }

  protected cancelEdit(): void {
    this.cancel.emit();
  }
}