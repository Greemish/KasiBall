import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "./errors";

const SESSION_COOKIE = "kasiball_session";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "ADMIN" | "MANAGER" | "REFEREE";

export type SessionPayload = {
  userId: string;
  role: Role;
};

const ROLES: Role[] = ["ADMIN", "MANAGER", "REFEREE"];

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({
    userId: payload.userId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  const cookieStore = cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (
      typeof payload.userId !== "string" ||
      !ROLES.includes(payload.role as Role)
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Current user
// ---------------------------------------------------------------------------

export async function getCurrentUser() {
  const session = await getSessionPayload();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      manager: true,
      referee: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

// ---------------------------------------------------------------------------
// Authorization errors
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AuthError {
  constructor(
    message = "You do not have permission to perform this action"
  ) {
    super(message, 403, "FORBIDDEN");
  }
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

/**
 * Requires an authenticated, active user. Throws UnauthorizedError otherwise.
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

/**
 * Requires an authenticated user whose role is one of `allowed`.
 * Throws UnauthorizedError if not logged in, ForbiddenError if wrong role.
 */
export async function requireRole(...allowed: Role[]) {
  const user = await requireAuth();

  if (!allowed.includes(user.role as Role)) {
    throw new ForbiddenError();
  }

  return user;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function requireManager() {
  return requireRole("MANAGER");
}

export async function requireReferee() {
  return requireRole("REFEREE");
}

 

/**
 * Requires an authenticated manager who belongs to a club.
 * Returns the manager record.
 */
export async function requireManagerWithClub() {
  const user = await requireManager();

  if (!user.manager || !user.manager.clubId) {
    throw new ForbiddenError(
      "You must belong to a club to perform this action",
      // code
    );
  }

  return user.manager;   // has clubId
}

/**
 * Asserts that a manager belongs to the same club as a given team.
 * Use before any manager operation on a team.
 */
export async function assertManagerOwnsTeam(
  managerId: string,
  teamId: string
) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { clubId: true },
  });

  if (!team) {
    throw new NotFoundError("Team not found", "TEAM_NOT_FOUND");
  }

  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    select: { clubId: true },
  });

  if (!manager || manager.clubId !== team.clubId) {
    throw new ForbiddenError(
      "You can only manage teams within your own club"
    );
  }

  return true;
}
/**
 * Requires an authenticated referee with an active Referee profile.
 */
export async function requireRefereeProfile() {
  const user = await requireReferee();

  if (!user.referee) {
    throw new ForbiddenError("Referee profile not found");
  }

  return user.referee;   // has id, userId
}