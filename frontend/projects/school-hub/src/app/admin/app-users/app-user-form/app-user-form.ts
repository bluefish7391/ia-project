import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Organization } from '../../../../../../../../shared/kinds';
import { AppUserUpsertPayload } from '../app-user.model';

@Component({
  selector: 'app-app-user-form',
  imports: [FormsModule],
  templateUrl: './app-user-form.html',
  styleUrl: './app-user-form.scss',
})
export class AppUserForm implements OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() isSubmitting = false;
  @Input() initialEmail = '';
  @Input() initialOrganizationId = '';
  @Input() organizations: Organization[] = [];

  @Output() save = new EventEmitter<AppUserUpsertPayload>();
  @Output() cancel = new EventEmitter<void>();

  protected appUserEmail = '';
  protected organizationId = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialEmail'] || changes['mode']) {
      this.appUserEmail = this.initialEmail;
    }
    if (changes['initialOrganizationId'] || changes['mode']) {
      this.organizationId = this.initialOrganizationId;
    }
  }

  protected submitAppUser(): void {
    this.save.emit({ email: this.appUserEmail, organizationID: this.organizationId });
  }

  protected cancelEdit(): void {
    this.cancel.emit();
  }
}
