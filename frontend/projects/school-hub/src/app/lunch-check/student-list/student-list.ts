import { Component, input, output } from '@angular/core';
import { LunchCheckRecord, Student, StudentLunchCheckCompositeRecord, StudentWithContractStatus } from '../../../../../../../shared/kinds';

@Component({
	selector: 'app-student-list',
	imports: [],
	templateUrl: './student-list.html',
	styleUrl: './student-list.scss',
})
export class StudentListComponent {
	readonly records = input.required<StudentWithContractStatus[]>();
	readonly isLoading = input<boolean>(false);

	readonly recordSelected = output<StudentWithContractStatus>();

	select(record: StudentWithContractStatus): void {
		this.recordSelected.emit(record);
	}
}
