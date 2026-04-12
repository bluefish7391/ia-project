import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import {
  AppPermission,
  AppPermissions,
} from 'shared/kinds';
import { AppRoleUpsertPayload } from '../role.model';

@Component({
  selector: 'app-role-form',
  imports: [FormsModule, CdkDropList, CdkDrag],
  templateUrl: './role-form.html',
  styleUrl: './role-form.scss',
})
export class RoleForm implements OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() isSubmitting = false;
  @Input() initialName = '';
  @Input() initialDescription = '';
  @Input() initialAppPermissions: AppPermission[] = [];

  @Output() save = new EventEmitter<AppRoleUpsertPayload>();
  @Output() cancel = new EventEmitter<void>();

  protected roleName = '';
  protected roleDescription = '';
  protected availablePermissions: [string, AppPermission][] = [];
  protected selectedPermissions: [string, AppPermission][] = [];

  protected readonly allPermissions = Object.entries(AppPermissions) as [
    string,
    AppPermission,
  ][];

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialName'] ||
      changes['initialDescription'] ||
      changes['initialAppPermissions'] ||
      changes['mode']
    ) {
      this.roleName = this.initialName;
      this.roleDescription = this.initialDescription;
      const selectedNames = new Set(this.initialAppPermissions.map((p) => p.name));
      this.selectedPermissions = this.allPermissions.filter(([, p]) => selectedNames.has(p.name));
      this.availablePermissions = this.allPermissions.filter(([, p]) => !selectedNames.has(p.name));
    }
  }

  protected dropPermission(event: CdkDragDrop<[string, AppPermission][]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  protected submitRole(): void {
    const appPermissionNames = this.selectedPermissions.map(([name, ]) => name);

    this.save.emit({
      name: this.roleName,
      description: this.roleDescription,
      appPermissions: appPermissionNames,
    });
  }

  protected cancelEdit(): void {
    this.cancel.emit();
  }
}
