export interface StudentUpsertPayload {
  id?: string; // required in add mode (school-assigned student ID used as route key); omitted in edit mode (route param)
  schoolStudentID: string; // required in both modes (school-assigned)
  firstName: string;
  lastName: string;
}
