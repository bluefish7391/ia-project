import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SaveStudentLunchCheckConfigRequest, Student, StudentLunchCheckCompositeRecord } from 'shared/kinds';
import { firstValueFrom } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LunchCheckService } from '../lunch-check.service';
import { MessageService } from '../message-service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DialogData {
	student: StudentLunchCheckCompositeRecord;
}

export interface StudentDetailsDialogueResult {
	contractSigned: boolean;
	student: Student;
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
		MatTabsModule,
		MatProgressSpinnerModule,
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
	protected readonly currentStudent = signal<Student>({ ...this.data.student.student });
	protected readonly completeHistory = signal<ClockEvent[]>([]);
	protected headerText: string = '';

	protected readonly selectedTabIndex = signal(0);

	// ─── Edit tab signals ────────────────────────────────────────────────────
	protected readonly editSchoolStudentID = signal(this.data.student.student.schoolStudentID);
	protected readonly editFirstName = signal(this.data.student.student.firstName);
	protected readonly editLastName = signal(this.data.student.student.lastName);
	protected readonly editContractCompleted = signal(false);
	protected readonly isSaving = signal(false);
	protected readonly editErrorMessage = signal<string | null>(null);

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

		const initialContractSigned = this.data.student.studentLunchCheck?.contractSigned ?? false;
		this.contractCompleted.set(initialContractSigned);
		this.editContractCompleted.set(initialContractSigned);

		this.dialogRef.backdropClick().subscribe(() => {
			this.dialogRef.close(this.buildResult());
		});
		this.dialogRef.keydownEvents().subscribe((e) => {
			if (e.key === 'Escape') this.dialogRef.close(this.buildResult());
		});
	}

	private buildResult(): StudentDetailsDialogueResult {
		return { contractSigned: this.contractCompleted(), student: this.currentStudent() };
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

	public static open(dialog: MatDialog, data: DialogData): Promise<StudentDetailsDialogueResult | undefined> {
		const dialogRef = dialog.open(StudentDetailsDialogue, {
			data: data,
			autoFocus: false,
			width: '640px',
			minHeight: '520px',
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

	protected async onSaveDetails(): Promise<void> {
		const schoolStudentID = this.editSchoolStudentID().trim();
		const firstName = this.editFirstName().trim();
		const lastName = this.editLastName().trim();

		if (!schoolStudentID || !firstName || !lastName) {
			this.editErrorMessage.set('Student ID, first name, and last name are all required.');
			return;
		}

		this.editErrorMessage.set(null);
		this.isSaving.set(true);

		try {
			const updatedStudent = await firstValueFrom(
				this.lunchCheckService.updateStudent(this.data.student.student.id, { schoolStudentID, firstName, lastName })
			);
			await firstValueFrom(
				this.lunchCheckService.saveStudentLunchCheckConfig({
					studentID: this.data.student.student.id,
					contractSigned: this.editContractCompleted()
				} satisfies SaveStudentLunchCheckConfigRequest)
			);
			this.contractCompleted.set(this.editContractCompleted());
			this.currentStudent.set(updatedStudent);
			this.headerText = `Viewing lunch check details for ${updatedStudent.firstName} ${updatedStudent.lastName}`;
			this.matSnackBar.open('Changes saved successfully.', 'Close', { duration: 3000 });
		} catch {
			this.editErrorMessage.set('An error occurred while saving. Please try again.');
		} finally {
			this.isSaving.set(false);
		}
	}

	protected close(): void {
		this.dialogRef.close(this.buildResult());
	}
}
