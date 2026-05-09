import { LunchCheckRecord, StudentLunchCheck } from "../../../shared/kinds";
import { datastore } from "./datastore-factory";

export class LunchCheckDAO {
	static readonly LUNCH_CHECK_RECORD_KIND = "LunchCheckRecord";
	static readonly STUDENT_LUNCH_CHECK_KIND = "StudentLunchCheck";

	async getLunchCheckRecordsByDate(tenantID: string, lunchDate: string): Promise<LunchCheckRecord[]> {
		const query = datastore.createQuery(LunchCheckDAO.LUNCH_CHECK_RECORD_KIND)
			.filter("tenantID", "=", tenantID)
			.filter("lunchDate", "=", lunchDate);
		const data = await query.run();
		return data[0] as LunchCheckRecord[];
	}

	async getLunchCheckRecords(tenantID: string): Promise<LunchCheckRecord[]> {
		const query = datastore.createQuery(LunchCheckDAO.LUNCH_CHECK_RECORD_KIND)
			.filter("tenantID", "=", tenantID);
		const data = await query.run();
		return data[0] as LunchCheckRecord[];
	}

	async getStudentLunchChecksForStudents(tenantID: string): Promise<StudentLunchCheck[]> {
		const query = datastore.createQuery(LunchCheckDAO.STUDENT_LUNCH_CHECK_KIND)
			.filter("tenantID", "=", tenantID);
		return query.run().then(data => data[0] as StudentLunchCheck[]);
	}

	async getLunchCheckRecordsByStudentByDate(tenantID: string, studentID: string, lunchDate: string): Promise<LunchCheckRecord[]> {
		const query = datastore.createQuery(LunchCheckDAO.LUNCH_CHECK_RECORD_KIND)
			.filter("tenantID", "=", tenantID)
			.filter("studentID", "=", studentID)
			.filter("lunchDate", "=", lunchDate);
		const data = await query.run();
		return data[0] as LunchCheckRecord[];
	}

	async saveLunchCheckRecord(lunchCheckRecord: LunchCheckRecord): Promise<LunchCheckRecord> {
		const key = datastore.key([LunchCheckDAO.LUNCH_CHECK_RECORD_KIND, lunchCheckRecord.id]);
		const entity = { key, data: lunchCheckRecord };
		await datastore.save(entity);
		return lunchCheckRecord;
	}

	async getLunchCheckRecordsByStudent(tenantID: string, studentID: string): Promise<LunchCheckRecord[]> {
		const query = datastore.createQuery(LunchCheckDAO.LUNCH_CHECK_RECORD_KIND)
			.filter("tenantID", "=", tenantID)
			.filter("studentID", "=", studentID);
		const data = await query.run();
		return data[0] as LunchCheckRecord[];
	}

	async saveStudentLunchCheckConfig(studentLunchCheck: StudentLunchCheck): Promise<StudentLunchCheck> {
		const key = datastore.key([LunchCheckDAO.STUDENT_LUNCH_CHECK_KIND, studentLunchCheck.studentID]);
		const entity = { key, data: studentLunchCheck };
		await datastore.save(entity);
		return studentLunchCheck;
	}
}