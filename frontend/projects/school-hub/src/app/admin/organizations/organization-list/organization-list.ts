import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Organization } from '../../../../../../../../shared/kinds';
import {
  OrgTreeNode,
  OrganizationTreeNode,
} from '../organization-tree-node/organization-tree-node';

function buildTree(organizations: Organization[]): OrgTreeNode[] {
  const nodeMap = new Map<string, OrgTreeNode>();
  for (const org of organizations) {
    nodeMap.set(org.id, { organization: org, children: [] });
  }

  const roots: OrgTreeNode[] = [];
  for (const org of organizations) {
    const node = nodeMap.get(org.id)!;
    if (org.parentOrganizationID && nodeMap.has(org.parentOrganizationID)) {
      nodeMap.get(org.parentOrganizationID)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

@Component({
  selector: 'app-organization-list',
  imports: [OrganizationTreeNode],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.scss',
})
export class OrganizationList {
  @Input() organizations: Organization[] = [];
  @Input() isSubmitting = false;

  @Output() update = new EventEmitter<Organization>();
  @Output() delete = new EventEmitter<Organization>();
  @Output() addSubOrg = new EventEmitter<string>();

  get treeNodes(): OrgTreeNode[] {
    return buildTree(this.organizations);
  }
}