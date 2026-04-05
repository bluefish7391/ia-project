export interface StudentUpsertPayload {
  id?: string; // required in add mode (school-assigned); omitted in edit mode (route param)
  firstName: string;
  lastName: string;
}
