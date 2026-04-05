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
  @Input() initialId = '';
  @Input() initialFirstName = '';
  @Input() initialLastName = '';

  @Output() save = new EventEmitter<StudentUpsertPayload>();
  @Output() cancel = new EventEmitter<void>();

  protected studentId = '';
  protected studentFirstName = '';
  protected studentLastName = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialId'] ||
      changes['initialFirstName'] ||
      changes['initialLastName'] ||
      changes['mode']
    ) {
      this.studentId = this.initialId;
      this.studentFirstName = this.initialFirstName;
      this.studentLastName = this.initialLastName;
    }
  }

  protected submitStudent(): void {
    const payload: StudentUpsertPayload = {
      firstName: this.studentFirstName,
      lastName: this.studentLastName,
    };
    if (this.mode === 'add') {
      payload.id = this.studentId;
    }
    this.save.emit(payload);
  }

  protected cancelEdit(): void {
    this.cancel.emit();
  }
}
