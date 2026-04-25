import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentIdReaderComponent } from '../student-id-reader/student-id-reader';
import { MatDialog } from '@angular/material/dialog';

@Component({
	selector: 'app-lunch-check-home',
	imports: [RouterLink],
	templateUrl: './lunch-check-home.html',
	styleUrl: './lunch-check-home.scss',
})
export class LunchCheckHomeComponent {
	readonly dialog = inject(MatDialog);

	async openClockInDialog() {
		const result = await StudentIdReaderComponent.open(this.dialog, { mode: 'clock-in' });
		console.log('The dialog was closed (awaited)');
		if (result) {
			console.log(`Dialog result (awaited): ${result.studentID}`);
		}
	}
}
