import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { verifyRegistration } from "@/lib/services/players";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = context.params;

    const registration = await verifyRegistration(id, user.id);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "VERIFY",
      entityType: "PlayerRegistration",
      entityId: registration.id,
      newValues: { registrationStatus: "VERIFIED" },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(registration);
  } catch (error) {
    return handleRouteError(error);
  }
}