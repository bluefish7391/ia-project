import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TenantUpsertPayload } from '../tenant.model';

@Component({
  selector: 'app-tenant-form',
  imports: [FormsModule],
  templateUrl: './tenant-form.html',
  styleUrl: './tenant-form.scss',
})
export class TenantForm implements OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() isSubmitting = false;
  @Input() initialName = '';
  @Input() initialDescription = '';

  @Output() save = new EventEmitter<TenantUpsertPayload>();
  @Output() cancel = new EventEmitter<void>();

  protected tenantName = '';
  protected tenantDescription = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialName'] ||
      changes['initialDescription'] ||
      changes['mode']
    ) {
      this.tenantName = this.initialName;
      this.tenantDescription = this.initialDescription;
    }
  }

  protected submitTenant(): void {
    this.save.emit({
      name: this.tenantName,
      description: this.tenantDescription,
    });
  }

  protected cancelEdit(): void {
    this.cancel.emit();
  }
}
