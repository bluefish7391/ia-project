export interface OrganizationUpsertPayload {
  name: string;
  description?: string;
  parentOrganizationID?: string;
}