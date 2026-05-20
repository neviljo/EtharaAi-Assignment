import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/api-utils";
import { NotFoundError } from "@/lib/errors";

export const GET = withErrorHandler(async (request) => {
  const session = requireAuth(request);

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true },
  });

  if (!user) throw new NotFoundError("User", session.id);

  return NextResponse.json({ user });
});
