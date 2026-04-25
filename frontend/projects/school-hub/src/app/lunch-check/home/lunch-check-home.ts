import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentIdReaderComponent } from '../student-id-reader/student-id-reader';
import { MatDialog } from '@angular/material/dialog';
import { LunchCheckService } from '../lunch-check.service';
import { QueryStudentLunchCheckRequest } from 'shared/kinds';
import { ConfirmDialogueComponent } from '../confirm-dialogue/confirm-dialogue';
import { MessageDialogueComponent } from '../message-dialogue/message-dialogue';
import { CreateStudentDialogueComponent } from '../create-student-dialogue/create-student-dialogue';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
	selector: 'app-lunch-check-home',
	imports: [RouterLink],
	templateUrl: './lunch-check-home.html',
	styleUrl: './lunch-check-home.scss',
})
export class LunchCheckHomeComponent {
	readonly dialog = inject(MatDialog);
	private readonly lunchCheckService = inject(LunchCheckService);
	private _snackBar = inject(MatSnackBar);

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
				MessageDialogueComponent.open(this.dialog, { mode: 'error', message: 'An error occurred while searching for the student. Please try again.' });
			}
		});
	}

	private async handleSearchResult(response: any, schoolStudentID: string, mode: 'clock-in' | 'clock-out') {
		if (response.records.length > 1) {
			MessageDialogueComponent.open(this.dialog, { mode: 'error', message: 'Multiple students found with the provided ID. Please contact support.' });
			return;
		}

		let studentID: string;
		if (response.records.length == 0) {
			const choice = await ConfirmDialogueComponent.open(this.dialog, { message: `No students found with the provided ID. Do you want to create a new student record with that ID and ${mode === 'clock-in' ? 'clock them in' : 'clock them out'}?` });
			if (choice?.userChoice !== 'yes') {
				return;
			}

			const student = await CreateStudentDialogueComponent.open(this.dialog, { schoolStudentID: schoolStudentID });
			if (!student) {
				return;
			}

			studentID = student.id;
			await this.clockStudent(studentID, mode);
		} else {
			const record = response.records[0];
			studentID = record.student.id;
			await this.clockStudent(studentID, mode);
		}
	}

	private async clockStudent(studentID: string, mode: 'clock-in' | 'clock-out') {
		this.lunchCheckService
			.clockStudent(studentID, new Date().toISOString().split('T')[0], mode === 'clock-in')
			.subscribe({
				next: () => {
					this._snackBar.open(`Student ${mode === 'clock-in' ? 'clocked in' : 'clocked out'} successfully`, 'Close', { duration: 3000 });
				},
				error: () => {
					MessageDialogueComponent.open(this.dialog, { mode: 'error', message: `An error occurred while ${mode === 'clock-in' ? 'clocking in' : 'clocking out'} the student. Please try again.` });
				},
			});
	}
}
