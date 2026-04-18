import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiService } from '../../api.service';
import { Student } from 'shared/kinds';
import { StudentUpsertPayload } from './student.model';
import { StudentForm } from './student-form/student-form';
import { StudentList } from './student-list/student-list';

@Component({
	selector: 'app-students',
	imports: [StudentForm, StudentList],
	templateUrl: './students.html',
	styleUrl: './students.scss',
})
export class Students implements OnInit {
	private readonly apiService = inject(ApiService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly students = signal<Student[]>([]);
	protected readonly isLoading = signal(true);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly actionMessage = signal<string | null>(null);
	protected readonly isSubmitting = signal(false);
	protected readonly formMode = signal<'add' | 'edit' | null>(null);
	protected readonly editingStudentId = signal<string | null>(null);
	protected readonly formId = signal('');
	protected readonly formFirstName = signal('');
	protected readonly formLastName = signal('');

	ngOnInit(): void {
		this.loadStudents();
	}

	protected loadStudents(): void {
		this.isLoading.set(true);
		this.errorMessage.set(null);

		this.apiService
			.get<Student[]>('students')
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: (students) => {
					this.students.set(students);
					this.isLoading.set(false);
				},
				error: () => {
					this.errorMessage.set('Unable to load students. Please try again.');
					this.isLoading.set(false);
				},
			});
	}

	protected addStudent(): void {
		this.formMode.set('add');
		this.editingStudentId.set(null);
		this.formId.set('');
		this.formFirstName.set('');
		this.formLastName.set('');
		this.actionMessage.set(null);
	}

	protected updateStudent(student: Student): void {
		this.formMode.set('edit');
		this.editingStudentId.set(student.id);
		this.formId.set(student.schoolStudentID);
		this.formFirstName.set(student.firstName);
		this.formLastName.set(student.lastName);
		this.actionMessage.set(null);
	}

	protected deleteStudent(student: Student): void {
		const shouldDelete = confirm(
			`Delete student "${student.firstName} ${student.lastName}"?`,
		);
		if (!shouldDelete) {
			return;
		}

		this.isSubmitting.set(true);
		this.actionMessage.set(null);

		this.apiService
			.delete<void>(`students/${student.id}`)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.students.update((existing) =>
						existing.filter((current) => current.id !== student.id),
					);
					this.isSubmitting.set(false);
					this.actionMessage.set(
						`Deleted ${student.firstName} ${student.lastName}.`,
					);
					if (this.editingStudentId() === student.id) {
						this.cancelStudentForm();
					}
				},
				error: () => {
					this.isSubmitting.set(false);
					this.actionMessage.set('Unable to delete student. Please try again.');
				},
			});
	}

	protected saveStudent(formValue: StudentUpsertPayload): void {
		const firstName = formValue.firstName.trim();
		const lastName = formValue.lastName.trim();

		if (!firstName || !lastName) {
			this.actionMessage.set('First name and last name are required.');
			return;
		}

		const mode = this.formMode();
		if (mode === 'add') {
			const id = (formValue.id ?? '').trim();
			if (!id) {
				this.actionMessage.set('Student ID is required.');
				return;
			}
			this.createStudent({ schoolStudentID: id, firstName, lastName });
			return;
		}

		if (mode === 'edit') {
			const studentId = this.editingStudentId();
			if (!studentId) {
				this.actionMessage.set('Unable to update student. Missing student ID.');
				return;
			}
			const schoolStudentID = (formValue.schoolStudentID ?? '').trim();
			if (!schoolStudentID) {
				this.actionMessage.set('Student ID is required.');
				return;
			}
			this.editStudent(studentId, { schoolStudentID, firstName, lastName });
		}
	}

	protected cancelStudentForm(): void {
		this.formMode.set(null);
		this.editingStudentId.set(null);
		this.formId.set('');
		this.formFirstName.set('');
		this.formLastName.set('');
	}

	private createStudent(payload: {
		schoolStudentID: string;
		firstName: string;
		lastName: string;
	}): void {
		this.isSubmitting.set(true);
		this.actionMessage.set(null);

		this.apiService
			.post<Student>('students', payload)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: (student) => {
					this.students.update((existing) => [...existing, student]);
					this.isSubmitting.set(false);
					this.cancelStudentForm();
					this.actionMessage.set(
						`Added ${student.firstName} ${student.lastName}.`,
					);
				},
				error: (err: any) => {
					this.isSubmitting.set(false);
					console.log('Error creating student:', err);
					if (err.status === 400) {
						console.log('Validation error details:', err.error);
						this.actionMessage.set(err.error?.error || 'Unable to add student. Please check your input and try again.');
					} else {
						this.actionMessage.set('Unable to add student. Please try again.');
					}
				},
			});
	}

	private editStudent(studentId: string, payload: StudentUpsertPayload): void {
		this.isSubmitting.set(true);
		this.actionMessage.set(null);

		this.apiService
			.put<Student>(`students/${studentId}`, payload)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: (student) => {
					this.students.update((existing) =>
						existing.map((current) =>
							current.id === student.id ? student : current,
						),
					);
					this.isSubmitting.set(false);
					this.cancelStudentForm();
					this.actionMessage.set(
						`Updated ${student.firstName} ${student.lastName}.`,
					);
				},
				error: (err: any) => {
					this.isSubmitting.set(false);
					console.log('Error updating student:', err);
					if (err.status === 400) {
						console.log('Validation error details:', err.error);
						this.actionMessage.set(err.error?.error || 'Unable to update student. Please check your input and try again.');
					} else {
						this.actionMessage.set('Unable to update student. Please try again.');
					}
				},
			});
	}
}
