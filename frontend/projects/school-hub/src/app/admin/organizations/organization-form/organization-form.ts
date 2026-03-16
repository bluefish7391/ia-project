import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  @Output() save = new EventEmitter<OrganizationUpsertPayload>();
  @Output() cancel = new EventEmitter<void>();

  protected organizationName = '';
  protected organizationDescription = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialName'] ||
      changes['initialDescription'] ||
      changes['mode']
    ) {
      this.organizationName = this.initialName;
      this.organizationDescription = this.initialDescription;
    }
  }

  protected submitOrganization(): void {
    this.save.emit({
      name: this.organizationName,
      description: this.organizationDescription,
    });
  }

  protected cancelEdit(): void {
    this.cancel.emit();
  }
}