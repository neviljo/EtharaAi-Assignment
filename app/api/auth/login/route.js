import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";
import { withErrorHandler, loginSchema } from "@/lib/api-utils";
import { UnauthorizedError } from "@/lib/errors";

export const POST = withErrorHandler(async (request) => {
  const { email, password } = loginSchema.parse(await request.json());

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) throw new UnauthorizedError("Invalid email or password.");

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) throw new UnauthorizedError("Invalid email or password.");

  const token = generateToken(user);

  const response = NextResponse.json({
    message: "Login successful.",
    user: { id: user.id, name: user.name, email: user.email },
  });

  response.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
});
