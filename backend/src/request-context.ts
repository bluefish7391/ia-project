
export class RequestContext {
	constructor (readonly req?: any) {}

	getCurrentTenantID() {
		return (this.req as any).appSession?.tenantID;
	}
}