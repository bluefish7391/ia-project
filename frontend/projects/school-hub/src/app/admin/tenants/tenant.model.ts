export interface Tenant {
  id: string;
  name: string;
  description?: string;
}

export interface TenantUpsertPayload {
  name: string;
  description?: string;
}
