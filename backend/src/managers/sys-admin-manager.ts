import { RequestContext } from "../request-context";

export class SysAdminManager {
	async deleteUser(requestContext: RequestContext, email: string): Promise<boolean> {
		return true; // Placehoder, needs to interact with Google Identity Platform to delete the user.
	}
}