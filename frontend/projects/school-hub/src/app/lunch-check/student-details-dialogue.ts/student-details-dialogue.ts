import { Component, computed, effect, inject, model, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { toSignal } from '@angular/core/rxjs-interop';

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
	selector: 'student-details-dialogue',
	providers: [provideNativeDateAdapter()],
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
		MatDatepickerModule,
		ReactiveFormsModule,
	],
	templateUrl: './student-details-dialogue.html',
	styleUrl: './student-details-dialogue.scss',
})
export class StudentDetailsDialogue {
	protected readonly contractCompleted = signal(false);
	readonly dialogRef = inject(MatDialogRef<StudentDetailsDialogue>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	protected completeHistory = signal<ClockEvent[]>([]);
	protected headerText: string = '';

	protected readonly range = new FormGroup({
		start: new FormControl<Date | null>(new Date()),
		end: new FormControl<Date | null>(new Date()),
	});
	protected readonly rangeValue = toSignal(this.range.valueChanges, {
		initialValue: { start: new Date(), end: new Date() }
	});

	protected readonly filteredHistory = computed(() => {
		const { start, end } = this.rangeValue();
		console.log(`start: ${start}, end: ${end}`);
		if (!start) return this.completeHistory();

		const startTime = new Date(start).getTime();

		if (end) {
			const endTime = new Date(end).getTime();
			return this.completeHistory().filter((event) => {
				const t = event.time.getTime();
				return t >= startTime && t <= endTime;
			});
		}

		return this.completeHistory().filter((event) => {
			const t = event.time.getTime();
			return t >= startTime;
		});
	});

	protected readonly pageSize = signal(5);
	protected readonly currentPage = signal(0);
	protected readonly pageSizeOptions = [5, 10, 25, 50];

	protected readonly totalItems = computed(() => this.filteredHistory().length);
	protected readonly displayHistory = computed(() => {
		const page = this.currentPage();
		const size = this.pageSize();
		return this.filteredHistory().slice(page * size, (page + 1) * size);
	});

	constructor() {
		effect(() => {
			this.rangeValue();
			this.currentPage.set(0);
		});

		this.headerText = `Viewing lunch check details for ${this.data.student.student.firstName} ${this.data.student.student.lastName}`;
		this.setupCompleteHistory();
	}

	private setupCompleteHistory(): void {
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
	}

	public static open(dialog: MatDialog, data: DialogData): Promise<DialogueResult | undefined> {
		const dialogRef = dialog.open(StudentDetailsDialogue, {
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

	protected resetDateFilter(): void {
		this.range.reset();
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
	}
}
