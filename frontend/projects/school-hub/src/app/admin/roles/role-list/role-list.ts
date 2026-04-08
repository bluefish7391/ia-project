import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AppRole } from '../../../../../../../../shared/kinds';

@Component({
  selector: 'app-role-list',
  templateUrl: './role-list.html',
  styleUrl: './role-list.scss',
})
export class RoleList {
  @Input() roles: AppRole[] = [];
  @Input() isSubmitting = false;

  @Output() update = new EventEmitter<AppRole>();
  @Output() delete = new EventEmitter<AppRole>();
}
