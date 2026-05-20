import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, requireAuth, requireTaskAccess, updateTaskSchema } from "@/lib/api-utils";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

export const PATCH = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: taskId } = await params;

  const result = await requireTaskAccess(taskId, session.id);
  if (!result) throw new NotFoundError("Task", taskId);
  const { task, role } = result;

  const body = updateTaskSchema.parse(await request.json());
  const keys = Object.keys(body).filter((k) => body[k] !== undefined);

  if (role === "MEMBER") {
    const invalidKeys = keys.filter((k) => k !== "status");
    if (invalidKeys.length > 0) {
      throw new ForbiddenError("Members can only update task status.");
    }
  }

  const updateData = {};
  if (body.status !== undefined) updateData.status = body.status;

  if (role === "ADMIN") {
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.assigneeId !== undefined) {
      if (body.assigneeId) {
        const { getProjectMemberRole } = await import("@/lib/project-auth");
        const assigneeRole = await getProjectMemberRole(task.projectId, body.assigneeId);
        if (!assigneeRole) throw new ValidationError("Assignee must be a project member.");
      }
      updateData.assigneeId = body.assigneeId || null;
    }
  }

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ message: "Task updated successfully.", task: updatedTask });
});

export const DELETE = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: taskId } = await params;

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw new NotFoundError("Task", taskId);

  const { isProjectAdmin } = await import("@/lib/project-auth");
  const isAdmin = await isProjectAdmin(task.projectId, session.id);
  if (!isAdmin) throw new ForbiddenError("Only project admins can delete tasks.");

  await db.task.delete({ where: { id: taskId } });

  return NextResponse.json({ message: "Task deleted successfully." });
});
