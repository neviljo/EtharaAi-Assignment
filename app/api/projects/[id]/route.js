import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, requireAuth, requireProjectMember, requireProjectAdmin } from "@/lib/api-utils";
import { NotFoundError } from "@/lib/errors";

export const GET = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: projectId } = await params;
  const role = await requireProjectMember(projectId, session.id);

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) throw new NotFoundError("Project", projectId);

  return NextResponse.json({ project, currentUserRole: role });
});

export const DELETE = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: projectId } = await params;
  await requireProjectAdmin(projectId, session.id);

  await db.project.delete({ where: { id: projectId } });

  return NextResponse.json({ message: "Project deleted successfully." });
});
