import { Component, inject, model, signal, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
	student: StudentLunchCheckCompositeRecord;
}

export interface DialogueResult {
	contractCompleted: boolean;
}

interface ClockEvent {
	type: 'in' | 'out';
	time: Date;
	label: string;
}

function formatTimeWithDate(d: Date): string {
	return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

@Component({
	selector: 'student-activity-info-dialogue',
	imports: [
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatSlideToggleModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatDialogClose,
		MatIconModule,
	],
	templateUrl: './student-activity-info-dialogue.html',
	styleUrl: './student-activity-info-dialogue.scss',
})
export class StudentActivityInfoDialogue {
	protected readonly contractCompleted = signal(false);
	readonly dialogRef = inject(MatDialogRef<StudentActivityInfoDialogue>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	protected todayHistory: ClockEvent[] = [];
	protected headerText: string = '';

	constructor() {
		console.log('Initializing StudentActivityInfoDialogue with data:', this.data);
		this.headerText = `Viewing Records for ${this.data.student.student.firstName} ${this.data.student.student.lastName}`;

		for (const r of this.data.student.lunchCheckRecords) {
			if (r.checkInTime) {
				const t = new Date(r.checkInTime);
				this.todayHistory.push({ type: 'in', time: t, label: formatTimeWithDate(t) });
			}
			if (r.checkOutTime) {
				const t = new Date(r.checkOutTime);
				this.todayHistory.push({ type: 'out', time: t, label: formatTimeWithDate(t) });
			}
		}
		this.todayHistory.sort((a: ClockEvent, b: ClockEvent) => b.time.getTime() - a.time.getTime());
		console.log('Processed today history:', this.todayHistory);
	}

	static open(dialog: MatDialog, data: DialogData): Promise<DialogueResult | undefined> {
		const dialogRef = dialog.open(StudentActivityInfoDialogue, {
			data: data,
		});

		return dialogRef.afterClosed().toPromise();
	}

	protected close(): void {
		const result: DialogueResult = { contractCompleted: this.contractCompleted() };
		this.dialogRef.close(result);
	}
}
