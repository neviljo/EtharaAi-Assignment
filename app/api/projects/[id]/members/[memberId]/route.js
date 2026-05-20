import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isProjectAdmin } from "@/lib/project-auth";

export async function PATCH(request, { params }) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, memberId } = await params;

    // Check if current user is ADMIN
    const isAdmin = await isProjectAdmin(projectId, session.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Only project admins can modify roles." },
        { status: 403 }
      );
    }

    const { role } = await request.json();
    if (role !== "ADMIN" && role !== "MEMBER") {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN or MEMBER." },
        { status: 400 }
      );
    }

    // Get the target membership
    const membership = await db.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.projectId !== projectId) {
      return NextResponse.json({ error: "Member not found in this project." }, { status: 404 });
    }

    // If changing from ADMIN to MEMBER, make sure there is at least one other ADMIN
    if (membership.role === "ADMIN" && role === "MEMBER") {
      const adminCount = await db.projectMember.count({
        where: {
          projectId,
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot downgrade the last administrator of the project." },
          { status: 400 }
        );
      }
    }

    // Update role
    const updated = await db.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Role updated successfully.",
      member: {
        id: updated.id,
        role: updated.role,
        user: updated.user,
      },
    });
  } catch (error) {
    console.error("Update project member role error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, memberId } = await params;

    // Get the membership to be deleted
    const membership = await db.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.projectId !== projectId) {
      return NextResponse.json({ error: "Member not found in this project." }, { status: 404 });
    }

    // Authorization: User can remove themselves (leave), or must be project ADMIN
    const isSelf = membership.userId === session.id;
    const isAdmin = await isProjectAdmin(projectId, session.id);

    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. You must be an admin to remove other members." },
        { status: 403 }
      );
    }

    // If removing an ADMIN, make sure there is another ADMIN left
    if (membership.role === "ADMIN") {
      const adminCount = await db.projectMember.count({
        where: {
          projectId,
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last administrator of the project." },
          { status: 400 }
        );
      }
    }

    // Remove membership
    await db.projectMember.delete({
      where: { id: memberId },
    });

    // Also, if the member has assigned tasks in this project, set their assigneeId to null in this project
    await db.task.updateMany({
      where: {
        projectId,
        assigneeId: membership.userId,
      },
      data: {
        assigneeId: null,
      },
    });

    return NextResponse.json({ message: "Member removed from project successfully." });
  } catch (error) {
    console.error("Remove project member error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
