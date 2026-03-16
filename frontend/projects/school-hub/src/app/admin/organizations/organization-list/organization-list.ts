import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Organization } from '../../../../../../../../shared/kinds';

@Component({
  selector: 'app-organization-list',
  imports: [],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.scss',
})
export class OrganizationList {
  @Input() organizations: Organization[] = [];
  @Input() isSubmitting = false;

  @Output() update = new EventEmitter<Organization>();
  @Output() delete = new EventEmitter<Organization>();

  protected requestUpdate(organization: Organization): void {
    this.update.emit(organization);
  }

  protected requestDelete(organization: Organization): void {
    this.delete.emit(organization);
  }
}