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
import {MatIconModule} from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StudentLunchCheckCompositeRecord } from 'shared/kinds';

export interface DialogData {
	mode: 'clock-in' | 'clock-out' | 'view-records';
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

function formatTime(d: Date): string {
	return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

@Component({
	selector: 'student-activity-dialogue',
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
	templateUrl: './student-activity-dialogue.html',
	styleUrl: './student-activity-dialogue.scss',
})
export class StudentActivityDialogue {
	readonly dialogRef = inject(MatDialogRef<StudentActivityDialogue>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	protected readonly mode;
	protected readonly headerText: string;
	protected readonly alertText: string;
	protected readonly closeButtonText: string;
	protected readonly proceedButtonText: string;
	protected todayHistory: ClockEvent[] = [];

	constructor() {
		console.log('Initializing StudentActivityDialogue with data:', this.data);
		this.mode = this.data.mode;
		switch (this.mode) {
			case 'clock-in':
				this.headerText = 'Warning';
				this.alertText = 'This student is already clocked in. Do you want to continue?';
				this.closeButtonText = 'Cancel';
				this.proceedButtonText = 'Continue clock in';
				break;
			case 'clock-out':
				this.headerText = 'Warning';
				this.alertText = 'This student is already clocked out. Do you want to continue?';
				this.closeButtonText = 'Cancel';
				this.proceedButtonText = 'Continue clock out';
				break;
			case 'view-records':
				this.headerText = `Viewing Records for ${this.data.student.student.firstName} ${this.data.student.student.lastName}`;
				this.alertText = '';
				this.closeButtonText = 'Close';
				this.proceedButtonText = '';
				break;
		}
		for (const r of this.data.student.lunchCheckRecords) {
			if (r.checkInTime) {
				const t = new Date(r.checkInTime);
				this.todayHistory.push({ type: 'in', time: t, label: formatTime(t) });
			}
			if (r.checkOutTime) {
				const t = new Date(r.checkOutTime);
				this.todayHistory.push({ type: 'out', time: t, label: formatTime(t) });
			}
		}
		this.todayHistory.sort((a: ClockEvent, b: ClockEvent) => b.time.getTime() - a.time.getTime());
		console.log('Processed today history:', this.todayHistory);
	}

	static open(dialog: MatDialog, data: DialogData): Promise<DialogueResult | undefined> {
		const dialogRef = dialog.open(StudentActivityDialogue, {
			data: data,
		});

		return dialogRef.afterClosed().toPromise();
	}

	protected proceed() {

	}
}
