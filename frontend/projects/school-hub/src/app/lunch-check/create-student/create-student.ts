import { Component, input, output, signal } from '@angular/core';

export interface CreateStudentFormData {
  schoolStudentID: string;
  firstName: string;
  lastName: string;
  contractSigned: boolean;
}

@Component({
  selector: 'app-create-student',
  imports: [],
  templateUrl: './create-student.html',
  styleUrl: './create-student.scss',
})
export class CreateStudentComponent {
  readonly isSaving = input<boolean>(false);

  readonly studentCreated = output<CreateStudentFormData>();
  readonly cancelled = output<void>();

  protected readonly schoolStudentID = signal('');
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly contractSigned = signal(false);
  protected readonly validationError = signal<string | null>(null);

  onSubmit(): void {
    const schoolStudentID = this.schoolStudentID().trim();
    const firstName = this.firstName().trim();
    const lastName = this.lastName().trim();

    if (!schoolStudentID || !firstName || !lastName) {
      this.validationError.set('School ID, first name, and last name are all required.');
      return;
    }

    this.validationError.set(null);
    this.studentCreated.emit({
      schoolStudentID,
      firstName,
      lastName,
      contractSigned: this.contractSigned(),
    });
  }

  onReset(): void {
    this.schoolStudentID.set('');
    this.firstName.set('');
    this.lastName.set('');
    this.contractSigned.set(false);
    this.validationError.set(null);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
