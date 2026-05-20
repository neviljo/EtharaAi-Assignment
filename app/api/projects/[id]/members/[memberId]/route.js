import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, requireAuth, requireProjectAdmin } from "@/lib/api-utils";
import { NotFoundError, ValidationError } from "@/lib/errors";

export const PATCH = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: projectId, memberId } = await params;
  await requireProjectAdmin(projectId, session.id);

  const { role } = await request.json();
  if (role !== "ADMIN" && role !== "MEMBER") {
    throw new ValidationError("Role must be ADMIN or MEMBER.");
  }

  const membership = await db.projectMember.findUnique({ where: { id: memberId } });
  if (!membership || membership.projectId !== projectId) {
    throw new NotFoundError("Member not found in this project.");
  }

  if (membership.role === "ADMIN" && role === "MEMBER") {
    const adminCount = await db.projectMember.count({
      where: { projectId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new ValidationError("Cannot downgrade the last administrator of the project.");
    }
  }

  const updated = await db.projectMember.update({
    where: { id: memberId },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    message: "Role updated successfully.",
    member: { id: updated.id, role: updated.role, user: updated.user },
  });
});

export const DELETE = withErrorHandler(async (request, { params }) => {
  const session = requireAuth(request);
  const { id: projectId, memberId } = await params;

  const membership = await db.projectMember.findUnique({ where: { id: memberId } });
  if (!membership || membership.projectId !== projectId) {
    throw new NotFoundError("Member not found in this project.");
  }

  const isSelf = membership.userId === session.id;
  const role = await requireProjectAdmin(projectId, session.id);
  if (!isSelf && !role) {
    throw new ValidationError("You must be an admin to remove other members.");
  }

  if (membership.role === "ADMIN") {
    const adminCount = await db.projectMember.count({
      where: { projectId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new ValidationError("Cannot remove the last administrator of the project.");
    }
  }

  await db.projectMember.delete({ where: { id: memberId } });

  await db.task.updateMany({
    where: { projectId, assigneeId: membership.userId },
    data: { assigneeId: null },
  });

  return NextResponse.json({ message: "Member removed from project successfully." });
});
