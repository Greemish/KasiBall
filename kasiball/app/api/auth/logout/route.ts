import { destroySession, getCurrentUser } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";

export async function POST() {
  const user = await getCurrentUser();
  const ctx = getRequestContext();

  await destroySession();

  if (user) {
    await audit({
      userId: user.id,
      action: "LOGOUT",
      entityType: "User",
      entityId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  return successResponse({
    message: "Logged out successfully",
  });
}