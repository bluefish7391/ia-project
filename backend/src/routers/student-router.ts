import express, { Request, Response } from "express";
import { studentManager } from "../managers/manager-factory";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";

export class StudentRouter extends BaseRouter {
    public static buildRouter() {
        const studentRouter = new StudentRouter();
        return express.Router()
            .get("", studentRouter.wrapAsync(studentRouter.getAllStudents.bind(studentRouter)))
            .post("", studentRouter.wrapAsync(studentRouter.createStudent.bind(studentRouter)))
            .get("/:id", studentRouter.wrapAsync(studentRouter.getStudent.bind(studentRouter)))
            .put("/:id", studentRouter.wrapAsync(studentRouter.updateStudent.bind(studentRouter)))
            .delete("/:id", studentRouter.wrapAsync(studentRouter.deleteStudent.bind(studentRouter)));
    }

    async getAllStudents(req: Request, res: Response) {
        const students = await studentManager.getAllStudents(new RequestContext(req));
        this.sendSuccess(res, students);
    }

    async getStudent(req: Request, res: Response) {
        const student = await studentManager.getStudent(new RequestContext(req), req.params["id"] as string);
        if (!student) {
            this.sendServerError(res, { error: "Student not found." });
            return;
        }
        this.sendSuccess(res, student);
    }

    async createStudent(req: Request, res: Response) {
        const body = req.body as { id?: string; firstName?: string; lastName?: string };
        if (!body.id) {
            this.sendBadRequestError(res, { error: "id is required." });
            return;
        }
        if (!body.firstName) {
            this.sendBadRequestError(res, { error: "firstName is required." });
            return;
        }
        if (!body.lastName) {
            this.sendBadRequestError(res, { error: "lastName is required." });
            return;
        }
        const student = await studentManager.createStudent(new RequestContext(req), {
            id: body.id,
            firstName: body.firstName,
            lastName: body.lastName,
        });
        this.sendSuccess(res, student);
    }

    async updateStudent(req: Request, res: Response) {
        const body = req.body as { firstName?: string; lastName?: string };
        const id = req.params["id"] as string;
        if (!body.firstName) {
            this.sendBadRequestError(res, { error: "firstName is required." });
            return;
        }
        if (!body.lastName) {
            this.sendBadRequestError(res, { error: "lastName is required." });
            return;
        }
        const student = await studentManager.updateStudent(new RequestContext(req), {
            id,
            firstName: body.firstName,
            lastName: body.lastName,
        });
        if (!student) {
            this.sendServerError(res, { error: "Student not found." });
            return;
        }
        this.sendSuccess(res, student);
    }

    async deleteStudent(req: Request, res: Response) {
        const deleted = await studentManager.deleteStudent(new RequestContext(req), req.params["id"] as string);
        if (!deleted) {
            this.sendServerError(res, { error: "Student not found." });
            return;
        }
        this.sendSuccess(res, { message: "Student successfully deleted." });
    }
}
