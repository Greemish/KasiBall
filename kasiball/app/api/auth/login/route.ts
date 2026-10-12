import { NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import {
  errorResponse,
  successResponse,
} from "@/lib/api-response";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Invalid login data",
        400,
        parsed.error.flatten()
      );
    }

    const {
      email,
      password,
    } = parsed.data;

    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse(
        "Invalid email or password",
        401
      );
    }

    const passwordValid = await compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return errorResponse(
        "Invalid email or password",
        401
      );
    }

        await createSession({
      userId: user.id,
      role: user.role,
    });

    const ctx = getRequestContext();

    await audit({
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);

    return errorResponse(
      "Unable to log in",
      500
    );
  }
}