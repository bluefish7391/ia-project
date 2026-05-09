import {
	Component,
	computed,
	effect,
	inject,
	signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, startWith } from 'rxjs';
import { GetStudentLunchCheckInAndOutHistoryRequest, GetStudentLunchCheckInAndOutHistoryResponse, LunchCheckRecord, QueryStudentLunchCheckResponse, Student, StudentLunchCheckCompositeRecord } from '../../../../../../../shared/kinds';
import { LunchCheckService } from '../lunch-check.service';
import { CreateStudentComponent, CreateStudentFormData } from '../create-student/create-student';
import { StudentListComponent, getClockStatus } from '../student-list/student-list';
import { StudentIdReaderComponent } from '../student-id-reader/student-id-reader';
import { StudentActivityDialogue } from '../student-activity-dialogue/student-activity-dialogue';
import { MatDialog } from '@angular/material/dialog';
import { MessageService } from '../message-service';

@Component({
	selector: 'app-lunch-check-clock-action',
	imports: [RouterLink, StudentListComponent],
	templateUrl: './lunch-check-clock-action.html',
	styleUrl: './lunch-check-clock-action.scss',
})
export class LunchCheckClockActionComponent {
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

	protected readonly results = toSignal(
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
		),
		{ initialValue: { records: [], totalRecords: 0, pageNumber: 0, pageSize: 10 } },
	);

	protected readonly studentResults = computed(() => this.results().records);
	protected readonly today = new Date().toISOString().split('T')[0];

	constructor() {
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
	protected async onSelectStudent(record: StudentLunchCheckCompositeRecord): Promise<void> {
		// TODO: fix bug where this filter doesn't get all records, it gets none
		console.log("Selected record:", record);
		const request: GetStudentLunchCheckInAndOutHistoryRequest = {
			studentID: record.student.id,
			startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], // Default to last 7 days
			endDate: new Date().toISOString().split('T')[0]
		};

		this.lunchCheckService.getStudentLunchCheckInAndOutHistory(request).subscribe({
			next: async response => await this.handleViewRecordsSearchResult(response, record.student),
			error: () => {
				this.messageService.error('An error occurred while searching for the student. Please try again.');
			}
		});
	}

	private async handleViewRecordsSearchResult(response: GetStudentLunchCheckInAndOutHistoryResponse, student: Student) {
		console.log('Search result for student history:', response);

		const compositeRecord: StudentLunchCheckCompositeRecord = {
			student,
			lunchCheckRecords: response.records
		};

		await StudentActivityDialogue.open(this.dialog, {
			mode: 'view-records',
			student: compositeRecord
		});
	}
}
