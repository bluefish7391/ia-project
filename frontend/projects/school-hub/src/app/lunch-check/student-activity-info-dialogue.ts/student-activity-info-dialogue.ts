import { Component, computed, inject, model, signal, viewChild } from '@angular/core';
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

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
		MatPaginatorModule,
	],
	templateUrl: './student-activity-info-dialogue.html',
	styleUrl: './student-activity-info-dialogue.scss',
})
export class StudentActivityInfoDialogue {
	protected readonly contractCompleted = signal(false);
	readonly dialogRef = inject(MatDialogRef<StudentActivityInfoDialogue>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	protected completeHistory = signal<ClockEvent[]>([]);
	protected displayHistory = signal<ClockEvent[]>([]);
	protected headerText: string = '';
	protected readonly startDate = signal('');
	protected readonly endDate = signal('');
	protected readonly totalItems = computed(() => this.completeHistory().length);
	protected readonly pageSize = signal(5);
	protected readonly currentPage = signal(0);
	protected readonly pageSizeOptions = [5, 10, 25, 50];

	constructor() {
		console.log('Initializing StudentActivityInfoDialogue with data:', this.data);
		this.headerText = `Viewing Records for ${this.data.student.student.firstName} ${this.data.student.student.lastName}`;

		for (const r of this.data.student.lunchCheckRecords) {
			if (r.checkInTime) {
				const t = new Date(r.checkInTime);
				this.completeHistory.update((history) => [...history, { type: 'in', time: t, label: formatTimeWithDate(t) }]);
			}
			if (r.checkOutTime) {
				const t = new Date(r.checkOutTime);
				this.completeHistory.update((history) => [...history, { type: 'out', time: t, label: formatTimeWithDate(t) }]);
			}
		}

		this.completeHistory.update((history) => history.sort((a: ClockEvent, b: ClockEvent) => b.time.getTime() - a.time.getTime()));
		this.updateVisibleItems();
		console.log('Processed today history:', this.completeHistory());
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
		const startDateValue = this.startDate();
		const endDateValue = this.endDate();
		console.log(`Setting date filter with values: ${startDateValue}, ${endDateValue}`);

		if (!startDateValue) {
			this.displayHistory.set([...this.completeHistory()]);
			return;
		}

		if (!endDateValue) {
			const selectedDate = this.convertDateFromDashToSlashFormat(startDateValue);
			console.log('Setting date to:', selectedDate);

			this.displayHistory.set(this.completeHistory().filter((event) => {
				const eventDate = new Date(event.time).toLocaleDateString('en-US');
				console.log(`Comparing event date ${eventDate} with selected date ${selectedDate}`);
				return eventDate === selectedDate;
			}));
		} else {
			const start = new Date(startDateValue);
			const end = new Date(endDateValue);
			end.setHours(23, 59, 59, 999); // Include the entire end date

			this.displayHistory.set(this.completeHistory().filter((event) => {
				const eventTime = new Date(event.time).getTime();
				return eventTime >= start.getTime() && eventTime <= end.getTime();
			}));
		}
	}

	protected resetDateFilter(): void {
		this.startDate.set('');
		this.endDate.set('');
		this.displayHistory.set([...this.completeHistory()]);
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

	onPageChange(event: PageEvent) {
		this.currentPage.set(event.pageIndex);
		this.pageSize.set(event.pageSize);
		this.updateVisibleItems();
	}

	private updateVisibleItems() {
		const startIndex = this.currentPage() * this.pageSize();
		const endIndex = startIndex + this.pageSize();
		this.displayHistory.set(this.completeHistory().slice(startIndex, endIndex));
	}
}
