import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AppUser } from '../../../../../../../../shared/kinds';

@Component({
  selector: 'app-app-user-list',
  imports: [],
  templateUrl: './app-user-list.html',
  styleUrl: './app-user-list.scss',
})
export class AppUserList {
  @Input() appUsers: AppUser[] = [];
  @Input() isSubmitting = false;

  @Output() update = new EventEmitter<AppUser>();
  @Output() delete = new EventEmitter<AppUser>();

  protected requestUpdate(appUser: AppUser): void {
    this.update.emit(appUser);
  }

  protected requestDelete(appUser: AppUser): void {
    this.delete.emit(appUser);
  }
}
