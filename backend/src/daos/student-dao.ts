import { Student } from "../../../shared/kinds";
import { datastore } from "./datastore-factory";

export class StudentDAO {
    static readonly STUDENT_KIND = "Student";

    public async getAllStudents(tenantID: string): Promise<Student[]> {
        const query = datastore.createQuery(StudentDAO.STUDENT_KIND).filter("tenantID", "=", tenantID);
        const data = await query.run();
        return data[0] as Student[];
    }

    public async getStudent(tenantID: string, id: string): Promise<Student | null> {
        const key = datastore.key([StudentDAO.STUDENT_KIND, id]);
        const [entity] = await datastore.get(key);
        if (!entity || entity.tenantID !== tenantID) return null;
        return { id, ...entity };
    }

	public async getStudentBySchoolID(tenantID: string, schoolStudentID: string): Promise<Student | null> {
		const query = datastore
			.createQuery(StudentDAO.STUDENT_KIND)
			.filter("tenantID", "=", tenantID)
			.filter("schoolStudentID", "=", schoolStudentID)
			.limit(1);
		const data = await query.run();
		const students = data[0] as Student[];
		if (students.length === 0) return null;
		return students[0];
	}

    public async createStudent(student: Student): Promise<Student> {
        const key = datastore.key([StudentDAO.STUDENT_KIND, student.id]);
        const entity = { key, data: student };
        await datastore.save(entity);
        return student;
    }

    public async updateStudent(student: Student): Promise<Student | null> {
        const key = datastore.key([StudentDAO.STUDENT_KIND, student.id]);
        const [existing] = await datastore.get(key);
        if (!existing) return null;
        const updated = { ...existing, ...student };
        const entity = { key, data: updated };
        await datastore.save(entity);
        return student;
    }

    public async deleteStudent(id: string): Promise<boolean> {
        const key = datastore.key([StudentDAO.STUDENT_KIND, id]);
        const [existing] = await datastore.get(key);
        if (!existing) return false;
        await datastore.delete(key);
        return true;
    }
}
