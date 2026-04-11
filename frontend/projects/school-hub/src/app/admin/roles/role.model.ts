import { AppPermission } from 'shared/kinds';

export interface AppRoleUpsertPayload {
  name: string;
  description: string;
  appPermissions: AppPermission[];
}
