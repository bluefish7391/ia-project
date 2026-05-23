import {
	Component,
	computed,
	effect,
	inject,
	signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { GetStudentLunchCheckInAndOutHistoryRequest, GetStudentLunchCheckInAndOutHistoryResponse, QueryStudentLunchCheckWithContractsResponse, StudentLunchCheckCompositeRecord, StudentWithContractStatus } from '../../../../../../../shared/kinds';
import { LunchCheckService } from '../lunch-check.service';
import { StudentListComponent } from '../student-list/student-list';
import { MatDialog } from '@angular/material/dialog';
import { MessageService } from '../message-service';
import { StudentDetailsDialogue, StudentDetailsDialogueResult } from '../student-details-dialogue.ts/student-details-dialogue';
import { MatIcon } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CreateStudentDialogueComponent } from '../create-student-dialogue/create-student-dialogue';

@Component({
	selector: 'app-details',
	providers: [provideNativeDateAdapter()],
	imports: [RouterLink, StudentListComponent, MatIcon, 
		MatDatepickerModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
	templateUrl: './details.html',
	styleUrl: './details.scss',
})
export class DetailsComponent {
	private readonly dialog = inject(MatDialog);
	private readonly messageService = inject(MessageService);
	private readonly lunchCheckService = inject(LunchCheckService);

	// ─── Date range filter ─────────────────────────────────────────────────────
	protected readonly longAgo = '2000-01-01';
	protected readonly today = new Date().toISOString().split('T')[0];
	protected readonly range = new FormGroup({
		start: new FormControl<Date | null>(new Date()),
		end: new FormControl<Date | null>(new Date()),
	});
	protected readonly rangeValue = toSignal(this.range.valueChanges, {
		initialValue: { start: new Date(), end: new Date() }
	});
	private readonly startDate = computed(() => {
		const start = this.rangeValue().start;
		if (!start) return '';
		return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
	});
	private readonly endDate = computed(() => {
		const end = this.rangeValue().end;
		if (!end) return '';
		return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
	});

	// ─── Search state ────────────────────────────────────────────────────────
	protected readonly searchSchoolStudentID = signal('');
	protected readonly searchFirstName = signal('');
	protected readonly searchLastName = signal('');
	protected readonly isSearching = signal(false);
	protected readonly searchError = signal<string | null>(null);

	// ─── Search pipeline ─────────────────────────────────────────────────────
	private readonly searchTrigger$ = new Subject<{
		schoolStudentID: string;
		firstName: string;
		lastName: string;
		startDate: string;
		endDate: string;
	}>();

	protected readonly results = signal<QueryStudentLunchCheckWithContractsResponse>({ rows: [] });
	protected readonly studentResults = computed(() => this.results().rows);

	protected readonly studentSelected = signal<StudentWithContractStatus | null>(null);

	constructor() {
		this.searchTrigger$.pipe(
			debounceTime(400),
			distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
			switchMap((filters) => {
				this.isSearching.set(true);
				this.searchError.set(null);
				return this.lunchCheckService.getStudentsWithLunchContracts(filters).pipe(
					catchError(() => {
						this.searchError.set('Failed to search students. Please try again.');
						return of({ rows: [] } satisfies QueryStudentLunchCheckWithContractsResponse);
					}),
				);
			}),
			takeUntilDestroyed(),
		).subscribe((response) => this.results.set(response));

		// Watch search signals and push to subject
		effect(() => {
			this.searchTrigger$.next({
				schoolStudentID: this.searchSchoolStudentID(),
				firstName: this.searchFirstName(),
				lastName: this.searchLastName(),
				startDate: this.startDate(),
				endDate: this.endDate(),
			});
		});

		// Clear isSearching once results update
		effect(() => {
			this.results();
			this.isSearching.set(false);
		});
	}

	protected async addStudent(): Promise<void> {
		await CreateStudentDialogueComponent.open(this.dialog, { schoolStudentID: '' });
	}

	// ─── Handlers ────────────────────────────────────────────────────────────
	protected async onSelectStudent(studentWithContractStatus: StudentWithContractStatus): Promise<void> {
		this.studentSelected.set(studentWithContractStatus);
		
		const request: GetStudentLunchCheckInAndOutHistoryRequest = {
			studentID: studentWithContractStatus.student.id,
			startDate: this.longAgo, // All time records
			endDate: this.today
		};

		this.lunchCheckService.getStudentLunchCheckInAndOutHistory(request).subscribe({
			next: async (lunchCheckHistory) => {
				await this.handleViewRecordsSearchResult(studentWithContractStatus, lunchCheckHistory);
			},
			error: () => {
				this.messageService.error('An error occurred while searching for the student. Please try again.');
			}
		});
	}

	private async handleViewRecordsSearchResult(studentWithContractStatus: StudentWithContractStatus, lunchCheckHistory: GetStudentLunchCheckInAndOutHistoryResponse) {
		console.log('Search result for student history:', lunchCheckHistory);
		const compositeRecord: StudentLunchCheckCompositeRecord = {
			student: studentWithContractStatus.student,
			studentLunchCheck: { 
				studentID: studentWithContractStatus.student.id,
				tenantID: studentWithContractStatus.student.tenantID,
				contractSigned: studentWithContractStatus.contractSigned 
			},
			lunchCheckRecords: lunchCheckHistory.records
		};

		const result: StudentDetailsDialogueResult | undefined = await StudentDetailsDialogue.open(this.dialog, { student: compositeRecord });

		if (result !== undefined) {
			this.results.update((current) => ({
				...current,
				rows: current.rows.map((row) =>
					row.student.id === studentWithContractStatus.student.id
						? { ...row, contractSigned: result.contractSigned, student: result.student }
						: row
				),
			}));
		}

		this.studentSelected.set(null);
	}

	protected resetDateFilter(): void {
		this.range.reset();
	}

}
