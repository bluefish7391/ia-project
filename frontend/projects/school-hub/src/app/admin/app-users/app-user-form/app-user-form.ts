import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRole, Organization } from '../../../../../../../../shared/kinds';
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
  @Input() initialRoleIDs: string[] = [];
  @Input() organizations: Organization[] = [];
  @Input() appRoles: AppRole[] = [];

  @Output() save = new EventEmitter<AppUserUpsertPayload>();
  @Output() cancel = new EventEmitter<void>();

  protected appUserEmail = '';
  protected organizationId = '';
  protected roleIDs: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialEmail'] || changes['mode']) {
      this.appUserEmail = this.initialEmail;
    }
    if (changes['initialOrganizationId'] || changes['mode']) {
      this.organizationId = this.initialOrganizationId;
    }
    if (changes['initialRoleIDs'] || changes['mode']) {
      this.roleIDs = this.initialRoleIDs;
    }
  }

  protected isRoleSelected(roleId: string): boolean {
    return this.roleIDs.includes(roleId);
  }

  protected toggleRole(roleId: string): void {
    if (this.isRoleSelected(roleId)) {
      this.roleIDs = this.roleIDs.filter((id) => id !== roleId);
    } else {
      this.roleIDs = [...this.roleIDs, roleId];
    }
  }

  protected submitAppUser(): void {
    this.save.emit({ email: this.appUserEmail, organizationID: this.organizationId, roleIDs: this.roleIDs });
  }

  protected cancelEdit(): void {
    this.cancel.emit();
  }
}
