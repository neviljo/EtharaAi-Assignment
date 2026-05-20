import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, requireAuth, projectSchema } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request) => {
  const session = requireAuth(request);

  const projects = await db.project.findMany({
    where: { members: { some: { userId: session.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tasks: { select: { id: true, status: true, dueDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const projectList = projects.map((project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === "DONE").length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overdueTasks = project.tasks.filter(
      (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < new Date(),
    ).length;
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
});

export const POST = withErrorHandler(async (request) => {
  const session = requireAuth(request);
  const { name, description } = projectSchema.parse(await request.json());

  const project = await db.$transaction(async (tx) => {
    const newProj = await tx.project.create({ data: { name, description } });
    await tx.projectMember.create({
      data: { userId: session.id, projectId: newProj.id, role: "ADMIN" },
    });
    return newProj;
  });

  return NextResponse.json({ project, role: "ADMIN" }, { status: 201 });
});
