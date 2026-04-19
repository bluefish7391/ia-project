import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, startWith } from 'rxjs';
import { StudentLunchCheckCompositeRecord } from '../../../../../../../shared/kinds';
import { LunchCheckService } from '../lunch-check.service';
import { CreateStudentComponent, CreateStudentFormData } from '../create-student/create-student';
import { StudentListComponent, getClockStatus } from '../student-list/student-list';

@Component({
  selector: 'app-lunch-check-clock-action',
  imports: [RouterLink, StudentListComponent, CreateStudentComponent],
  templateUrl: './lunch-check-clock-action.html',
  styleUrl: './lunch-check-clock-action.scss',
  host: {
    '[class.clock-in-mode]': 'checkingIn()',
    '[class.clock-out-mode]': '!checkingIn()',
  },
})
export class LunchCheckClockActionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lunchCheckService = inject(LunchCheckService);

  private readonly createStudentRef = viewChild(CreateStudentComponent);

  // ─── Route-driven state ──────────────────────────────────────────────────
  protected readonly checkingIn = signal<boolean>(true);

  // ─── Search state ────────────────────────────────────────────────────────
  protected readonly searchSchoolStudentID = signal('');
  protected readonly searchFirstName = signal('');
  protected readonly searchLastName = signal('');
  protected readonly isSearching = signal(false);
  protected readonly searchError = signal<string | null>(null);

  // ─── Selection / action state ────────────────────────────────────────────
  protected readonly selectedRecord = signal<StudentLunchCheckCompositeRecord | null>(null);
  protected readonly createFormVisible = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  // ─── Today's date ────────────────────────────────────────────────────────
  protected readonly today = new Date().toISOString().split('T')[0];

  // ─── Search pipeline ─────────────────────────────────────────────────────
  private readonly searchTrigger$ = new Subject<{
    schoolStudentID: string;
    firstName: string;
    lastName: string;
    lunchDate: string;
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

  // ─── Computed ────────────────────────────────────────────────────────────
  protected readonly actionLabel = computed(() => (this.checkingIn() ? 'Clock In' : 'Clock Out'));
  protected readonly pageTitle = computed(() =>
    this.checkingIn() ? 'Clock In Student' : 'Clock Out Student',
  );
  protected readonly showCreateForm = computed(() => this.createFormVisible());

  protected readonly selectedStudentStatus = computed(() => {
    const rec = this.selectedRecord();
    if (!rec) return null;
    return getClockStatus(rec.lunchCheckRecords);
  });

  protected readonly statusWarning = computed<string | null>(() => {
    const status = this.selectedStudentStatus();
    if (!status) return null;
    if (this.checkingIn() && status === 'clocked-in') {
      return 'This student is currently clocked in. They will be clocked in again.';
    }
    if (!this.checkingIn() && status !== 'clocked-in') {
      return 'This student does not appear to be currently clocked in. They will be clocked out anyway.';
    }
    return null;
  });

  protected readonly studentResults = computed(() => this.results().records);

  constructor() {
    // Watch search signals and push to subject
    effect(() => {
      this.searchTrigger$.next({
        schoolStudentID: this.searchSchoolStudentID(),
        firstName: this.searchFirstName(),
        lastName: this.searchLastName(),
        lunchDate: this.today,
      });
    });

    // Clear isSearching once results update
    effect(() => {
      this.results();
      this.isSearching.set(false);
    });
  }

  ngOnInit(): void {
    this.checkingIn.set(this.route.snapshot.data['checkingIn'] as boolean);
  }

  // ─── Handlers ────────────────────────────────────────────────────────────
  protected onSelectStudent(record: StudentLunchCheckCompositeRecord): void {
    this.selectedRecord.set(record);
  }

  protected onConfirm(): void {
    const record = this.selectedRecord();
    if (!record) return;
    this.isSaving.set(true);
    this.saveError.set(null);
    this.lunchCheckService
      .clockStudent(record.student.id, this.today, this.checkingIn())
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/lunch-check']);
        },
        error: () => {
          this.isSaving.set(false);
          this.saveError.set('Failed to save. Please try again.');
        },
      });
  }

  protected onToggleCreateForm(): void {
    this.createFormVisible.update((v) => !v);
  }

  protected onStudentCreated(data: CreateStudentFormData): void {
    this.isSaving.set(true);
    this.saveError.set(null);
    this.lunchCheckService.createStudent(data).subscribe({
      next: (student) => {
        this.lunchCheckService
          .saveStudentLunchCheckConfig({
            studentID: student.id,
            contractSigned: data.contractSigned,
          })
          .subscribe({
            next: () => {
              this.isSaving.set(false);
              this.createStudentRef()?.onReset();
              // Re-trigger search to show new student
              this.searchTrigger$.next({
                schoolStudentID: this.searchSchoolStudentID(),
                firstName: this.searchFirstName(),
                lastName: this.searchLastName(),
                lunchDate: this.today,
              });
            },
            error: () => {
              this.isSaving.set(false);
              this.saveError.set('Student created but failed to save contract status. Please try again.');
            },
          });
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('Failed to create student. Please try again.');
      },
    });
  }
}
