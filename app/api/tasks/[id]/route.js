import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProjectMemberRole, isProjectAdmin } from "@/lib/project-auth";

export async function PATCH(request, { params }) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Load task to find project context
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Check role in the project
    const role = await getProjectMemberRole(task.projectId, session.id);
    if (!role) {
      return NextResponse.json(
        { error: "Forbidden. You are not a member of this project." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    // RBAC: Members can ONLY update status. Admins can update anything.
    if (role === "MEMBER") {
      // If they are trying to update fields other than 'status', block it
      const keys = Object.keys(body).filter((key) => body[key] !== undefined);
      const invalidKeys = keys.filter((key) => key !== "status");

      if (invalidKeys.length > 0) {
        return NextResponse.json(
          { error: "Forbidden. Members can only update task status." },
          { status: 403 }
        );
      }
    }

    // Prepare update data
    const updateData = {};

    if (status !== undefined) {
      const validStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updateData.status = status;
    }

    // Admin-only fields
    if (role === "ADMIN") {
      if (title !== undefined) {
        if (!title || title.trim() === "") {
          return NextResponse.json({ error: "Task title cannot be empty." }, { status: 400 });
        }
        updateData.title = title;
      }
      if (description !== undefined) {
        updateData.description = description;
      }
      if (priority !== undefined) {
        const validPriorities = ["LOW", "MEDIUM", "HIGH"];
        if (!validPriorities.includes(priority)) {
          return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
        }
        updateData.priority = priority;
      }
      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }
      if (assigneeId !== undefined) {
        if (assigneeId) {
          // Check if assignee is member of project
          const assigneeRole = await getProjectMemberRole(task.projectId, assigneeId);
          if (!assigneeRole) {
            return NextResponse.json({ error: "Assignee must be a project member." }, { status: 400 });
          }
          updateData.assigneeId = assigneeId;
        } else {
          updateData.assigneeId = null;
        }
      }
    }

    // Perform update
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: updateData,
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

    return NextResponse.json({ message: "Task updated successfully.", task: updatedTask });
  } catch (error) {
    console.error("Update task error:", error);
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

    const { id: taskId } = await params;

    // Load task
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Must be project ADMIN to delete tasks
    const isAdmin = await isProjectAdmin(task.projectId, session.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Only project admins can delete tasks." },
        { status: 403 }
      );
    }

    // Delete task (cascade delete handles comments)
    await db.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
