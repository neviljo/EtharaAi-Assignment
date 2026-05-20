import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isProjectMember } from "@/lib/project-auth";

export async function GET(request, { params }) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Load task to verify project context
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Must be a project member to see comments
    const isMember = await isProjectMember(task.projectId, session.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden. You are not a member of this project." },
        { status: 403 }
      );
    }

    // Fetch comments
    const comments = await db.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Load task to verify project context
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Must be a project member to comment
    const isMember = await isProjectMember(task.projectId, session.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden. You are not a member of this project." },
        { status: 403 }
      );
    }

    const { content } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content cannot be empty." },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await db.comment.create({
      data: {
        content,
        taskId,
        userId: session.id,
      },
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

    return NextResponse.json({ message: "Comment added successfully.", comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
