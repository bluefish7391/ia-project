import { ChangeDetectionStrategy, Component, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
	animal: string;
	name: string;
}

export interface DialogResult {
	animal: string;
	name: string;
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
	readonly animal = model(this.data.animal);

	static open(dialog: MatDialog, data: DialogData): Promise<DialogResult | undefined> {
		const dialogRef = dialog.open(StudentIdReaderComponent, {
			data: data,
		});

		return dialogRef.afterClosed().toPromise();
	}

	onOkClick() {
		const dialogResult: DialogResult = {
			animal: this.animal(),
			name: this.data.name,
		};
		this.dialogRef.close(dialogResult);
	}
}
