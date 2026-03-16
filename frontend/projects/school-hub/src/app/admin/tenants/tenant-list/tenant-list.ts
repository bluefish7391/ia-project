import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Tenant } from '../tenant.model';

@Component({
  selector: 'app-tenant-list',
  imports: [],
  templateUrl: './tenant-list.html',
  styleUrl: './tenant-list.scss',
})
export class TenantList {
  @Input() tenants: Tenant[] = [];
  @Input() isSubmitting = false;

  @Output() update = new EventEmitter<Tenant>();
  @Output() delete = new EventEmitter<Tenant>();

  protected requestUpdate(tenant: Tenant): void {
    this.update.emit(tenant);
  }

  protected requestDelete(tenant: Tenant): void {
    this.delete.emit(tenant);
  }
}
