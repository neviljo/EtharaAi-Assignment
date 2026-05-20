import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isProjectAdmin } from "@/lib/project-auth";

export async function POST(request, { params }) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if current user is ADMIN
    const isAdmin = await isProjectAdmin(projectId, session.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Only project admins can add members." },
        { status: 403 }
      );
    }

    const { email, role = "MEMBER" } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Member email is required." },
        { status: 400 }
      );
    }

    if (role !== "ADMIN" && role !== "MEMBER") {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN or MEMBER." },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email "${email}" does not have an account. They must sign up first.` },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await db.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: targetUser.id,
          projectId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "This user is already a member of this project." },
        { status: 400 }
      );
    }

    // Add member
    const newMember = await db.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role,
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

    return NextResponse.json(
      {
        message: "Member added successfully.",
        member: {
          id: newMember.id,
          role: newMember.role,
          user: newMember.user,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add project member error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
