import { db } from "@/lib/db";

/**
 * Gets a user's role in a project.
 * @returns {Promise<string|null>} "ADMIN", "MEMBER", or null if not in project
 */
export async function getProjectMemberRole(projectId, userId) {
  if (!projectId || !userId) return null;

  try {
    const member = await db.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    return member ? member.role : null;
  } catch (error) {
    console.error("Error checking project member role:", error);
    return null;
  }
}

/**
 * Checks if a user is an ADMIN of a project.
 */
export async function isProjectAdmin(projectId, userId) {
  const role = await getProjectMemberRole(projectId, userId);
  return role === "ADMIN";
}

/**
 * Checks if a user is a member (ADMIN or MEMBER) of a project.
 */
export async function isProjectMember(projectId, userId) {
  const role = await getProjectMemberRole(projectId, userId);
  return role === "ADMIN" || role === "MEMBER";
}
