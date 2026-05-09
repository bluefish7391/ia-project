import { GetStudentLunchCheckInAndOutHistoryRequest, GetStudentLunchCheckInAndOutHistoryResponse, LunchCheckRecord, QueryStudentLunchCheckRequest, QueryStudentLunchCheckResponse, SaveStudentLunchCheckConfigRequest, SaveStudentLunchCheckConfigResponse, SaveStudentLunchCheckRequest, SaveStudentLunchCheckResponse, StudentLunchCheck, StudentLunchCheckCompositeRecord } from "../../../shared/kinds";
import { lunchCheckDAO, studentDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { BadRequestError } from "../kinds";
import { RequestContext } from "../request-context";

export class LunchCheckManager {
	async getAllStudents(requestContext: RequestContext, filterOptions: QueryStudentLunchCheckRequest): Promise<QueryStudentLunchCheckResponse> {
		const tenantID = requestContext.getCurrentTenantID();
		// Validate lunchDate format
		if (filterOptions.lunchDate && !this.isValidISODateString(filterOptions.lunchDate)) {
			throw new Error("Invalid lunchDate format. Expected ISO date string.");
		}

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

		let lunchCheckRecords: LunchCheckRecord[] = [];
		if (filterOptions.lunchDate) {
			lunchCheckRecords = await lunchCheckDAO.getLunchCheckRecordsByDate(tenantID, filterOptions.lunchDate);
		} else {
			lunchCheckRecords = await lunchCheckDAO.getLunchCheckRecords(tenantID);
		}
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

	async saveStudentLunchCheck(requestContext: RequestContext, data: SaveStudentLunchCheckRequest): Promise<SaveStudentLunchCheckResponse> {
		const tenantID = requestContext.getCurrentTenantID();
		// Validate lunchDate format
		if (!this.isValidISODateString(data.lunchDate)) {
			throw new BadRequestError("Invalid lunchDate format. Expected ISO date string.");
		}

		const student = await studentDAO.getStudent(tenantID, data.studentID);
		if (!student) {
			throw new BadRequestError("No student with that id.");
		}

		const lunchCheckRecords: LunchCheckRecord[] = await lunchCheckDAO.getLunchCheckRecordsByStudentByDate(tenantID, student.id, data.lunchDate);
		lunchCheckRecords.sort((a, b) => {
			// Sort by createdDate ascending
			return a.createdDate.getTime() - b.createdDate.getTime();
		});

		let candidateLunchCheckRecordToSave: LunchCheckRecord;
		if (lunchCheckRecords.length == 0) {
			candidateLunchCheckRecordToSave = this.createNewLunchCheckRecord(tenantID, student.id, data.lunchDate, data.checkingIn);
		} else {
			// Most recent record is the last one in the sorted list
			candidateLunchCheckRecordToSave = lunchCheckRecords[lunchCheckRecords.length - 1];
			if (data.checkingIn) {
				if (candidateLunchCheckRecordToSave.checkInTime) {
					// If trying to check in but already have a check in time, create a new record
					candidateLunchCheckRecordToSave = this.createNewLunchCheckRecord(tenantID, student.id, data.lunchDate, data.checkingIn);
				} else {
					// If checking in and no check in time, set check in time to now
					candidateLunchCheckRecordToSave.checkInTime = new Date();
				}
			} else {
				if (candidateLunchCheckRecordToSave.checkOutTime) {
					// If trying to check out but already have a check out time, create a new record
					candidateLunchCheckRecordToSave = this.createNewLunchCheckRecord(tenantID, student.id, data.lunchDate, data.checkingIn);
				} else {
					// If checking out and no check out time, set check out time to now
					candidateLunchCheckRecordToSave.checkOutTime = new Date();
				}
			}
		}

		const record = await lunchCheckDAO.saveLunchCheckRecord(candidateLunchCheckRecordToSave);
		return { lunchCheckRecord: record } satisfies SaveStudentLunchCheckResponse;
	}

	private createNewLunchCheckRecord(tenantID: string, studentID: string, lunchDate: string, checkingIn: boolean): LunchCheckRecord {
		return {
			id: generateId(),
			tenantID: tenantID,
			studentID: studentID,
			lunchDate: lunchDate,
			checkInTime: checkingIn ? new Date() : undefined,
			checkOutTime: !checkingIn ? new Date() : undefined,
			createdDate: new Date(),
		};
	}

	async getStudentLunchCheckInAndOutHistory(requestContext: RequestContext, data: GetStudentLunchCheckInAndOutHistoryRequest): Promise<GetStudentLunchCheckInAndOutHistoryResponse> {
		const tenantID = requestContext.getCurrentTenantID();
		// Validate startDate and endDate format
		if (data.startDate && !this.isValidISODateString(data.startDate)) {
			throw new BadRequestError("Invalid startDate format. Expected ISO date string.");
		}
		if (data.endDate && !this.isValidISODateString(data.endDate)) {
			throw new BadRequestError("Invalid endDate format. Expected ISO date string.");
		}

		const student = await studentDAO.getStudent(tenantID, data.studentID);
		console.log("getStudentLunchCheckInAndOutHistory: tenantID=", tenantID, "studentID=", data.studentID, "student=", student);
		if (!student) {
			throw new BadRequestError("No student with that id.");
		}

		let lunchCheckRecords: LunchCheckRecord[] = await lunchCheckDAO.getLunchCheckRecordsByStudent(tenantID, student.id);
		if (data.startDate) {
			lunchCheckRecords = lunchCheckRecords.filter(record => record.lunchDate >= data.startDate!);
		}
		if (data.endDate) {
			lunchCheckRecords = lunchCheckRecords.filter(record => record.lunchDate <= data.endDate!);
		}

		const pageNumber = data.pageNumber && data.pageNumber > 0 ? data.pageNumber : 0;
		const pageSize = data.pageSize && data.pageSize > 0 ? Math.min(data.pageSize, 100) : 10;
		let startIndex = pageNumber * pageSize;
		let endIndex = startIndex + pageSize;
		let realPageNumberReturned = pageNumber;

		if (startIndex >= lunchCheckRecords.length) {
			startIndex = lunchCheckRecords.length - (lunchCheckRecords.length % pageSize);
			realPageNumberReturned = Math.floor(startIndex / pageSize);
		}

		if (endIndex > lunchCheckRecords.length) {
			endIndex = lunchCheckRecords.length;
		}

		lunchCheckRecords = lunchCheckRecords.slice(startIndex, endIndex);

		return { records: lunchCheckRecords, totalRecords: lunchCheckRecords.length, pageNumber: realPageNumberReturned, pageSize } satisfies GetStudentLunchCheckInAndOutHistoryResponse;
	}

	private isValidISODateString(dateString: string): boolean {
		const date = new Date(dateString);
		return !isNaN(date.getTime()) && date.toISOString().split("T")[0] === dateString;
	}

	async saveStudentLunchCheckConfig(requestContext: RequestContext, data: SaveStudentLunchCheckConfigRequest): Promise<SaveStudentLunchCheckConfigResponse> {
		const tenantID = requestContext.getCurrentTenantID();

		const student = await studentDAO.getStudent(tenantID, data.studentID);
		if (!student) {
			throw new BadRequestError("No student with that id.");
		}

		const studentLunchCheck: StudentLunchCheck = {
			studentID: data.studentID,
			tenantID,
			contractSigned: data.contractSigned,
			note: data.note,
		};

		const saved = await lunchCheckDAO.saveStudentLunchCheckConfig(studentLunchCheck);
		return { studentLunchCheck: saved } satisfies SaveStudentLunchCheckConfigResponse;
	}
}