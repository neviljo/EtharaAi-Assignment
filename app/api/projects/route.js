import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get projects user belongs to
    const projects = await db.project.findMany({
      where: {
        members: {
          some: {
            userId: session.id,
          },
        },
      },
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
          select: {
            id: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add aggregate statistics for dashboard use
    const projectList = projects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t) => t.status === "DONE").length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const overdueTasks = project.tasks.filter((t) => {
        return t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < new Date();
      }).length;

      // Extract details
      const userMemberInfo = project.members.find((m) => m.userId === session.id);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        role: userMemberInfo ? userMemberInfo.role : null,
        membersCount: project.members.length,
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        overdueTasksCount: overdueTasks,
        progress,
      };
    });

    return NextResponse.json({ projects: projectList });
  } catch (error) {
    console.error("Fetch projects error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    // Create project and add current user as ADMIN in a transaction
    const project = await db.$transaction(async (tx) => {
      const newProj = await tx.project.create({
        data: {
          name,
          description,
        },
      });

      await tx.projectMember.create({
        data: {
          userId: session.id,
          projectId: newProj.id,
          role: "ADMIN",
        },
      });

      return newProj;
    });

    return NextResponse.json({ project, role: "ADMIN" }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
