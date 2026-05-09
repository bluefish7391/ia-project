import { Component, input, output } from '@angular/core';
import { LunchCheckRecord, StudentLunchCheckCompositeRecord } from '../../../../../../../shared/kinds';

export type ClockStatus = 'clocked-in' | 'clocked-out' | 'not-clocked-in';

export function getClockStatus(records: LunchCheckRecord[]): ClockStatus {
	if (records.length === 0) return 'not-clocked-in';
	const sorted = [...records].sort(
		(a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
	);
	const latest = sorted[sorted.length - 1];
	if (latest.checkInTime && !latest.checkOutTime) return 'clocked-in';
	if (latest.checkInTime && latest.checkOutTime) return 'clocked-out';
	return 'not-clocked-in';
}

@Component({
	selector: 'app-student-list',
	imports: [],
	templateUrl: './student-list.html',
	styleUrl: './student-list.scss',
})
export class StudentListComponent {
	readonly records = input.required<StudentLunchCheckCompositeRecord[]>();
	readonly isLoading = input<boolean>(false);

	readonly recordSelected = output<StudentLunchCheckCompositeRecord>();

	protected readonly getClockStatus = getClockStatus;

	select(record: StudentLunchCheckCompositeRecord): void {
		this.recordSelected.emit(record);
	}
}
