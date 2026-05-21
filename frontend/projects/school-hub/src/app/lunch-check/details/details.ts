import {
	Component,
	computed,
	effect,
	inject,
	signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, startWith } from 'rxjs';
import { GetStudentLunchCheckInAndOutHistoryRequest, GetStudentLunchCheckInAndOutHistoryResponse, LunchCheckRecord, QueryStudentLunchCheckResponse, SaveStudentLunchCheckConfigRequest, Student, StudentLunchCheck, StudentLunchCheckCompositeRecord } from '../../../../../../../shared/kinds';
import { LunchCheckService } from '../lunch-check.service';
import { CreateStudentComponent, CreateStudentFormData } from '../create-student/create-student';
import { StudentListComponent, getClockStatus } from '../student-list/student-list';
import { StudentIdReaderComponent } from '../student-id-reader/student-id-reader';
import { StudentActivityWarningDialogue } from '../student-activity-warning-dialogue/student-activity-warning-dialogue';
import { MatDialog } from '@angular/material/dialog';
import { MessageService } from '../message-service';
import { StudentDetailsDialogue } from '../student-details-dialogue.ts/student-details-dialogue';

@Component({
	selector: 'app-details',
	imports: [RouterLink, StudentListComponent],
	templateUrl: './details.html',
	styleUrl: './details.scss',
})
export class DetailsComponent {
	private readonly dialog = inject(MatDialog);
	private readonly messageService = inject(MessageService);
	private readonly lunchCheckService = inject(LunchCheckService);

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
		lunchDate?: string;
	}>();

	protected readonly results = signal<QueryStudentLunchCheckResponse>({ records: [], totalRecords: 0, pageNumber: 0, pageSize: 10 });

	protected readonly studentResults = computed(() => this.results().records);
	protected readonly today = new Date().toISOString().split('T')[0];

	constructor() {
		this.searchTrigger$.pipe(
			debounceTime(400),
			distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
			switchMap((filters) => {
				this.isSearching.set(true);
				this.searchError.set(null);
				return this.lunchCheckService.searchStudents(filters).pipe(
					catchError(() => {
						this.searchError.set('Failed to search students. Please try again.');
						return of({ records: [], totalRecords: 0, pageNumber: 0, pageSize: 10 });
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
				lunchDate: undefined,
			});
		});

		// Clear isSearching once results update
		effect(() => {
			this.results();
			this.isSearching.set(false);
		});
	}

	// ─── Handlers ────────────────────────────────────────────────────────────
	protected async onSelectStudent(studentLunchCheckCompositeRecord: StudentLunchCheckCompositeRecord): Promise<void> {
		console.log("Selected record:", studentLunchCheckCompositeRecord);
		const request: GetStudentLunchCheckInAndOutHistoryRequest = {
			studentID: studentLunchCheckCompositeRecord.student.id,
			startDate: new Date(1).toISOString().split('T')[0], // All time records
			endDate: new Date().toISOString().split('T')[0]
		};

		this.lunchCheckService.getStudentLunchCheckInAndOutHistory(request).subscribe({
			next: async (lunchCheckHistory) => {
				await this.handleViewRecordsSearchResult(lunchCheckHistory, studentLunchCheckCompositeRecord)
			},
			error: () => {
				this.messageService.error('An error occurred while searching for the student. Please try again.');
			}
		});
	}

	private async handleViewRecordsSearchResult(getStudentLunchCheckInAndOutHistoryResponse: GetStudentLunchCheckInAndOutHistoryResponse, studentLunchCheckCompositeRecord: StudentLunchCheckCompositeRecord) {
		console.log('Search result for student history:', getStudentLunchCheckInAndOutHistoryResponse);
		const compositeRecord: StudentLunchCheckCompositeRecord = {
			student: studentLunchCheckCompositeRecord.student,
			studentLunchCheck: studentLunchCheckCompositeRecord.studentLunchCheck,
			lunchCheckRecords: getStudentLunchCheckInAndOutHistoryResponse.records
		};

		const result = await StudentDetailsDialogue.open(this.dialog, { student: compositeRecord });
		if (!result) {
			return;
		}

		if (result.contractCompleted !== undefined &&
			result.contractCompleted !== (compositeRecord.studentLunchCheck?.contractSigned ?? false)) {
			this.results.update((current) => ({
				...current,
				records: current.records.map((r) =>
					r.student.id === compositeRecord.student.id
						? {
							...r,
							studentLunchCheck: r.studentLunchCheck
								? { ...r.studentLunchCheck, contractSigned: result.contractCompleted! }
								: { studentID: r.student.id, tenantID: r.student.tenantID, contractSigned: result.contractCompleted! },
						}
						: r,
				),
			}));
		}
	}
}
