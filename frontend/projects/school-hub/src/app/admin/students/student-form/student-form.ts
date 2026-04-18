import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StudentUpsertPayload } from '../student.model';

@Component({
  selector: 'app-student-form',
  imports: [FormsModule],
  templateUrl: './student-form.html',
  styleUrl: './student-form.scss',
})
export class StudentForm implements OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() isSubmitting = false;
  @Input() initialSchoolStudentID = '';
  @Input() initialFirstName = '';
  @Input() initialLastName = '';

  @Output() save = new EventEmitter<StudentUpsertPayload>();
  @Output() cancel = new EventEmitter<void>();

  protected schoolStudentID = '';
  protected studentFirstName = '';
  protected studentLastName = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialSchoolStudentID'] ||
      changes['initialFirstName'] ||
      changes['initialLastName'] ||
      changes['mode']
    ) {
      this.schoolStudentID = this.initialSchoolStudentID;
      this.studentFirstName = this.initialFirstName;
      this.studentLastName = this.initialLastName;
    }
  }

  protected submitStudent(): void {
    const payload: StudentUpsertPayload = {
      schoolStudentID: this.schoolStudentID,
      firstName: this.studentFirstName,
      lastName: this.studentLastName,
    };
    if (this.mode === 'add') {
      payload.id = this.schoolStudentID;
    }
    this.save.emit(payload);
  }

  protected cancelEdit(): void {
    this.cancel.emit();
  }
}
