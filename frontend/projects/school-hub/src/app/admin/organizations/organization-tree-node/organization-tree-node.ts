import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Organization } from '../../../../../../../../shared/kinds';
import { OrganizationTreeNode as OrganizationTreeNodeComponent } from './organization-tree-node';

export interface OrgTreeNode {
  organization: Organization;
  children: OrgTreeNode[];
}

@Component({
  selector: 'app-organization-tree-node',
  imports: [OrganizationTreeNodeComponent],
  templateUrl: './organization-tree-node.html',
  styleUrl: './organization-tree-node.scss',
})
export class OrganizationTreeNode {
  @Input() node!: OrgTreeNode;
  @Input() isSubmitting = false;
  @Input() depth = 0;

  @Output() update = new EventEmitter<Organization>();
  @Output() delete = new EventEmitter<Organization>();
  @Output() addSubOrg = new EventEmitter<string>();

  get hasChildren(): boolean {
    return this.node.children.length > 0;
  }

  get childDepth(): number {
    return this.depth + 1;
  }

  protected requestUpdate(): void {
    this.update.emit(this.node.organization);
  }

  protected requestDelete(): void {
    this.delete.emit(this.node.organization);
  }

  protected requestAddSubOrg(): void {
    this.addSubOrg.emit(this.node.organization.id);
  }

  protected bubbleUpdate(organization: Organization): void {
    this.update.emit(organization);
  }

  protected bubbleDelete(organization: Organization): void {
    this.delete.emit(organization);
  }

  protected bubbleAddSubOrg(parentId: string): void {
    this.addSubOrg.emit(parentId);
  }
}
