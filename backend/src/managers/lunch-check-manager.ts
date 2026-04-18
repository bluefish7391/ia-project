import { LunchCheckRecord, QueryStudentLunchCheckRequest, QueryStudentLunchCheckResponse, StudentLunchCheck, StudentLunchCheckCompositeRecord } from "../../../shared/kinds";
import { lunchCheckDAO, studentDAO } from "../daos/dao-factory";
import { RequestContext } from "../request-context";

export class LunchCheckManager {
	async getAllStudents(requestContext: RequestContext, filterOptions: QueryStudentLunchCheckRequest): Promise<QueryStudentLunchCheckResponse> {
		const tenantID = requestContext.getCurrentTenantID();
		// Validate lunchDate format
		if (isNaN(Date.parse(filterOptions.lunchDate))) {
			throw new Error("Invalid lunchDate format. Expected ISO date string.");
		}

		/**
		 * 	schoolStudentID?: string; // Refers to Student.schoolStudentID
			firstName?: string;
			lastName?: string;
			lunchDate: string; // ISO date string (e.g., "2024-01-01")
			page?: number;
			pageSize?: number;
		 */

		let students = await studentDAO.getAllStudents(tenantID);

		if (filterOptions.schoolStudentID) {
			students = students.filter(student => {
				return student.schoolStudentID.indexOf(filterOptions.schoolStudentID!) != -1;
			});
		}

		if (filterOptions.firstName) {
			students = students.filter(student => {
				return student.firstName.indexOf(filterOptions.firstName!) != -1;
			});
		}

		if (filterOptions.lastName) {
			students = students.filter(student => {
				return student.lastName.indexOf(filterOptions.lastName!) != -1;
			});
		}

		const pageNumber = filterOptions.pageNumber && filterOptions.pageNumber > 0 ? filterOptions.pageNumber : 0;
		const pageSize = filterOptions.pageSize && filterOptions.pageSize > 0 ? Math.min(filterOptions.pageSize, 100) : 10;
		let startIndex = pageNumber * pageSize;
		let endIndex = startIndex + pageSize;
		let realPageNumberReturned = pageNumber;

		if (startIndex >= students.length) {
			startIndex = students.length - (students.length % pageSize);
			realPageNumberReturned = Math.floor(startIndex / pageSize);	
		}

		if (endIndex > students.length) {
			endIndex = students.length;
		}

		students = students.slice(startIndex, endIndex);

		const lunchCheckRecords: LunchCheckRecord[] = await lunchCheckDAO.getLunchCheckRecordsByDate(tenantID, filterOptions.lunchDate);
		const studentLunchChecks: StudentLunchCheck[] = await lunchCheckDAO.getStudentLunchChecksForStudents(tenantID);

		const studentLunchCheckMap = new Map<string, StudentLunchCheck>();
		studentLunchChecks.forEach(check => {
			studentLunchCheckMap.set(check.studentID, check);
		});

		const lunchCheckRecordsMap = new Map<string, LunchCheckRecord[]>();
		lunchCheckRecords.forEach(record => {
			if (!lunchCheckRecordsMap.has(record.studentID)) {
				lunchCheckRecordsMap.set(record.studentID, []);
			}
			lunchCheckRecordsMap.get(record.studentID)!.push(record);
		});

		const records = students.map(student => {
			const studentLunchCheck = studentLunchCheckMap.get(student.id);
			const recordsForStudent = lunchCheckRecordsMap.get(student.id) || [];
			return { student, studentLunchCheck, lunchCheckRecords: recordsForStudent } satisfies StudentLunchCheckCompositeRecord;
		});
		return { records, totalRecords: students.length, pageNumber: realPageNumberReturned, pageSize } satisfies QueryStudentLunchCheckResponse;
	}
}