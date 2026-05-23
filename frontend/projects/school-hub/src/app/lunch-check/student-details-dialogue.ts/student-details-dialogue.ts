import { Component, computed, effect, inject, model, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
	MAT_DIALOG_DATA,
	MatDialog,
	MatDialogActions,
	MatDialogContent,
	MatDialogRef,
	MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SaveStudentLunchCheckConfigRequest, StudentLunchCheckCompositeRecord } from 'shared/kinds';
import { firstValueFrom } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmDialogueComponent } from '../confirm-dialogue/confirm-dialogue';
import { LunchCheckService } from '../lunch-check.service';
import { MessageService } from '../message-service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DialogData {
	student: StudentLunchCheckCompositeRecord;
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
	private readonly matSnackBar = inject(MatSnackBar);
	private readonly dialog = inject(MatDialog);
	private readonly messageService = inject(MessageService);
	private readonly lunchCheckService = inject(LunchCheckService);
	readonly dialogRef = inject(MatDialogRef<StudentDetailsDialogue>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	protected readonly contractCompleted = signal(false);
	protected readonly completeHistory = signal<ClockEvent[]>([]);
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

		this.contractCompleted.set(this.data.student.studentLunchCheck?.contractSigned ?? false);
		console.log("data: ", this.data);

		this.dialogRef.backdropClick().subscribe(() => {
			this.dialogRef.close(this.contractCompleted());
		});
		this.dialogRef.keydownEvents().subscribe((e) => {
			if (e.key === 'Escape') this.dialogRef.close(this.contractCompleted());
		});
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

	public static open(dialog: MatDialog, data: DialogData): Promise<boolean | undefined> {
		const dialogRef = dialog.open(StudentDetailsDialogue, {
			data: data,
			autoFocus: false
		});
		return firstValueFrom(dialogRef.afterClosed());
	}

	protected resetDateFilter(): void {
		this.range.reset();
	}

	onPageChange(event: PageEvent) {
		this.currentPage.set(event.pageIndex);
		this.pageSize.set(event.pageSize);
	}

	protected async onDisplayContractStatusChange(newValue: boolean): Promise<void> {
		await ConfirmDialogueComponent.open(this.dialog, {
			message: `Are you sure you want to set the contract status to ${newValue ? 'signed' : 'unsigned'}?`
		}).then((result) => {
			if (result && result.userChoice) {
				this.lunchCheckService.saveStudentLunchCheckConfig({
					studentID: this.data.student.student.id,
					contractSigned: newValue
				} satisfies SaveStudentLunchCheckConfigRequest).subscribe({
					next: () => {
						this.matSnackBar.open('Changes saved successfully.', 'Close', { duration: 3000 });
						this.contractCompleted.set(newValue);
					},
					error: () => {
						this.matSnackBar.open('An error occurred while saving the student lunch check configuration. Please try again.', 'Close', { duration: 3000 });
						this.contractCompleted.set(!newValue);
					}
				});
			} else {
				this.contractCompleted.set(!newValue);
			}
		});
	}

	protected close(): void {
		this.dialogRef.close(this.contractCompleted());
	}
}
