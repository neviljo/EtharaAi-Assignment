import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, requireAuth, requireTaskAccess, commentSchema } from "@/lib/api-utils";
import { NotFoundError } from "@/lib/errors";

export const GET = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: taskId } = await params;

  const result = await requireTaskAccess(taskId, session.id);
  if (!result) throw new NotFoundError("Task", taskId);

  const comments = await db.comment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
});

export const POST = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: taskId } = await params;

  const result = await requireTaskAccess(taskId, session.id);
  if (!result) throw new NotFoundError("Task", taskId);

  const { content } = commentSchema.parse(await request.json());

  const comment = await db.comment.create({
    data: { content, taskId, userId: session.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ message: "Comment added successfully.", comment }, { status: 201 });
});
