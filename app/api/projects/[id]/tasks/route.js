import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, requireAuth, requireProjectAdmin, isProjectMember, taskSchema } from "@/lib/api-utils";
import { getProjectMemberRole } from "@/lib/project-auth";
import { ValidationError } from "@/lib/errors";

export const POST = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: projectId } = await params;
  await requireProjectAdmin(projectId, session.id);

  const data = taskSchema.parse(await request.json());

  if (data.assigneeId) {
    const isAssigneeMember = await getProjectMemberRole(projectId, data.assigneeId);
    if (!isAssigneeMember) {
      throw new ValidationError("Assignee must be a member of this project.");
    }
  }

  const task = await db.task.create({
    data: {
      title: data.title,
      description: data.description || "",
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      assigneeId: data.assigneeId || null,
      creatorId: session.id,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ message: "Task created successfully.", task }, { status: 201 });
});
