import { Component, inject, model, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import {
	MAT_DIALOG_DATA,
	MatDialog,
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogRef,
	MatDialogTitle,
} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DialogData {
	mode: 'clock-in' | 'clock-out';
}

export interface DialogResult {
	schoolStudentID: string;
}

@Component({
	selector: 'student-id-reader',
	imports: [
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatDialogClose,
		MatIconModule,
	],
	templateUrl: './student-id-reader.html',
	styleUrl: './student-id-reader.scss',
})
export class StudentIdReaderComponent {
	readonly dialogRef = inject(MatDialogRef<StudentIdReaderComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	readonly studentID = model("");
	private readonly studentInputRef = viewChild.required<NgModel>('studentInput');

	static open(dialog: MatDialog, data: DialogData): Promise<DialogResult | undefined> {
		const dialogRef = dialog.open(StudentIdReaderComponent, {
			data: data,
		});

		return dialogRef.afterClosed().toPromise();
	}

	onOkClick() {
		if (!this.studentID().trim()) {
			this.studentInputRef().control.markAsTouched();
			return;
		}

		const dialogResult: DialogResult = {
			schoolStudentID: this.studentID()
		};
		this.dialogRef.close(dialogResult);
	}
}
