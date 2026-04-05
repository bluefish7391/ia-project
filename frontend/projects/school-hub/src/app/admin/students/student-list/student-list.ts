import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Student } from '../../../../../../../../shared/kinds';

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.html',
  styleUrl: './student-list.scss',
})
export class StudentList {
  @Input() students: Student[] = [];
  @Input() isSubmitting = false;

  @Output() update = new EventEmitter<Student>();
  @Output() delete = new EventEmitter<Student>();
}
