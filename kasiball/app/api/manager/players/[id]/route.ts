import { NextRequest } from "next/server";
import { requireManagerWithClub } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { resubmitPlayerRegistrationSchema } from "@/lib/validations/player";
import {
  getClubPlayerRegistration,
  resubmitRegistration,
} from "@/lib/services/players";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();
    const { id } = context.params;

    const registration = await getClubPlayerRegistration(manager.clubId!, id);

    return successResponse(registration);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();
    const { id } = context.params;

    const data = parseBody(
      resubmitPlayerRegistrationSchema,
      await request.json()
    );

    const registration = await resubmitRegistration(
      manager.clubId!,
      id,
      data
    );

    const ctx = getRequestContext();
    await audit({
      userId: manager.userId,
      action: "UPDATE",
      entityType: "PlayerRegistration",
      entityId: registration.id,
      newValues: { registrationStatus: "PENDING", resubmitted: true },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(registration);
  } catch (error) {
    return handleRouteError(error);
  }
}