import { Component, computed, inject } from '@angular/core';
import { StudentIdReaderComponent } from '../student-id-reader/student-id-reader';
import { MatDialog } from '@angular/material/dialog';
import { LunchCheckService } from '../lunch-check.service';
import { GetStudentLunchCheckInAndOutHistoryRequest, GetStudentLunchCheckInAndOutHistoryResponse, LunchCheckRecord, QueryStudentLunchCheckRequest, QueryStudentLunchCheckResponse, StudentLunchCheckCompositeRecord } from 'shared/kinds';
import { CreateStudentDialogueComponent } from '../create-student-dialogue/create-student-dialogue';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageService } from '../message-service';
import { StudentActivityWarningDialogue } from '../student-activity-warning-dialogue/student-activity-warning-dialogue';
import { Router } from '@angular/router';

@Component({
	selector: 'app-lunch-check-home',
	imports: [],
	templateUrl: './lunch-check-home.html',
	styleUrl: './lunch-check-home.scss',
})
export class LunchCheckHomeComponent {
	readonly dialog = inject(MatDialog);
	private readonly lunchCheckService = inject(LunchCheckService);
	private readonly messageService = inject(MessageService);
	private _snackBar = inject(MatSnackBar);
	private readonly router = inject(Router);

	async clockStudentInOrOut(mode: 'clock-in' | 'clock-out') {
		const result = await StudentIdReaderComponent.open(this.dialog, { mode: mode });
		console.log('The dialog was closed (awaited)');
		if (!result) {
			return;
		}

		console.log(`Dialog result (awaited): ${result.schoolStudentID}`);
		const filters: QueryStudentLunchCheckRequest = {
			schoolStudentID: result.schoolStudentID,
			lunchDate: new Date().toISOString().split('T')[0]
		};

		this.lunchCheckService.searchStudents(filters).subscribe({
			next: async response => {
				await this.handleSearchResult(response, result.schoolStudentID, mode);
			},
			error: () => {
				this.messageService.error('An error occurred while searching for the student. Please try again.');
			}
		});
	}

	private async handleSearchResult(response: QueryStudentLunchCheckResponse, schoolStudentID: string, mode: 'clock-in' | 'clock-out') {
		if (response.records.length > 1) {
			this.messageService.error('Multiple students found with the provided ID. Please contact support.');
			return;
		}

		let studentID: string;
		if (response.records.length == 0) {
			const choice = await this.messageService.confirm(`No students found with the provided ID. Do you want to create a new student record with that ID and ${mode === 'clock-in' ? 'clock them in' : 'clock them out'}?`);
			if (!choice) {
				return;
			}

			const student = await CreateStudentDialogueComponent.open(this.dialog, { schoolStudentID: schoolStudentID });
			if (!student) {
				return;
			}

			studentID = student.id;
			await this.clockStudent(studentID, mode);
		} else {
			// Only one record found, proceed with clocking in/out
			console.log('Student record:', response.records[0]);

			if (this.ifIsOddCase(mode, response.records[0])) {
				await StudentActivityWarningDialogue.open(this.dialog, {
					mode: mode,
					student: response.records[0]
				});
				return;
			}

			const record = response.records[0];
			studentID = record.student.id;
			await this.clockStudent(studentID, mode);
		}
	}

	private ifIsOddCase(mode: string, record: StudentLunchCheckCompositeRecord): boolean {
		const status = this.getClockStatus(record.lunchCheckRecords);
		return (mode === 'clock-in' && status === 'clocked-in') || (mode === 'clock-out' && status !== 'clocked-in');
	}

	private async clockStudent(studentID: string, mode: 'clock-in' | 'clock-out') {
		this.lunchCheckService
			.clockStudent(studentID, new Date().toISOString().split('T')[0], mode === 'clock-in')
			.subscribe({
				next: () => {
					this._snackBar.open(`Student ${mode === 'clock-in' ? 'clocked in' : 'clocked out'} successfully`, 'Close', { duration: 3000 });
				},
				error: () => {
					this.messageService.error(`An error occurred while ${mode === 'clock-in' ? 'clocking in' : 'clocking out'} the student. Please try again.`);
				},
			});
	}

	private getClockStatus(records: LunchCheckRecord[]): string {
		if (records.length === 0) return 'not-clocked-in';
		const sorted = [...records].sort(
			(a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
		);
		const latest = sorted[sorted.length - 1];
		if (latest.checkInTime && !latest.checkOutTime) return 'clocked-in';
		if (latest.checkInTime && latest.checkOutTime) return 'clocked-out';
		return 'not-clocked-in';
	}
	
	protected async report() {
		await this.router.navigate(['/lunch-check/report']);
	}
}
