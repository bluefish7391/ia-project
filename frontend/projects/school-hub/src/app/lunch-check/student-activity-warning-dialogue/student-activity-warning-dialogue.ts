import { Component, inject, model, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import {
	MAT_DIALOG_DATA,
	MatDialog,
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogRef,
	MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StudentLunchCheckCompositeRecord } from 'shared/kinds';

export interface DialogData {
	mode: 'clock-in' | 'clock-out';
	student: StudentLunchCheckCompositeRecord;
}

export interface DialogueResult {
	userChoice: boolean;
}

interface ClockEvent {
	type: 'in' | 'out';
	time: Date;
	label: string;
}

interface DialogConfig {
	headerText: string;
	alertText: string;
	closeButtonText: string;
	proceedButtonText: string;
}

function formatTimeWithoutDate(d: Date): string {
	return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

@Component({
	selector: 'student-activity-warning-dialogue',
	imports: [
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatDialogClose,
		MatIconModule,
	],
	templateUrl: './student-activity-warning-dialogue.html',
	styleUrl: './student-activity-warning-dialogue.scss',
})
export class StudentActivityWarningDialogue {
	readonly dialogRef = inject(MatDialogRef<StudentActivityWarningDialogue>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	protected readonly mode;
	protected todayHistory: ClockEvent[] = [];

	constructor() {
		console.log('Initializing StudentActivityWarningDialogue with data:', this.data);
		this.mode = this.data.mode;

		for (const r of this.data.student.lunchCheckRecords) {
			if (r.checkInTime) {
				const t = new Date(r.checkInTime);
				this.todayHistory.push({ type: 'in', time: t, label: formatTimeWithoutDate(t) });
			}
			if (r.checkOutTime) {
				const t = new Date(r.checkOutTime);
				this.todayHistory.push({ type: 'out', time: t, label: formatTimeWithoutDate(t) });
			}
		}
		this.todayHistory.sort((a: ClockEvent, b: ClockEvent) => b.time.getTime() - a.time.getTime());
		console.log('Processed today history:', this.todayHistory);
	}

	static open(dialog: MatDialog, data: DialogData): Promise<DialogueResult | undefined> {
		const dialogRef = dialog.open(StudentActivityWarningDialogue, {
			data: data,
		});

		return dialogRef.afterClosed().toPromise();
	}

	protected proceed() {
		
	}
}
