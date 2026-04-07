import { studentDAO } from "../daos/dao-factory";
import { Student } from "../../../shared/kinds";
import { RequestContext } from "../request-context";
import { BadRequestError, ServerError } from "../kinds";

export class StudentManager {
    async getAllStudents(requestContext: RequestContext): Promise<Student[]> {
        const students = await studentDAO.getAllStudents(requestContext.getCurrentTenantID());
        console.log("getAllStudents: students=", students);
        return students;
    }

    async getStudent(requestContext: RequestContext, id: string): Promise<Student | null> {
        const student = await studentDAO.getStudent(requestContext.getCurrentTenantID(), id);
        console.log("getStudent: student=", student);
        if (!student) {
            throw new BadRequestError("No student with that id");
        }
        return student;
    }

    async createStudent(
        requestContext: RequestContext,
        data: { id: string; firstName: string; lastName: string },
    ): Promise<Student> {
        const tenantID = requestContext.getCurrentTenantID();
        const existing = await studentDAO.getStudent(tenantID, data.id);
        if (existing) {
            throw new BadRequestError("A student with that ID already exists.");
        }
        const student: Student = { ...data, tenantID };
        console.log("createStudent: student=", student);
        return await studentDAO.createStudent(student);
    }

    async updateStudent(
        requestContext: RequestContext,
        student: Omit<Student, "tenantID">,
    ): Promise<Student | null> {
        const currentStudent = await studentDAO.getStudent(requestContext.getCurrentTenantID(), student.id);
        console.log("updateStudent: currentStudent=", currentStudent);
        if (!currentStudent) {
            throw new ServerError("Student not found.");
        }
        return await studentDAO.updateStudent({ ...student, tenantID: requestContext.getCurrentTenantID() });
    }

    async deleteStudent(requestContext: RequestContext, id: string): Promise<boolean> {
        const student = await studentDAO.getStudent(requestContext.getCurrentTenantID(), id);
        console.log("deleteStudent: student=", student);
        if (!student) {
            throw new BadRequestError("Student not found.");
        }
        return await studentDAO.deleteStudent(id);
    }
}
