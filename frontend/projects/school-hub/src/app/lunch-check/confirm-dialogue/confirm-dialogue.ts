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
import { ConfirmationResult } from 'firebase/auth';

export interface DialogData {
	message: string;
}

export interface DialogueResult {
	userChoice: boolean;
}

@Component({
	selector: 'confirm-dialogue',
	imports: [
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatIconModule,
	],
	templateUrl: './confirm-dialogue.html',
	styleUrl: './confirm-dialogue.scss',
})
export class ConfirmDialogueComponent {
	readonly dialogRef = inject(MatDialogRef<ConfirmDialogueComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);

	static open(dialog: MatDialog, data: DialogData): Promise<DialogueResult | undefined> {
		const dialogRef = dialog.open(ConfirmDialogueComponent, {
			data: data,
		});

		return dialogRef.afterClosed().toPromise();
	}
}
