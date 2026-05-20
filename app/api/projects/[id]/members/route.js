import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, requireAuth, requireProjectAdmin, memberSchema } from "@/lib/api-utils";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";

export const POST = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: projectId } = await params;
  await requireProjectAdmin(projectId, session.id);

  const { email, role } = memberSchema.parse(await request.json());

  const targetUser = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!targetUser) {
    throw new NotFoundError(`User with email "${email}" does not have an account. They must sign up first.`);
  }

  const existingMembership = await db.projectMember.findUnique({
    where: { userId_projectId: { userId: targetUser.id, projectId } },
  });

  if (existingMembership) {
    throw new ConflictError("This user is already a member of this project.");
  }

  const newMember = await db.projectMember.create({
    data: { projectId, userId: targetUser.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(
    {
      message: "Member added successfully.",
      member: { id: newMember.id, role: newMember.role, user: newMember.user },
    },
    { status: 201 },
  );
});
