import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { withErrorHandler, signupSchema } from "@/lib/api-utils";
import { ConflictError } from "@/lib/errors";

export const POST = withErrorHandler(async (request) => {
  const { name, email, password } = signupSchema.parse(await request.json());

  const existingUser = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError("A user with this email already exists.");
  }

  const hashedPassword = await hashPassword(password);

  const user = await db.user.create({
    data: { name, email: email.toLowerCase(), password: hashedPassword },
  });

  return NextResponse.json(
    {
      message: "User registered successfully.",
      user: { id: user.id, name: user.name, email: user.email },
    },
    { status: 201 },
  );
});
