import { NextRequest } from "next/server";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import {
  errorResponse,
  successResponse,
} from "@/lib/api-response";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Invalid registration data",
        400,
        parsed.error.flatten()
      );
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
    } = parsed.data;

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return errorResponse(
        "An account with this email already exists",
        409
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: "MANAGER",
          isActive: true,
        },
      });

      await tx.manager.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
          phone,
          address,
        },
      });

      return newUser;
    });

    await createSession({
      userId: user.id,
      role: user.role,
    });

    return successResponse(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);

    return errorResponse(
      "Unable to create account",
      500
    );
  }
}