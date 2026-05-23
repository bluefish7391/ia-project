import { GetStudentLunchCheckInAndOutHistoryRequest, GetStudentLunchCheckInAndOutHistoryResponse, LunchCheckRecord, QueryStudentLunchCheckRequest, QueryStudentLunchCheckResponse, QueryStudentLunchCheckWithContractsResponse, SaveStudentLunchCheckConfigRequest, SaveStudentLunchCheckConfigResponse, SaveStudentLunchCheckRequest, SaveStudentLunchCheckResponse, Student, StudentLunchCheck, StudentLunchCheckCompositeRecord } from "../../../shared/kinds";
import { lunchCheckDAO, studentDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { BadRequestError } from "../kinds";
import { RequestContext } from "../request-context";

export class LunchCheckManager {
	static readonly CHUNK_SIZE = 300;

	async getAllStudents(requestContext: RequestContext, filter: QueryStudentLunchCheckRequest): Promise<QueryStudentLunchCheckResponse> {
		const tenantID = requestContext.getCurrentTenantID();
		// Validate lunchDate format
		if (
			filter.startDate && !this.isValidISODateString(filter.startDate) ||
			filter.endDate && !this.isValidISODateString(filter.endDate)
		) {
			throw new Error("Invalid date format. Expected ISO date string.");
		}

		let students = await this.getStudentsMatchingSearchCriteria(tenantID, filter);

		const pageNumber = filter.pageNumber && filter.pageNumber > 0 ? filter.pageNumber : 0;
		const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
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

		let lunchCheckRecords: LunchCheckRecord[] = await lunchCheckDAO.getLunchCheckRecords(tenantID);
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

	private async getStudentsMatchingSearchCriteria(tenantID: string, filter: QueryStudentLunchCheckRequest): Promise<Student[]> {
		// Get all students for the tenant and then filter based on search criteria
		let studentsMatchingSearchCriteria = await studentDAO.getAllStudents(tenantID);
		if (filter.schoolStudentID)
			studentsMatchingSearchCriteria = studentsMatchingSearchCriteria.filter(student => student.schoolStudentID.indexOf(filter.schoolStudentID!) != -1);
		if (filter.firstName)
			studentsMatchingSearchCriteria = studentsMatchingSearchCriteria.filter(student => student.firstName.indexOf(filter.firstName!) != -1);
		if (filter.lastName)
			studentsMatchingSearchCriteria = studentsMatchingSearchCriteria.filter(student => student.lastName.indexOf(filter.lastName!) != -1);

		const startDate = filter.startDate ? new Date(filter.startDate) : null;
		const endDate = filter.endDate ? new Date(filter.endDate) : null;
		const dateFilterResults = await Promise.all(studentsMatchingSearchCriteria.map(async student => {
			if (!startDate && !endDate) return true;

			const lunchCheckRecordsForStudent = await lunchCheckDAO.getLunchCheckRecordsByStudent(tenantID, student.id);
			return lunchCheckRecordsForStudent.some(record => {
				const lunchDate = new Date(record.lunchDate);
				return (!startDate || lunchDate >= startDate) && (!endDate || lunchDate <= endDate);
			});
		}));
		studentsMatchingSearchCriteria = studentsMatchingSearchCriteria.filter((_, i) => dateFilterResults[i]);

		return studentsMatchingSearchCriteria;
	}

	public async getStudentsWithLunchContracts(requestContext: RequestContext, filter: QueryStudentLunchCheckRequest): Promise<QueryStudentLunchCheckWithContractsResponse> {
		const tenantID = requestContext.getCurrentTenantID();
		const students = await this.getStudentsMatchingSearchCriteria2(tenantID, filter);
		const lunchChecks = await lunchCheckDAO.getStudentLunchChecksForStudents(tenantID);

		const response = {
			rows: students.map(student => {
				const lunchCheck = lunchChecks.find(check => check.studentID === student.id);
				return {
					student,
					contractSigned: lunchCheck ? lunchCheck.contractSigned : false,
				};
			})
		} satisfies QueryStudentLunchCheckWithContractsResponse;

		return response;
	}

	private async getStudentsMatchingSearchCriteria2(tenantID: string, filter: QueryStudentLunchCheckRequest): Promise<Student[]> {
		let studentObjects: Student[] = [];

		const startDate = filter.startDate ? filter.startDate : null;
		if (startDate) {
			const studentIDsSet = new Set<string>();
			const endDate = filter.endDate ? filter.endDate : null;
			let nextCursor: string | undefined;
			do {
				const { records, nextCursor: newCursor } = 
					await lunchCheckDAO.getLunchCheckRecordsOnOrAfterDate(
						tenantID, startDate, LunchCheckManager.CHUNK_SIZE, nextCursor
					);

				if (endDate) {
					records.forEach(record => {
						if (record.lunchDate <= endDate) {
							studentIDsSet.add(record.studentID);
						}
					});
				} else {
					records.forEach(record => {
						studentIDsSet.add(record.studentID);
					});
				}

				nextCursor = newCursor;
			} while (nextCursor);

			const studentIDs = Array.from(studentIDsSet);
			for (let i = 0; i < studentIDs.length; i += LunchCheckManager.CHUNK_SIZE) {
				const chunk = studentIDs.slice(i, i + LunchCheckManager.CHUNK_SIZE);
				studentObjects = studentObjects.concat(await studentDAO.getStudentsByIDs(chunk));
			}
		} else {
			// If no date filter, get all students for the tenant
			studentObjects = await studentDAO.getAllStudents(tenantID);
		}

		const result = studentObjects.filter(student => {
			if (filter.schoolStudentID && student.schoolStudentID.indexOf(filter.schoolStudentID) == -1) {
				return false;
			}
			if (filter.firstName && student.firstName.indexOf(filter.firstName) == -1) {
				return false;
			}
			if (filter.lastName && student.lastName.indexOf(filter.lastName) == -1) {
				return false;
			}
			return true;
		});

		console.log("getStudentsMatchingSearchCriteria2: tenantID=", tenantID, "filter=", filter, "result length=", result.length);

		return result;
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