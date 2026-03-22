
export class RequestContext {
	getCurrentTenantID() {
		return 'tenant-123';
	}

	constructor (readonly req?: any) {}
}