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
	mode: 'info' | 'error';
	message: string;
}

@Component({
	selector: 'message-dialogue',
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
	templateUrl: './message-dialogue.html',
	styleUrl: './message-dialogue.scss',
})
export class MessageDialogueComponent {
	readonly dialogRef = inject(MatDialogRef<MessageDialogueComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);

	static open(dialog: MatDialog, data: DialogData): Promise<void> {
		const dialogRef = dialog.open(MessageDialogueComponent, {
			data: data,
		});

		return dialogRef.afterClosed().toPromise();
	}
}
