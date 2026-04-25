import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MessageDialogueComponent } from './message-dialogue/message-dialogue';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogueComponent } from './confirm-dialogue/confirm-dialogue';

@Injectable({ providedIn: 'root' })
export class MessageService {
	private readonly dialog = inject(MatDialog);

	info(message: string): void {
		MessageDialogueComponent.open(this.dialog, { mode: 'info', message: message });
	}

	error(message: string): void {
		MessageDialogueComponent.open(this.dialog, { mode: 'error', message: message });
	}

	async confirm(message: string): Promise<boolean> {
		const result = await ConfirmDialogueComponent.open(this.dialog, { message: message });
		return result?.userChoice === true;
	}
}
