import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Student } from 'shared/kinds';
import { LunchCheckService } from '../lunch-check.service';

export interface CreateStudentDialogueData {
  schoolStudentID: string;
}

@Component({
  selector: 'app-create-student-dialogue',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-student-dialogue.html',
  styleUrl: './create-student-dialogue.scss',
})
export class CreateStudentDialogueComponent {
  readonly dialogRef = inject(MatDialogRef<CreateStudentDialogueComponent>);
  readonly data = inject<CreateStudentDialogueData>(MAT_DIALOG_DATA);
  private readonly lunchCheckService = inject(LunchCheckService);

  protected readonly schoolStudentID = signal(this.data.schoolStudentID);
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly contractSigned = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  static open(dialog: MatDialog, data: CreateStudentDialogueData): Promise<Student | undefined> {
    return dialog
      .open(CreateStudentDialogueComponent, { data, disableClose: true, width: '400px' })
      .afterClosed()
      .toPromise();
  }

  onSubmit(): void {
    const schoolStudentID = this.schoolStudentID().trim();
    const firstName = this.firstName().trim();
    const lastName = this.lastName().trim();

    if (!schoolStudentID || !firstName || !lastName) {
      this.errorMessage.set('School Student ID, first name, and last name are all required.');
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    this.lunchCheckService.createStudent({ schoolStudentID, firstName, lastName }).subscribe({
      next: (student) => {
        this.lunchCheckService
          .saveStudentLunchCheckConfig({ studentID: student.id, contractSigned: this.contractSigned() })
          .subscribe({
            next: () => {
              this.isSaving.set(false);
              this.dialogRef.close(student);
            },
            error: () => {
              this.isSaving.set(false);
              this.errorMessage.set('Student was created but the contract setting could not be saved. Please update it from the admin panel.');
              this.dialogRef.close(student);
            },
          });
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('An error occurred while creating the student. Please try again.');
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }
}
