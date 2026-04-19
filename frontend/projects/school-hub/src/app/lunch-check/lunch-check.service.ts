import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  QueryStudentLunchCheckRequest,
  QueryStudentLunchCheckResponse,
  SaveStudentLunchCheckConfigRequest,
  SaveStudentLunchCheckConfigResponse,
  SaveStudentLunchCheckRequest,
  SaveStudentLunchCheckResponse,
  Student,
} from '../../../../../../shared/kinds';
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

  saveStudentLunchCheckConfig(data: SaveStudentLunchCheckConfigRequest): Observable<SaveStudentLunchCheckConfigResponse> {
    return this.api.post<SaveStudentLunchCheckConfigResponse>('lunch-check/student-lunch-check', data);
  }
}
