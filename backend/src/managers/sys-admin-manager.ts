import { getAuth } from "firebase-admin/auth";
import { RequestContext } from "../request-context";

export class SysAdminManager {
	async deleteUser(requestContext: RequestContext, email: string): Promise<string | null> {
		let userRecord;
		try {
			userRecord = await getAuth().getUserByEmail(email);
		} catch {
			return `No user found with email "${email}".`;
		}

		await getAuth().deleteUser(userRecord.uid);
		return null;
	}
}