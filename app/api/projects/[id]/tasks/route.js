import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isProjectAdmin, isProjectMember } from "@/lib/project-auth";

export async function POST(request, { params }) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if current user is ADMIN of project
    const isAdmin = await isProjectAdmin(projectId, session.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Only project admins can create tasks." },
        { status: 403 }
      );
    }

    const { title, description, status = "TODO", priority = "LOW", dueDate, assigneeId } = await request.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Task title is required." },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be TODO, IN_PROGRESS, IN_REVIEW, or DONE." },
        { status: 400 }
      );
    }

    // Validate priority values
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority. Must be LOW, MEDIUM, or HIGH." },
        { status: 400 }
      );
    }

    // If assigneeId is provided, verify they are a member of this project
    if (assigneeId) {
      const isAssigneeMember = await isProjectMember(projectId, assigneeId);
      if (!isAssigneeMember) {
        return NextResponse.json(
          { error: "Assignee must be a member of this project." },
          { status: 400 }
        );
      }
    }

    // Create task
    const task = await db.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: session.id,
      },
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
    });

    return NextResponse.json({ message: "Task created successfully.", task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
