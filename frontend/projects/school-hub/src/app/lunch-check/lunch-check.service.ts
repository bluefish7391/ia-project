import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
	GetStudentLunchCheckInAndOutHistoryRequest,
	GetStudentLunchCheckInAndOutHistoryResponse,
	QueryStudentLunchCheckRequest,
	QueryStudentLunchCheckResponse,
	QueryStudentLunchCheckWithContractsResponse,
	SaveStudentLunchCheckConfigRequest,
	SaveStudentLunchCheckConfigResponse,
	SaveStudentLunchCheckRequest,
	SaveStudentLunchCheckResponse,
	Student,
} from 'shared/kinds';
import { ApiService } from '../api.service';

@Injectable({ providedIn: 'root' })
export class LunchCheckService {
	private readonly api = inject(ApiService);

	searchStudents(filters: QueryStudentLunchCheckRequest): Observable<QueryStudentLunchCheckResponse> {
		return this.api.post<QueryStudentLunchCheckResponse>('lunch-check/student-lunch-check-records', filters);
	}

	clockStudent(studentID: string, lunchDate: string, checkingIn: boolean): Observable<SaveStudentLunchCheckResponse> {
		const body: SaveStudentLunchCheckRequest = { studentID, lunchDate, checkingIn };
		return this.api.put<SaveStudentLunchCheckResponse>('lunch-check/student-lunch-check-record', body);
	}

	createStudent(data: { schoolStudentID: string; firstName: string; lastName: string }): Observable<Student> {
		return this.api.post<Student>('students', data);
	}

	updateStudent(id: string, data: { schoolStudentID: string; firstName: string; lastName: string }): Observable<Student> {
		return this.api.put<Student>(`students/${id}`, data);
	}

	saveStudentLunchCheckConfig(data: SaveStudentLunchCheckConfigRequest): Observable<SaveStudentLunchCheckConfigResponse> {
		return this.api.post<SaveStudentLunchCheckConfigResponse>('lunch-check/student-lunch-check', data);
	}

	getStudentLunchCheckInAndOutHistory(request: GetStudentLunchCheckInAndOutHistoryRequest): Observable<GetStudentLunchCheckInAndOutHistoryResponse> {
		return this.api.post<GetStudentLunchCheckInAndOutHistoryResponse>('lunch-check/student-lunch-check-in-and-out-history', request);
	}

	getStudentsWithLunchContracts(filters: QueryStudentLunchCheckRequest): Observable<QueryStudentLunchCheckWithContractsResponse> {
		return this.api.post<QueryStudentLunchCheckWithContractsResponse>('lunch-check/students-with-lunch-contracts', filters);
	}
}
