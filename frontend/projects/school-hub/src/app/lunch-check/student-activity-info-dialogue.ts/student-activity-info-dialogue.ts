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
	isSaving: boolean;
	contractCompleted?: boolean;
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
		MatIconModule,
	],
	templateUrl: './student-activity-info-dialogue.html',
	styleUrl: './student-activity-info-dialogue.scss',
})
export class StudentActivityInfoDialogue {
	protected readonly contractCompleted = signal(false);
	readonly dialogRef = inject(MatDialogRef<StudentActivityInfoDialogue>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	protected completeHistory: ClockEvent[] = [];
	protected displayHistory: ClockEvent[] = [];
	protected headerText: string = '';
	protected readonly targetDate = signal('');

	constructor() {
		console.log('Initializing StudentActivityInfoDialogue with data:', this.data);
		this.headerText = `Viewing Records for ${this.data.student.student.firstName} ${this.data.student.student.lastName}`;

		for (const r of this.data.student.lunchCheckRecords) {
			if (r.checkInTime) {
				const t = new Date(r.checkInTime);
				this.completeHistory.push({ type: 'in', time: t, label: formatTimeWithDate(t) });
			}
			if (r.checkOutTime) {
				const t = new Date(r.checkOutTime);
				this.completeHistory.push({ type: 'out', time: t, label: formatTimeWithDate(t) });
			}
		}
		this.completeHistory.sort((a: ClockEvent, b: ClockEvent) => b.time.getTime() - a.time.getTime());
		this.displayHistory = [...this.completeHistory];
		console.log('Processed today history:', this.completeHistory);
	}

	static open(dialog: MatDialog, data: DialogData): Promise<DialogueResult | undefined> {
		const dialogRef = dialog.open(StudentActivityInfoDialogue, {
			data: data,
		});

		return dialogRef.afterClosed().toPromise();
	}

	protected close(): void {
		const result: DialogueResult = { 
			isSaving: false,
		};
		this.dialogRef.close(result);
	}

	protected setDate(): void {
		const filterValue = this.targetDate();
		console.log('Setting date filter with value:', filterValue);

		if (!filterValue) {
			this.displayHistory = [...this.completeHistory];
			return;
		}

		const selectedDate = this.convertDateFromDashToSlashFormat(filterValue);
		console.log('Setting date to:', selectedDate);

		this.displayHistory = this.completeHistory.filter((event) => {
			const eventDate = new Date(event.time).toLocaleDateString('en-US');
			console.log(`Comparing event date ${eventDate} with selected date ${selectedDate}`);
			return eventDate === selectedDate;
		});
	}

	protected resetDateFilter(): void {
		this.targetDate.set('');
		this.displayHistory = [...this.completeHistory];
	}

	private convertDateFromDashToSlashFormat(dashDate: string): string {
		const [year, month, day] = dashDate.split('-').map(Number);
		const slashDate = new Date(year, month - 1, day);

		return slashDate.toLocaleDateString('en-US');
	}

	protected save(): void {
		const result: DialogueResult = {
			isSaving: true,
			contractCompleted: this.contractCompleted(),
		};
		this.dialogRef.close(result);
	}

	protected hasChanges(): boolean {
		return this.contractCompleted() !== this.data.student.studentLunchCheck?.contractSigned;
	}
}
