import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProjectMemberRole, isProjectAdmin } from "@/lib/project-auth";

export async function GET(request, { params }) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check project role/membership
    const role = await getProjectMemberRole(projectId, session.id);
    if (!role) {
      return NextResponse.json(
        { error: "Forbidden. You are not a member of this project." },
        { status: 403 }
      );
    }

    // Fetch project details
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ project, currentUserRole: role });
  } catch (error) {
    console.error("Fetch project details error:", error);
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

    const { id: projectId } = await params;

    // Must be project ADMIN to delete
    const isAdmin = await isProjectAdmin(projectId, session.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Only project admins can delete the project." },
        { status: 403 }
      );
    }

    // Delete project (cascade delete will delete ProjectMember, Task, Comments)
    await db.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Project deleted successfully." });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
