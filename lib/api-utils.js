import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectMemberRole } from "@/lib/project-auth";
import { db } from "@/lib/db";
import { AppError, UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

export function requireAuth(request) {
  const session = getSessionUser(request);
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireProjectMember(projectId, userId) {
  const role = await getProjectMemberRole(projectId, userId);
  if (!role) throw new ForbiddenError("You are not a member of this project.");
  return role;
}

export async function requireProjectAdmin(projectId, userId) {
  const role = await requireProjectMember(projectId, userId);
  if (role !== "ADMIN") throw new ForbiddenError("Only project admins can perform this action.");
  return role;
}

export async function requireTaskAccess(taskId, userId) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) return null;
  const role = await getProjectMemberRole(task.projectId, userId);
  if (!role) return null;
  return { task, role };
}

export function withErrorHandler(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
        return NextResponse.json({ error: messages, code: "VALIDATION_ERROR" }, { status: 400 });
      }
      if (error instanceof AppError && error.isOperational) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
      }
      logger.error("Unexpected error", { error: error.message, stack: error.stack });
      return NextResponse.json({ error: "Internal server error.", code: "INTERNAL_ERROR" }, { status: 500 });
    }
  };
}

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required.").max(200),
  description: z.string().max(2000).optional().default(""),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional().default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("LOW"),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title cannot be empty.").max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const memberSchema = z.object({
  email: z.string().email("Invalid email format."),
  role: z.enum(["ADMIN", "MEMBER"]).optional().default("MEMBER"),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(2000),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required.").max(200),
  description: z.string().max(2000).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters.").max(128),
});
